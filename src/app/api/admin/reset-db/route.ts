import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action !== 'WIPE_ALL_DATA') {
      return NextResponse.json({ error: 'Баталгаажуулах утга буруу байна.' }, { status: 400 });
    }

    // Delete in reverse foreign key order
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.financialLog.deleteMany();
    await db.expense.deleteMany();
    await db.productHistory.deleteMany();
    await db.productBundleItem.deleteMany();
    await db.productBundle.deleteMany();
    await db.featuredCollectionItem.deleteMany();
    await db.featuredCollection.deleteMany();
    await db.product.deleteMany();
    await db.promotion.deleteMany();

    return NextResponse.json({
      success: true,
      message: 'Өгөгдлийн баазын бүх өгөгдөл (Захиалга, Санхүү, Бараа) амжилттай цэвэрлэгдэж 0 боллоо.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
