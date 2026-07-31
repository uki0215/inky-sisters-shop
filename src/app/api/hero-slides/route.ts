import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let slides = await db.heroSlide.findMany({
      where: { active: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Seed default hero slides if none exist
    if (slides.length === 0) {
      const defaultProducts = await db.product.findMany({ take: 3 });

      const created = await Promise.all([
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
      slides = created;
    }

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
