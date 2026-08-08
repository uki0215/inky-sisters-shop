import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentOnly = searchParams.get('parentOnly');

    const whereCondition = parentOnly === 'true' ? { parentId: null } : {};

    const categories = await db.category.findMany({
      where: whereCondition,
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
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, parentId, imageUrl } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

    // Ensure unique slug
    let slug = baseSlug;
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        icon: icon || 'BookOpen',
        imageUrl: imageUrl || null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
