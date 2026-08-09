import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOrderNumber } from '@/lib/utils';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL' && status !== 'HAS_RETURN' && status !== 'HAS_EDIT') {
      where.paymentStatus = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      notes,
      selectedBank,
      items,
    } = body;

    if (!customerName || !customerPhone || !deliveryAddress || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Овог нэр, утас, хаяг болон барааны мэдээллийг бүрэн оруулна уу.' },
        { status: 400 }
      );
    }

    // Verify stock availability & process regular products vs bundles
    let totalMnt = 0;
    const orderItemsData = [];
    const stockDecrements: { productId: string; quantity: number }[] = [];

    const defaultProduct = await db.product.findFirst();

    for (const item of items) {
      const isBundleItem = item.isBundle || (typeof item.id === 'string' && item.id.startsWith('bundle-'));

      if (isBundleItem) {
        const bundleId = item.bundleId || item.id.replace('bundle-', '');
        const bundle = await db.productBundle.findUnique({
          where: { id: bundleId },
          include: { items: { include: { product: true } } },
        });

        if (!bundle) {
          return NextResponse.json({ error: `Иж бүрэн багц олдсонгүй: ${item.name}` }, { status: 400 });
        }

        const bundlePrice = item.priceMnt || bundle.bundlePriceMnt;
        totalMnt += bundlePrice * item.quantity;

        const firstProdId = bundle.items?.[0]?.productId || defaultProduct?.id;
        if (!firstProdId) {
          return NextResponse.json({ error: `'${bundle.name}' багцад тохирох бараа байхгүй байна.` }, { status: 400 });
        }

        // 1. Record Main Bundle Set Item
        const setLabel = bundle.name.startsWith('🎁') ? bundle.name : `🎁 [ИЖ БҮРЭН БАГЦ] ${bundle.name}`;
        orderItemsData.push({
          productId: firstProdId,
          productName: setLabel,
          barcode: `BUNDLE-${bundle.id.slice(0, 8)}`,
          priceMnt: bundlePrice,
          quantity: item.quantity,
        });

        // 2. Record Sub-items & Check Stock (Show non-zero price and discount info)
        for (const bItem of bundle.items) {
          if (bItem.product) {
            const requiredQty = bItem.quantity * item.quantity;

            if (bItem.product.stock < requiredQty) {
              return NextResponse.json(
                { error: `'${bundle.name}' багцын '${bItem.product.name}' барааны үлдэгдэл хүрэлцэхгүй байна (${bItem.product.stock} ш байна).` },
                { status: 400 }
              );
            }

            const p = bItem.product;
            const hasProdDiscount = p.isDiscounted && p.discountPriceMnt;
            const unitPrice = hasProdDiscount ? p.discountPriceMnt : p.priceMnt;
            const unitCost = (p.costYuan > 0 && p.yuanRate > 0) ? p.costYuan * p.yuanRate : (p.costMnt || 0);

            let descText = `   └─ [Багцын Бараа] ${p.name} (${bItem.quantity}ш)`;
            if (hasProdDiscount) {
              descText += ` (Хямдралтай: ${p.priceMnt}₮ ➔ ${p.discountPriceMnt}₮)`;
            } else {
              descText += ` (Нэгж үнэ: ${p.priceMnt}₮)`;
            }

            orderItemsData.push({
              productId: bItem.productId,
              productName: descText,
              barcode: p.barcode || `SUB-${bItem.productId.slice(0, 8)}`,
              priceMnt: unitPrice,
              costMnt: unitCost,
              quantity: requiredQty,
            });

            stockDecrements.push({ productId: bItem.productId, quantity: requiredQty });
          }
        }
      } else {
        const realProductId = item.productId || (typeof item.id === 'string' ? item.id.split('__')[0] : item.id);
        const product = await db.product.findUnique({ where: { id: realProductId } });
        if (!product) {
          return NextResponse.json({ error: `Бараа олдсонгүй: ${item.name}` }, { status: 400 });
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `'${product.name}' барааны үлдэгдэл хүрэлцэхгүй байна. Боломжит үлдэгдэл: ${product.stock}` },
            { status: 400 }
          );
        }

        const itemPrice = product.isDiscounted && product.discountPriceMnt
          ? product.discountPriceMnt
          : product.priceMnt;

        const unitCost = (product.costYuan > 0 && product.yuanRate > 0) ? product.costYuan * product.yuanRate : (product.costMnt || 0);

        totalMnt += itemPrice * item.quantity;

        const chosenImgTag = item.selectedImageUrl ? ` [IMG:${item.selectedImageUrl}]` : '';

        orderItemsData.push({
          productId: product.id,
          productName: `${product.name}${chosenImgTag}`,
          barcode: product.barcode,
          priceMnt: itemPrice,
          costMnt: unitCost,
          quantity: item.quantity,
        });

        stockDecrements.push({ productId: product.id, quantity: item.quantity });
      }
    }

    const orderNumber = generateOrderNumber();

    // Create Order in Database
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        deliveryAddress,
        notes: notes || '',
        totalMnt,
        selectedBank: selectedBank || 'KHAN',
        paymentStatus: 'PENDING_PAYMENT',
        orderStatus: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Deduct stock for all items / bundle sub-items
    for (const dec of stockDecrements) {
      await db.product.update({
        where: { id: dec.productId },
        data: {
          stock: {
            decrement: dec.quantity,
          },
        },
      });
    }

    // Fetch the bank details for QR confirmation
    const bank = await db.bankQR.findFirst({
      where: { bankCode: selectedBank, isActive: true },
    });

    // Trigger confirmation email if email provided
    if (customerEmail) {
      sendOrderConfirmationEmail({
        to: customerEmail,
        orderNumber,
        customerName,
        customerPhone,
        totalMnt,
        items: orderItemsData,
      }).catch((e) => console.error('Background email sending error:', e));
    }

    return NextResponse.json({
      order,
      bank,
      message: 'Захиалга амжилттай үүсгэгдлээ. Төлбөрөө банкны QR уншуулан хийнэ үү.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
