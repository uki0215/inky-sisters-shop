import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Category } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Run all database fetches in parallel
    const [
      products,
      flatCategories,
      promotions,
      collections,
      banks,
      bundles,
      settings,
      slides
    ] = await Promise.all([
      db.product.findMany({
        select: {
          id: true,
          barcode: true,
          name: true,
          description: true,
          categoryId: true,
          imageUrl: true,
          priceMnt: true,
          stock: true,
          isDiscounted: true,
          discountPercent: true,
          discountPriceMnt: true,
          discountEndDate: true,
          isFeatured: true,
          clickCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
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
        select: {
          id: true,
          barcode: true,
          name: true,
          description: true,
          imageUrl: true,
          originalPriceMnt: true,
          discountPercent: true,
          bundlePriceMnt: true,
          isActive: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  priceMnt: true,
                  isDiscounted: true,
                  discountPercent: true,
                  discountPriceMnt: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.storeSetting.findUnique({
        where: { id: 'default' },
      }),
      db.heroSlide.findMany({
        where: { active: true },
        orderBy: { orderIndex: 'asc' },
      })
    ]);

    // Build a category lookup map by ID
    const categoryMap: Record<string, { id: string; name: string; slug: string }> = {};
    for (const cat of (flatCategories as Category[])) {
      categoryMap[cat.id] = { id: cat.id, name: cat.name, slug: cat.slug };
    }

    // Build the category tree hierarchy in memory
    const childrenMap: Record<string, Category[]> = {};
    const rootCategories: Category[] = [];

    for (const cat of (flatCategories as Category[])) {
      if (cat.parentId) {
        if (!childrenMap[cat.parentId]) {
          childrenMap[cat.parentId] = [];
        }
        childrenMap[cat.parentId].push(cat);
      } else {
        rootCategories.push(cat);
      }
    }

    const categories = rootCategories.map((parent: Category) => ({
      ...parent,
      children: childrenMap[parent.id] || [],
    }));

    // Attach category objects to products in memory to avoid the database relation roundtrip
    const productsWithCategory = (products as any[]).map((prod) => ({
      ...prod,
      category: categoryMap[prod.categoryId] || null,
    }));

    const finalSettings = settings || {
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
    };

    return NextResponse.json({
      products: productsWithCategory,
      categories,
      promotions,
      settings: finalSettings,
      heroSlides: slides,
      featuredCollections: collections,
      banks,
      bundles
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('Error fetching consolidated home page data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
