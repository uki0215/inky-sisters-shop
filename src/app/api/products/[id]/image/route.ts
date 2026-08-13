import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseImageUrls } from '@/lib/imageUtils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return new Response('Missing product ID', { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id },
      select: { imageUrl: true }
    });

    if (!product) {
      return new Response('Product not found', { status: 404 });
    }

    const urls = parseImageUrls(product.imageUrl);
    const firstUrl = urls[0];

    // If no image, redirect to fallback placeholder
    if (!firstUrl) {
      return NextResponse.redirect(new URL('/placeholder-product.svg', request.url));
    }

    // If it is a base64 Data URL, decode and serve it as binary
    if (firstUrl.startsWith('data:image/')) {
      const match = firstUrl.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
      if (match) {
        const contentType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');

        return new Response(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    // For any external or local relative url path, redirect to the source directly
    return NextResponse.redirect(new URL(firstUrl, request.url));
  } catch (error: any) {
    console.error('Error serving product image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
