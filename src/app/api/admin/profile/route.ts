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
          resetPassword: 'inky1234',
          email: 'uki.0215@gmail.com',
        },
      });
    }

    return NextResponse.json({
      username: admin.username,
      email: admin.email || 'uki.0215@gmail.com',
      resetPassword: admin.resetPassword || 'inky1234',
      updatedAt: admin.updatedAt,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { currentPassword, newPassword, newUsername, newResetPassword, newEmail } = await request.json();

    let admin = await db.adminUser.findUnique({
      where: { id: 'admin' },
    });

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

    // Verify current password
    if (currentPassword !== admin.password) {
      return NextResponse.json(
        { error: 'Одоогийн нууц үг буруу байна!' },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {
      username: newUsername ? newUsername.trim() : admin.username,
    };

    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.length < 3) {
        return NextResponse.json(
          { error: 'Шинэ нууц үг хамгийн багадаа 3 тэмдэгттэй байх ёстой.' },
          { status: 400 }
        );
      }
      dataToUpdate.password = newPassword;
    }

    if (newResetPassword && newResetPassword.trim() !== '') {
      if (newResetPassword.length < 3) {
        return NextResponse.json(
          { error: 'Өгөгдөл арилгах тусгай нууц үг хамгийн багадаа 3 тэмдэгттэй байх ёстой.' },
          { status: 400 }
        );
      }
      dataToUpdate.resetPassword = newResetPassword.trim();
    }

    if (newEmail && newEmail.trim() !== '') {
      dataToUpdate.email = newEmail.trim();
    }

    const updated = await db.adminUser.update({
      where: { id: 'admin' },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: 'Админы нууц үг болон өгөгдөл арилгах нууц үг амжилттай шинэчлэгдлээ!',
      username: updated.username,
      email: updated.email,
      resetPassword: updated.resetPassword,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
