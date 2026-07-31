import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly');

    const whereClause = activeOnly === 'true' ? { isActive: true } : {};

    const bundles = await db.productBundle.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bundles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, items, discountPercent, isActive } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Багцын нэр шаардлагатай' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Багцад дор хаяж 1 бараа сонгох шаардлагатай' }, { status: 400 });
    }

    // Fetch products to calculate original total price
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    let originalPriceMnt = 0;
    items.forEach((item: any) => {
      const p = dbProducts.find((prod: any) => prod.id === item.productId);
      if (p) {
        // ALWAYS use regular base price p.priceMnt (not discountPriceMnt) to prevent double discounting
        originalPriceMnt += (p.priceMnt || 0) * (item.quantity || 1);
      }
    });

    const discPct = Number(discountPercent) || 0;
    const bundlePriceMnt = Math.round(originalPriceMnt * (1 - discPct / 100));

    const newBundle = await db.productBundle.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        originalPriceMnt,
        discountPercent: discPct,
        bundlePriceMnt,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(newBundle, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
