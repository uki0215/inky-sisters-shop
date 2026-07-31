import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.heroSlide.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    return NextResponse.json({ error: 'Failed to delete hero slide' }, { status: 500 });
  }
}
