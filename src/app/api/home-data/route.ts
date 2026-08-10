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

    // Handle heroSlides (check/seed if none exist)
    let slides = await db.heroSlide.findMany({
      where: { active: true },
      orderBy: { orderIndex: 'asc' },
    });

    if (slides.length === 0) {
      // Find up to 3 products to link defaults to
      const defaultProducts = products.slice(0, 3);
      slides = await Promise.all([
        db.heroSlide.create({
          data: {
            title: 'Пастел Үзэг & Эстетик Тэмдэглэлийн Дэвтэр',
            subtitle: 'Суралцах ба ажлын ширээний үзэмжийг чимэх 2026 оны хамгийн сүүлийн үеийн пастел цуглуулга.',
            imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
            badge: '🔥 2026 ОНЫ ТРЕНД',
            productId: defaultProducts[0]?.id || null,
            orderIndex: 1,
          },
        }),
        db.heroSlide.create({
          data: {
            title: 'Bullet Journal & Савхин Хавтастай Планнер',
            subtitle: 'Зорилгоо төлөвлөх, өдрийн тэмдэглэл бичих өндөр чанартай 120gsm зузаан цаастай дэвтрүүд.',
            imageUrl: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=1200&auto=format&fit=crop&q=80',
            badge: '✨ ШИНЭЭР ИРСЭН',
            productId: defaultProducts[1]?.id || null,
            orderIndex: 2,
          },
        }),
        db.heroSlide.create({
          data: {
            title: 'Мэргэжлийн Усан Будаг & Art Studio Хэрэгслүүд',
            subtitle: 'Уран зураг, эскиз ба каллиграфи сонирхогчдод зориулсан 24 өнгийн ком иж бүрдэл.',
            imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&auto=format&fit=crop&q=80',
            badge: '🎨 ОНЦЛОХ ЦУГЛУУЛГА',
            productId: defaultProducts[2]?.id || null,
            orderIndex: 3,
          },
        }),
      ]);
    }

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
