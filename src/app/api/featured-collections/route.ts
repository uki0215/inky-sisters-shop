import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const collections = await db.featuredCollection.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    return NextResponse.json(collections);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, imageUrl, linkCategory, productId, orderIndex, active } = body;

    const collection = await db.featuredCollection.create({
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80',
        linkCategory: linkCategory || null,
        productId: productId || null,
        orderIndex: orderIndex ? Number(orderIndex) : 0,
        active: active !== undefined ? !!active : true,
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
