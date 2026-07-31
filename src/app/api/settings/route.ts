import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.storeSetting.findUnique({
      where: { id: 'default' },
    });

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
          banner1Image: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=800&auto=format&fit=crop&q=80',
          banner1Title: 'Эстэтик Пастел Үзэгнүүд',
          banner1Link: '#products',
          banner2Image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
          banner2Title: 'Планер & Төлөвлөгч Дэвтрүүд',
          banner2Link: '#products',
          banner3Image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
          banner3Title: 'Зургийн Усан Будаг & Багс',
          banner3Link: '#products',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      showStockQuantity,
      logoUrl,
      heroTitle,
      heroSubtitle,
      heroProductId,
      heroImageUrl,
      heroBadge,
      address,
      phone,
      email,
      workingHours,
      banner1Image,
      banner1Title,
      banner1Link,
      banner1ProductId,
      banner2Image,
      banner2Title,
      banner2Link,
      banner2ProductId,
      banner3Image,
      banner3Title,
      banner3Link,
      banner3ProductId,
      bundleSectionTitle,
      bundleSectionBadge,
    } = body;

    const updated = await db.storeSetting.upsert({
      where: { id: 'default' },
      update: {
        ...(typeof showStockQuantity === 'boolean' && { showStockQuantity }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(heroTitle !== undefined && { heroTitle }),
        ...(heroSubtitle !== undefined && { heroSubtitle }),
        ...(heroProductId !== undefined && { heroProductId }),
        ...(heroImageUrl !== undefined && { heroImageUrl }),
        ...(heroBadge !== undefined && { heroBadge }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(workingHours !== undefined && { workingHours }),
        ...(banner1Image !== undefined && { banner1Image }),
        ...(banner1Title !== undefined && { banner1Title }),
        ...(banner1Link !== undefined && { banner1Link }),
        ...(banner1ProductId !== undefined && { banner1ProductId }),
        ...(banner2Image !== undefined && { banner2Image }),
        ...(banner2Title !== undefined && { banner2Title }),
        ...(banner2Link !== undefined && { banner2Link }),
        ...(banner2ProductId !== undefined && { banner2ProductId }),
        ...(banner3Image !== undefined && { banner3Image }),
        ...(banner3Title !== undefined && { banner3Title }),
        ...(banner3Link !== undefined && { banner3Link }),
        ...(banner3ProductId !== undefined && { banner3ProductId }),
        ...(bundleSectionTitle !== undefined && { bundleSectionTitle }),
        ...(bundleSectionBadge !== undefined && { bundleSectionBadge }),
      },
      create: {
        id: 'default',
        showStockQuantity: showStockQuantity ?? true,
        logoUrl: logoUrl || '/logo.svg',
        heroTitle: heroTitle || 'Онцлох Бичиг Хэргийн Цуглуулга',
        heroSubtitle: heroSubtitle || 'Хамгийн тренд болж буй пастел үзэг, эстетик дэвтрүүдийг шууд онлайн захиалаарай.',
        heroProductId: heroProductId || null,
        heroImageUrl: heroImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
        heroBadge: heroBadge || '🔥 ЭРЭЛТТЭЙ БАРАА',
        address: address || 'Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө',
        phone: phone || '88112233, 99112233',
        email: email || 'info@inkysisters.mn',
        workingHours: workingHours || 'Даваа - Ням: 10:00 - 20:00',
        banner1Image: banner1Image || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=800&auto=format&fit=crop&q=80',
        banner1Title: banner1Title || 'Эстэтик Пастел Үзэгнүүд',
        banner1Link: banner1Link || '#products',
        banner1ProductId: banner1ProductId || null,
        banner2Image: banner2Image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        banner2Title: banner2Title || 'Планер & Төлөвлөгч Дэвтрүүд',
        banner2Link: banner2Link || '#products',
        banner2ProductId: banner2ProductId || null,
        banner3Image: banner3Image || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
        banner3Title: banner3Title || 'Зургийн Усан Будаг & Багс',
        banner3Link: banner3Link || '#products',
        banner3ProductId: banner3ProductId || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
