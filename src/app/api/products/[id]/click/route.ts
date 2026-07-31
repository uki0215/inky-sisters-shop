import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await db.product.update({
      where: { id: params.id },
      data: { clickCount: { increment: 1 } },
    });
    return NextResponse.json({ success: true, clickCount: updated.clickCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
