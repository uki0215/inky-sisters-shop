import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.storeSetting.findFirst();

    if (!settings) {
      settings = await db.storeSetting.create({
        data: {
          id: 'default',
          showStockQuantity: true,
          logoUrl: '/logo.svg',
          heroTitle: 'Онцлох Бичиг Хэргийн Цуглуулга',
          heroSubtitle: 'Хамгийн тренд болж буй пастел үзэг, эстетик тэмдэглэлийн дэвтэр ба зургийн хэрэгслүүдийг шууд онлайн захиалаарай.',
          heroImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
          heroBadge: '🔥 ЭРЭЛТТЭЙ БАРАА',
          address: 'Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө',
          phone: '88112233, 99112233',
          email: 'info@inkysisters.mn',
          workingHours: 'Даваа - Ням: 10:00 - 20:00',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let existing = await db.storeSetting.findFirst();

    if (!existing) {
      existing = await db.storeSetting.create({
        data: {
          id: 'default',
          showStockQuantity: body.showStockQuantity ?? true,
          logoUrl: body.logoUrl || '/logo.svg',
          heroTitle: body.heroTitle || 'Онцлох Бичиг Хэргийн Цуглуулга',
          heroSubtitle: body.heroSubtitle || 'Хамгийн тренд болж буй пастел үзэг, эстетик тэмдэглэлийн дэвтэр ба зургийн хэрэгслүүдийг шууд онлайн захиалаарай.',
          heroImageUrl: body.heroImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
          heroBadge: body.heroBadge || '🔥 ЭРЭЛТТЭЙ БАРАА',
          address: body.address || 'Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө',
          phone: body.phone || '88112233, 99112233',
          email: body.email || 'info@inkysisters.mn',
          workingHours: body.workingHours || 'Даваа - Ням: 10:00 - 20:00',
        },
      });
    } else {
      const updateData: any = {};
      if (typeof body.showStockQuantity === 'boolean') updateData.showStockQuantity = body.showStockQuantity;
      if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
      if (body.heroTitle !== undefined) updateData.heroTitle = body.heroTitle;
      if (body.heroSubtitle !== undefined) updateData.heroSubtitle = body.heroSubtitle;
      if (body.heroProductId !== undefined) updateData.heroProductId = body.heroProductId;
      if (body.heroImageUrl !== undefined) updateData.heroImageUrl = body.heroImageUrl;
      if (body.heroBadge !== undefined) updateData.heroBadge = body.heroBadge;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.workingHours !== undefined) updateData.workingHours = body.workingHours;
      if (body.banner1Image !== undefined) updateData.banner1Image = body.banner1Image;
      if (body.banner1Title !== undefined) updateData.banner1Title = body.banner1Title;
      if (body.banner1Link !== undefined) updateData.banner1Link = body.banner1Link;
      if (body.banner1ProductId !== undefined) updateData.banner1ProductId = body.banner1ProductId;
      if (body.banner2Image !== undefined) updateData.banner2Image = body.banner2Image;
      if (body.banner2Title !== undefined) updateData.banner2Title = body.banner2Title;
      if (body.banner2Link !== undefined) updateData.banner2Link = body.banner2Link;
      if (body.banner2ProductId !== undefined) updateData.banner2ProductId = body.banner2ProductId;
      if (body.banner3Image !== undefined) updateData.banner3Image = body.banner3Image;
      if (body.banner3Title !== undefined) updateData.banner3Title = body.banner3Title;
      if (body.banner3Link !== undefined) updateData.banner3Link = body.banner3Link;
      if (body.banner3ProductId !== undefined) updateData.banner3ProductId = body.banner3ProductId;
      if (body.bundleSectionTitle !== undefined) updateData.bundleSectionTitle = body.bundleSectionTitle;
      if (body.bundleSectionBadge !== undefined) updateData.bundleSectionBadge = body.bundleSectionBadge;

      existing = await db.storeSetting.update({
        where: { id: existing.id },
        data: updateData,
      });
    }

    return NextResponse.json(existing);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 500 });
  }
}
