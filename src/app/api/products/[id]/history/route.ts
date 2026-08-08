import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = resolvedParams?.id;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const history = await db.productHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Fetch product history error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch history' }, { status: 500 });
  }
}
