import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function performWipe() {
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

  return {
    success: true,
    message: 'Өгөгдлийн баазын бүх өгөгдөл (Захиалга, Санхүү, Бараа, Зардал) амжилттай бүрэн арилж 0 боллоо.',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action !== 'WIPE_ALL_DATA') {
      return NextResponse.json({ error: 'Баталгаажуулах утга буруу байна.' }, { status: 400 });
    }

    const result = await performWipe();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'RESET_NOW') {
      return NextResponse.json(
        { error: 'Өгөгдлийг арилгахын тулд ?key=RESET_NOW параметрийг илгээнэ үү.' },
        { status: 400 }
      );
    }

    const result = await performWipe();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
