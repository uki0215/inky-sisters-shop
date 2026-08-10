import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let slides = await db.heroSlide.findMany({
      where: { active: true },
      orderBy: { orderIndex: 'asc' },
    });



    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch hero slides' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, imageUrl, badge, productId, bundleId, linkUrl } = body;

    const newSlide = await db.heroSlide.create({
      data: {
        title,
        subtitle,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
        badge: badge || '🔥 ОНЦЛОХ БАРАА',
        productId: productId || null,
        bundleId: bundleId || null,
        linkUrl: linkUrl || null,
      },
    });

    return NextResponse.json(newSlide);
  } catch (error) {
    console.error('Error creating hero slide:', error);
    return NextResponse.json({ error: 'Failed to create hero slide' }, { status: 500 });
  }
}
