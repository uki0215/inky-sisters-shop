import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const banner = await db.promotionBanner.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(banner || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, imageUrl, discountCode, active } = body;

    // Deactivate existing
    if (active) {
      await db.promotionBanner.updateMany({ data: { active: false } });
    }

    const banner = await db.promotionBanner.create({
      data: {
        title,
        subtitle: subtitle || '',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
        discountCode: discountCode || '',
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
