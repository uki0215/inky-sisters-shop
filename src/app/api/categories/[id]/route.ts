import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
    }

    // 1. Get or create fallback "Бусад / Ангилалгүй" category so NO products are ever lost
    let uncategorized = await db.category.findUnique({ where: { slug: 'uncategorized' } });
    if (!uncategorized) {
      uncategorized = await db.category.create({
        data: {
          name: 'Бусад / Ангилалгүй',
          slug: 'uncategorized',
          icon: 'Folder',
        },
      });
    }

    // 2. Find all subcategories if any
    const subCategories = await db.category.findMany({ where: { parentId: categoryId } });
    const subCatIds = subCategories.map((c: any) => c.id);

    const allCatIds = [categoryId, ...subCatIds].filter((id) => id !== uncategorized.id);

    // 3. Move all products under these categories to "Бусад / Ангилалгүй"
    await db.product.updateMany({
      where: { categoryId: { in: allCatIds } },
      data: { categoryId: uncategorized.id },
    });

    // 4. Delete subcategories
    if (subCatIds.length > 0) {
      await db.category.deleteMany({ where: { id: { in: subCatIds } } });
    }

    // 5. Delete the target category
    if (categoryId !== uncategorized.id) {
      await db.category.delete({ where: { id: categoryId } });
    }

    return NextResponse.json({ success: true, reassignedTo: uncategorized.name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;
    const body = await request.json();
    const { name, icon, parentId, imageUrl } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    const updated = await db.category.update({
      where: { id: categoryId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
