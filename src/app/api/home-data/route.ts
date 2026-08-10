import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Run all database fetches in parallel
    const [
      products,
      categories,
      promotions,
      collections,
      banks,
      bundles
    ] = await Promise.all([
      db.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.category.findMany({
        include: {
          children: {
            include: {
              _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      db.promotionBanner.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.featuredCollection.findMany({
        orderBy: { orderIndex: 'asc' },
      }),
      db.bankQR.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      db.productBundle.findMany({
        where: { isActive: true },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    // Handle storeSetting (check/seed if it does not exist)
    let settings = await db.storeSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await db.storeSetting.create({
        data: {
          id: 'default',
          showStockQuantity: true,
          logoUrl: '',
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

    // Handle heroSlides
    const slides = await db.heroSlide.findMany({
      where: { active: true },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({
      products,
      categories,
      promotions,
      settings,
      heroSlides: slides,
      featuredCollections: collections,
      banks,
      bundles
    });
  } catch (error: any) {
    console.error('Error fetching consolidated home page data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
