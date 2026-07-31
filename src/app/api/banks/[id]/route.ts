import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { bankName, bankCode, bankLogoUrl, accountName, accountNumber, qrImageUrl, isActive } = body;

    const updated = await db.bankQR.update({
      where: { id: params.id },
      data: {
        bankName,
        bankCode,
        bankLogoUrl: bankLogoUrl !== undefined ? bankLogoUrl : undefined,
        accountName,
        accountNumber,
        qrImageUrl,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.bankQR.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
