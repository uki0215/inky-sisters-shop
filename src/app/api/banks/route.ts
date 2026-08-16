import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banks = await db.bankQR.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(banks, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, bankName, bankCode, bankLogoUrl, accountName, accountNumber, qrImageUrl, isActive } = body;

    if (id) {
      const updated = await db.bankQR.update({
        where: { id },
        data: {
          bankName,
          bankCode,
          bankLogoUrl: bankLogoUrl || '',
          accountName,
          accountNumber,
          qrImageUrl,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await db.bankQR.create({
        data: {
          bankName,
          bankCode: bankCode || 'KHAN',
          bankLogoUrl: bankLogoUrl || '',
          accountName,
          accountNumber,
          qrImageUrl: qrImageUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BankQR',
          isActive: true,
        },
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
