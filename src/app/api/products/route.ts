import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBarcode } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const barcode = searchParams.get('barcode');
    const featured = searchParams.get('featured');

    const where: any = {};

    if (categorySlug && categorySlug !== 'all') {
      where.category = { slug: categorySlug };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (barcode) {
      where.barcode = barcode;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const products = await db.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let {
      barcode,
      name,
      description,
      categoryId,
      imageUrl,
      costYuan,
      yuanRate,
      priceMnt,
      priceYuan,
      boxCount,
      unitsPerBox,
      stock,
      isDiscounted,
      discountPercent,
      discountPriceMnt,
      isFeatured,
    } = body;

    // Generate Barcode if missing or requested auto
    if (!barcode || barcode.trim() === '') {
      barcode = generateBarcode();
    }

    const yuanRateVal = Number(yuanRate) || 485;
    const costYuanVal = Number(costYuan) || 0;
    const costMntVal = costYuanVal * yuanRateVal;
    
    // User / Admin sets the selling price (priceMnt)
    const priceMntVal = Number(priceMnt) || 0;
    const priceYuanVal = priceYuan ? Number(priceYuan) : (priceMntVal > 0 ? Number((priceMntVal / yuanRateVal).toFixed(2)) : 0);

    const boxCountVal = Number(boxCount) || 1;
    const unitsPerBoxVal = Number(unitsPerBox) || 1;
    
    // Calculate total stock if adding boxes, or use explicit stock
    const calculatedStock = stock !== undefined ? Number(stock) : (boxCountVal * unitsPerBoxVal);

    let calcDiscountPrice = discountPriceMnt ? Number(discountPriceMnt) : null;
    if (isDiscounted && discountPercent && !calcDiscountPrice && priceMntVal > 0) {
      calcDiscountPrice = Math.round(priceMntVal * (1 - Number(discountPercent) / 100));
    }

    const product = await db.product.create({
      data: {
        barcode,
        name,
        description: description || '',
        categoryId,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80',
        costYuan: costYuanVal,
        yuanRate: yuanRateVal,
        costMnt: costMntVal,
        priceMnt: priceMntVal,
        priceYuan: priceYuanVal,
        boxCount: boxCountVal,
        unitsPerBox: unitsPerBoxVal,
        stock: calculatedStock,
        isDiscounted: !!isDiscounted,
        discountPercent: discountPercent ? Number(discountPercent) : null,
        discountPriceMnt: calcDiscountPrice,
        discountEndDate: isDiscounted && body.discountEndDate ? new Date(body.discountEndDate) : null,
        isFeatured: !!isFeatured,
      },
    });

    // Log initial product history
    await db.productHistory.create({
      data: {
        productId: product.id,
        changeType: 'INITIAL',
        description: `Шинээр бүртгэв. Зарах үнэ: ${priceMntVal.toLocaleString()}₮ | Ханш: ${yuanRateVal}₮ | Авсан үнэ: ¥${costYuanVal}`,
        newCostYuan: costYuanVal,
        newYuanRate: yuanRateVal,
        newPriceMnt: priceMntVal,
        addedStock: calculatedStock,
        newStock: calculatedStock,
      },
    });

    // Log restock expense if stock > 0
    if (calculatedStock > 0 && costMntVal > 0) {
      await db.financialLog.create({
        data: {
          type: 'RESTOCK_EXPENSE',
          amountMnt: costMntVal * calculatedStock,
          description: `Шинэ бараа авалт: ${name} (${calculatedStock} ширхэг)`,
          referenceId: product.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
