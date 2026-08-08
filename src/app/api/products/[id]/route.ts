import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const existing = await db.product.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const {
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
      addStock, // Admin can add stock directly
      isDiscounted,
      discountPercent,
      discountPriceMnt,
      isFeatured,
    } = body;

    if (barcode && barcode.trim() !== '') {
      const cleanBarcode = barcode.trim();
      const existingBarcodeProduct = await db.product.findUnique({
        where: { barcode: cleanBarcode },
      });

      if (existingBarcodeProduct && existingBarcodeProduct.id !== existing.id) {
        return NextResponse.json(
          { error: `"${cleanBarcode}" бар код дээр "${existingBarcodeProduct.name}" бараа аль хэдийн бүртгэгдсэн байна!` },
          { status: 400 }
        );
      }
    }

    const yuanRateVal = yuanRate !== undefined ? Number(yuanRate) : existing.yuanRate;
    const costYuanVal = costYuan !== undefined ? Number(costYuan) : existing.costYuan;
    const costMntInput = body.costMnt !== undefined ? Number(body.costMnt) : existing.costMnt;
    const costMntVal = (costYuanVal > 0 && yuanRateVal > 0)
      ? costYuanVal * yuanRateVal
      : costMntInput;

    const priceMntVal = priceMnt !== undefined ? Number(priceMnt) : existing.priceMnt;
    const priceYuanVal = priceYuan !== undefined
      ? Number(priceYuan)
      : Number((priceMntVal / (yuanRateVal || 1)).toFixed(2));

    let updatedStock = stock !== undefined ? Number(stock) : existing.stock;
    if (addStock) {
      const addedCount = Number(addStock);
      updatedStock += addedCount;

      // Log financial restock expense
      if (addedCount > 0 && costMntVal > 0) {
        await db.financialLog.create({
          data: {
            type: 'RESTOCK_EXPENSE',
            amountMnt: costMntVal * addedCount,
            description: `Бараа нөхөн таталт: ${name || existing.name} (+${addedCount} ширхэг)`,
            referenceId: existing.id,
          },
        });
      }
    }

    let calcDiscountPrice = discountPriceMnt !== undefined ? Number(discountPriceMnt) : existing.discountPriceMnt;
    if (isDiscounted && discountPercent && priceMntVal > 0) {
      calcDiscountPrice = Math.round(priceMntVal * (1 - Number(discountPercent) / 100));
    }

    const updated = await db.product.update({
      where: { id: params.id },
      data: {
        barcode: barcode || existing.barcode,
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        categoryId: categoryId || existing.categoryId,
        imageUrl: imageUrl || existing.imageUrl,
        costYuan: costYuanVal,
        yuanRate: yuanRateVal,
        costMnt: costMntVal,
        priceMnt: priceMntVal,
        priceYuan: priceYuanVal,
        boxCount: boxCount !== undefined ? Number(boxCount) : existing.boxCount,
        unitsPerBox: unitsPerBox !== undefined ? Number(unitsPerBox) : existing.unitsPerBox,
        stock: updatedStock,
        isDiscounted: isDiscounted !== undefined ? !!isDiscounted : existing.isDiscounted,
        discountPercent: discountPercent !== undefined ? (discountPercent ? Number(discountPercent) : null) : existing.discountPercent,
        discountPriceMnt: calcDiscountPrice,
        discountEndDate: isDiscounted ? (body.discountEndDate ? new Date(body.discountEndDate) : null) : null,
        isFeatured: isFeatured !== undefined ? !!isFeatured : existing.isFeatured,
      },
      include: { category: true },
    });

    // Create history entry if any key values changed or stock added
    const changes: string[] = [];
    if (addStock && Number(addStock) > 0) {
      changes.push(`Орлого +${addStock} ш нөхөж авав`);
    } else if (stock !== undefined && Number(stock) !== existing.stock) {
      changes.push(`Үлдэгдэл: ${existing.stock} ш -> ${updatedStock} ш`);
    }

    if (priceMntVal !== existing.priceMnt) {
      changes.push(`Зарах үнэ: ${existing.priceMnt.toLocaleString()}₮ -> ${priceMntVal.toLocaleString()}₮`);
    }

    if (costMntVal !== existing.costMnt) {
      changes.push(`1ш өртөг: ${existing.costMnt.toLocaleString()}₮ -> ${costMntVal.toLocaleString()}₮`);
    }

    if (costYuanVal !== existing.costYuan && costYuanVal > 0) {
      changes.push(`Авсан үнэ (¥): ¥${existing.costYuan} -> ¥${costYuanVal}`);
    }

    if (yuanRateVal !== existing.yuanRate && yuanRateVal > 0) {
      changes.push(`Юанийн ханш: ${existing.yuanRate}₮ -> ${yuanRateVal}₮`);
    }

    if (changes.length > 0) {
      const changeType = addStock ? 'RESTOCK' : (priceMntVal !== existing.priceMnt ? 'PRICE_CHANGE' : 'EDIT');
      await db.productHistory.create({
        data: {
          productId: existing.id,
          changeType,
          description: changes.join(' | '),
          oldCostYuan: existing.costYuan,
          newCostYuan: costYuanVal,
          oldYuanRate: existing.yuanRate,
          newYuanRate: yuanRateVal,
          oldPriceMnt: existing.priceMnt,
          newPriceMnt: priceMntVal,
          addedStock: addStock ? Number(addStock) : null,
          newStock: updatedStock,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('barcode')) {
      return NextResponse.json(
        { error: 'Энэ бар код аль хэдийн өөр бараан дээр бүртгэгдсэн байна!' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // 1. Delete associated productHistory
    await db.productHistory.deleteMany({ where: { productId } });

    // 2. Delete associated orderItems
    await db.orderItem.deleteMany({ where: { productId } });

    // 3. Delete the product
    await db.product.delete({ where: { id: productId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
