import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const bundle = await db.productBundle.findUnique({
      where: { id: resolvedParams.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const bundleId = resolvedParams.id;
    const body = await request.json();
    const { name, description, imageUrl, items, discountPercent, isActive } = body;

    const existing = await db.productBundle.findUnique({
      where: { id: bundleId },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    // If items are provided, calculate new original price & replace bundle items
    let itemsToProcess = items;
    if (itemsToProcess && Array.isArray(itemsToProcess)) {
      const productIds = itemsToProcess.map((i: any) => i.productId);
      const dbProducts = await db.product.findMany({
        where: { id: { in: productIds } },
      });

      let originalPriceMnt = 0;
      itemsToProcess.forEach((item: any) => {
        const p = dbProducts.find((prod: any) => prod.id === item.productId);
        if (p) {
          // ALWAYS use regular base price p.priceMnt (not discountPriceMnt) to prevent double discounting
          originalPriceMnt += (p.priceMnt || 0) * (item.quantity || 1);
        }
      });

      updateData.originalPriceMnt = originalPriceMnt;

      const discPct = discountPercent !== undefined ? Number(discountPercent) : existing.discountPercent;
      updateData.discountPercent = discPct;
      updateData.bundlePriceMnt = Math.round(originalPriceMnt * (1 - discPct / 100));

      // Recreate items
      await db.bundleItem.deleteMany({ where: { bundleId } });
      updateData.items = {
        create: itemsToProcess.map((item: any) => ({
          productId: item.productId,
          quantity: Number(item.quantity) || 1,
        })),
      };
    } else if (discountPercent !== undefined) {
      const discPct = Number(discountPercent);
      updateData.discountPercent = discPct;
      updateData.bundlePriceMnt = Math.round(existing.originalPriceMnt * (1 - discPct / 100));
    }

    const updated = await db.productBundle.update({
      where: { id: bundleId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    await db.productBundle.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
