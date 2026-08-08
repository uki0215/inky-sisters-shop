import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendResetPasswordEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST() {
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

    const resetPass = admin.resetPassword || 'inkysisters';
    const targetEmail = admin.email || process.env.SMTP_USER || 'inkysisters1223@gmail.com';

    const result = await sendResetPasswordEmail({
      to: targetEmail,
      resetPassword: resetPass,
    });

    if (!result.success) {
      return NextResponse.json({
        error: `И-мэйл илгээхэд алдаа гарлаа: ${result.error || result.reason || 'SMTP алдаа'}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `🔑 DB Reset тусгай нууц үгийг "${targetEmail}" и-мэйл хаяг руу амжилттай илгээлээ. Та и-мэйлээ шалгана уу.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
