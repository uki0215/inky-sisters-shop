import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const expenses = await db.expense.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, amountMnt, note } = body;

    if (!title || !category || !amountMnt) {
      return NextResponse.json({ error: 'Нэр, ангилал ба дүн заавал шаардлагатай' }, { status: 400 });
    }

    const expense = await db.expense.create({
      data: {
        title,
        category,
        amountMnt: parseFloat(amountMnt),
        note: note || '',
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
