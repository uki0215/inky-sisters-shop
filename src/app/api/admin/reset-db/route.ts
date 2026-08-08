import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function performWipe() {
  const wipeTable = async (tableName: string, action: () => Promise<any>) => {
    try {
      if (db[tableName] && typeof db[tableName].deleteMany === 'function') {
        await db[tableName].deleteMany();
      }
    } catch (e: any) {
      console.warn(`Wipe table ${tableName} skipped or error:`, e.message);
    }
  };

  await wipeTable('orderItem', () => db.orderItem?.deleteMany());
  await wipeTable('order', () => db.order?.deleteMany());
  await wipeTable('financialLog', () => db.financialLog?.deleteMany());
  await wipeTable('expense', () => db.expense?.deleteMany());
  await wipeTable('productHistory', () => db.productHistory?.deleteMany());
  await wipeTable('bundleItem', () => db.bundleItem?.deleteMany());
  await wipeTable('productBundle', () => db.productBundle?.deleteMany());
  await wipeTable('featuredCollection', () => db.featuredCollection?.deleteMany());
  await wipeTable('product', () => db.product?.deleteMany());
  await wipeTable('promotionBanner', () => db.promotionBanner?.deleteMany());

  return {
    success: true,
    message: 'Өгөгдлийн баазын бүх өгөгдөл (Захиалга, Санхүү, Бараа, Зардал) амжилттай бүрэн арилж 0 боллоо.',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, resetPassword } = body;

    if (action !== 'WIPE_ALL_DATA') {
      return NextResponse.json({ error: 'Баталгаажуулах утга буруу байна.' }, { status: 400 });
    }

    // Verify DB Reset Password
    let admin = await db.adminUser.findUnique({ where: { id: 'admin' } });

    if (!admin) {
      admin = await db.adminUser.create({
        data: {
          id: 'admin',
          username: 'inkysisters',
          password: 'inkysisters',
          resetPassword: 'inky1234',
          email: 'uki.0215@gmail.com',
        },
      });
    }

    const expectedResetPass = (admin.resetPassword && admin.resetPassword.trim()) ? admin.resetPassword.trim() : 'inky1234';

    if (!resetPassword || resetPassword.trim() !== expectedResetPass) {
      return NextResponse.json(
        { error: '🔒 Өгөгдөл арилгах тусгай нууц үг буруу байна!' },
        { status: 400 }
      );
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

    let admin = await db.adminUser.findUnique({ where: { id: 'admin' } });

    if (!admin) {
      admin = await db.adminUser.create({
        data: {
          id: 'admin',
          username: 'inkysisters',
          password: 'inkysisters',
          resetPassword: 'inky1234',
          email: 'uki.0215@gmail.com',
        },
      });
    }

    const expectedResetPass = (admin.resetPassword && admin.resetPassword.trim()) ? admin.resetPassword.trim() : 'inky1234';

    if (!key || key.trim() !== expectedResetPass) {
      return NextResponse.json(
        { error: '🔒 Өгөгдөл арилгах тусгай нууц үг буруу байна!' },
        { status: 400 }
      );
    }

    const result = await performWipe();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
