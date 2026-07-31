import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, paymentMethod = 'CASH', paidAmountMnt, notes, customerName, customerPhone } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Сагс хоосон байна' }, { status: 400 });
    }

    let totalMnt = 0;
    const orderItemsData = [];
    const stockDecrements: { productId: string; quantity: number }[] = [];

    // Get fallback valid product ID to satisfy Prisma foreign key constraint if bundle has no items
    const defaultProduct = await db.product.findFirst();
    if (!defaultProduct) {
      return NextResponse.json({ error: 'Системд ядаж 1 бараа бүртгэлтэй байх шаардлагатай.' }, { status: 400 });
    }

    // Validate stock and compute total
    for (const item of items) {
      const isBundleItem = item.isBundle || (typeof item.productId === 'string' && item.productId.startsWith('bundle-'));

      if (isBundleItem) {
        const bundleId = item.bundleId || item.productId.replace('bundle-', '');
        const bundle = await db.productBundle.findUnique({
          where: { id: bundleId },
          include: { items: { include: { product: true } } },
        });

        const bundlePrice = item.priceMnt || bundle?.bundlePriceMnt || 0;
        totalMnt += bundlePrice * item.quantity;

        // Use valid product ID from bundle's first item or default fallback product
        const validProdId = bundle?.items?.[0]?.productId || defaultProduct.id;

        orderItemsData.push({
          productId: validProdId,
          productName: item.productName || bundle?.name || '🎁 Иж бүрэн багц',
          barcode: item.barcode || `BDL-${bundleId.slice(-6)}`,
          priceMnt: bundlePrice,
          quantity: item.quantity,
        });

        // Decrement stock for sub-items if present
        if (bundle?.items) {
          for (const bItem of bundle.items) {
            if (bItem.product) {
              const requiredQty = bItem.quantity * item.quantity;
              if (bItem.product.stock < requiredQty) {
                return NextResponse.json(
                  { error: `'${bundle.name}' багцын '${bItem.product.name}' барааны үлдэгдэл хүрэлцэхгүй байна (${bItem.product.stock} ш байна)` },
                  { status: 400 }
                );
              }
              stockDecrements.push({ productId: bItem.productId, quantity: requiredQty });
            }
          }
        }
      } else {
        const product = await db.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return NextResponse.json({ error: `Бараа олдсонгүй: ${item.productName}` }, { status: 404 });
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `"${product.name}" барааны үлдэгдэл хүрэлцэхгүй байна (${product.stock} ш байна)` },
            { status: 400 }
          );
        }

        totalMnt += item.priceMnt * item.quantity;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          priceMnt: item.priceMnt,
          quantity: item.quantity,
        });

        stockDecrements.push({ productId: product.id, quantity: item.quantity });
      }
    }

    const orderNumber = `POS-${Date.now().toString().slice(-6)}`;
    const paidAmount = Number(paidAmountMnt) || totalMnt;
    const changeMnt = Math.max(0, paidAmount - totalMnt);

    const isCredit = paymentMethod === 'CREDIT';
    const paymentStatus = isCredit ? 'UNPAID' : 'PAID';
    const paymentConfirmedAt = isCredit ? null : new Date();

    // Create completed POS order
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: customerName || (isCredit ? 'Зээлдэгч Үйлчлүүлэгч' : 'Дэлгүүрийн Үйлчлүүлэгч'),
        customerPhone: customerPhone || '—',
        deliveryAddress: 'Дэлгүүрээс шууд авсан (POS)',
        notes: notes || (isCredit ? '⏳ Зээлээр авсан (Дараа төлбөрт)' : 'Кассын борлуулалт'),
        totalMnt,
        selectedBank: paymentMethod === 'TRANSFER' ? 'BANK_TRANSFER' : paymentMethod,
        paymentMethod,
        paymentStatus,
        orderStatus: 'DELIVERED',
        paymentConfirmedAt,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    // Decrement stock and log ProductHistory for each product
    for (const dec of stockDecrements) {
      const updatedProd = await db.product.update({
        where: { id: dec.productId },
        data: {
          stock: { decrement: dec.quantity },
        },
      });

      try {
        await db.productHistory.create({
          data: {
            productId: dec.productId,
            changeType: 'POS_SALE',
            description: `Кассын борлуулалт (${orderNumber}): -${dec.quantity} ш`,
            addedStock: -dec.quantity,
            newStock: updatedProd.stock,
            note: `Төлбөр: ${paymentMethod === 'CASH' ? 'Бэлэн мөнгө' : paymentMethod === 'CARD' ? 'Карт' : 'Шилжүүлэг'}`,
          },
        });
      } catch (e) {
        console.error('Failed to log product history for POS sale', e);
      }
    }

    // Create Financial Log for Income
    await db.financialLog.create({
      data: {
        type: 'ORDER_INCOME',
        amountMnt: totalMnt,
        description: `Кассын шууд орлого (${paymentMethod === 'CASH' ? 'Бэлэн' : paymentMethod === 'CARD' ? 'Карт' : 'Шилжүүлэг'}): ${orderNumber}`,
        referenceId: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      changeMnt,
      totalMnt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
