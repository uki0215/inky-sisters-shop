import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    const banner = await db.promotionBanner.findFirst({
      ...(isAdmin ? {} : { where: { active: true } }),
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
    const { title, subtitle, imageUrl, active } = body;

    const isActive = active !== undefined ? Boolean(active) : true;

    // Deactivate existing banners if activating new one
    if (isActive) {
      await db.promotionBanner.updateMany({ data: { active: false } });
    }

    // Check if there is an existing promo banner to update, or create new
    const existing = await db.promotionBanner.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let banner;
    if (existing) {
      banner = await db.promotionBanner.update({
        where: { id: existing.id },
        data: {
          title,
          subtitle: subtitle || '',
          imageUrl: imageUrl || '',
          active: isActive,
        },
      });
    } else {
      banner = await db.promotionBanner.create({
        data: {
          title,
          subtitle: subtitle || '',
          imageUrl: imageUrl || '',
          discountCode: '',
          active: isActive,
        },
      });
    }

    return NextResponse.json(banner, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
