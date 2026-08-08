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
          resetPassword: 'inkysisters',
          email: 'inkysisters1223@gmail.com',
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
    const { currentPassword, newPassword, newUsername, newResetPassword } = await request.json();

    let admin = await db.adminUser.findUnique({
      where: { id: 'admin' },
    });

    if (!admin) {
      admin = await db.adminUser.create({
        data: {
          id: 'admin',
          username: 'inkysisters',
          password: 'inkysisters',
          resetPassword: 'inkysisters',
          email: 'inkysisters1223@gmail.com',
        },
      });
    }

    // Verify current admin login password
    if (currentPassword !== admin.password) {
      return NextResponse.json(
        { error: 'Одоогийн админы нууц үг буруу байна!' },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {
      username: newUsername ? newUsername.trim() : admin.username,
    };

    let updatedSomething = false;

    // Optional: Update login password
    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.length < 3) {
        return NextResponse.json(
          { error: 'Шинэ нэвтрэх нууц үг хамгийн багадаа 3 тэмдэгттэй байх ёстой.' },
          { status: 400 }
        );
      }
      dataToUpdate.password = newPassword.trim();
      updatedSomething = true;
    }

    // Optional: Update DB Reset password
    if (newResetPassword && newResetPassword.trim() !== '') {
      if (newResetPassword.length < 3) {
        return NextResponse.json(
          { error: 'Өгөгдөл арилгах тусгай нууц үг хамгийн багадаа 3 тэмдэгттэй байх ёстой.' },
          { status: 400 }
        );
      }
      dataToUpdate.resetPassword = newResetPassword.trim();
      updatedSomething = true;
    }

    if (newUsername && newUsername.trim() !== admin.username) {
      updatedSomething = true;
    }

    const updated = await db.adminUser.update({
      where: { id: 'admin' },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: '✓ Тохиргоо амжилттай шинэчлэгдлээ!',
      username: updated.username,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
