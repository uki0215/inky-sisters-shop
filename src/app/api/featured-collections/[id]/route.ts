import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, subtitle, imageUrl, linkCategory, productId, orderIndex, active } = body;

    const updated = await db.featuredCollection.update({
      where: { id: params.id },
      data: {
        title,
        subtitle: subtitle !== undefined ? subtitle : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        linkCategory: linkCategory !== undefined ? linkCategory : undefined,
        productId: productId !== undefined ? productId : undefined,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined,
        active: active !== undefined ? !!active : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.featuredCollection.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
