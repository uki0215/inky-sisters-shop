import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Нэвтрэх нэр болон нууц үгээ оруулна уу.' }, { status: 400 });
    }

    // Find or create default admin user
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

    // Match username (case-insensitive or normalized) & password
    const normalizedInputUser = username.trim().toLowerCase().replace(/[\s-_]/g, '');
    const normalizedDbUser = admin.username.trim().toLowerCase().replace(/[\s-_]/g, '');

    const isUserValid =
      normalizedInputUser === normalizedDbUser ||
      normalizedInputUser === 'inkysisters' ||
      normalizedInputUser === 'inky';

    const isPassValid = password === admin.password;

    if (!isUserValid || !isPassValid) {
      return NextResponse.json(
        { error: 'Нэвтрэх нэр эсвэл нууц үг буруу байна!' },
        { status: 401 }
      );
    }

    // Return success & token
    return NextResponse.json({
      success: true,
      username: admin.username,
      token: `inky_admin_token_${Date.now()}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
