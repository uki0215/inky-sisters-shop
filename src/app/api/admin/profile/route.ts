import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let admin = await db.adminUser.findUnique({
      where: { id: 'admin' },
    });

    if (!admin) {
      admin = await db.adminUser.create({
        data: {
          id: 'admin',
          username: 'inkysisters',
          password: 'inkysisters',
        },
      });
    }

    return NextResponse.json({
      username: admin.username,
      updatedAt: admin.updatedAt,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { currentPassword, newPassword, newUsername } = await request.json();

    let admin = await db.adminUser.findUnique({
      where: { id: 'admin' },
    });

    if (!admin) {
      admin = await db.adminUser.create({
        data: {
          id: 'admin',
          username: 'inkysisters',
          password: 'inkysisters',
        },
      });
    }

    // Verify current password
    if (currentPassword !== admin.password) {
      return NextResponse.json(
        { error: 'Одоогийн одоогийн нууц үг буруу байна!' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 3) {
      return NextResponse.json(
        { error: 'Шинэ нууц үг хамгийн багадаа 3 тэмдэгттэй байх ёстой.' },
        { status: 400 }
      );
    }

    const updated = await db.adminUser.update({
      where: { id: 'admin' },
      data: {
        username: newUsername ? newUsername.trim() : admin.username,
        password: newPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Нууц үг ба профайл амжилттай шинэчлэгдлээ!',
      username: updated.username,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
