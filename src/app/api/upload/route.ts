import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const clientDataUrl = formData.get('dataUrl') as string | null;

    if (!file && !clientDataUrl) {
      return NextResponse.json({ error: 'Зураг оруулаагүй байна.' }, { status: 400 });
    }

    // 1. If client provided a compressed WebP Data URL (~25KB), return it immediately.
    // It works 100% reliably everywhere (Vercel & local), requires no third-party keys, and never 404s!
    if (clientDataUrl && clientDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ success: true, url: clientDataUrl });
    }

    // 2. On Local development: Save to public/uploads directory if file buffer exists
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    if (!isVercel && file) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        if (buffer.length <= 10 * 1024 * 1024) {
          const originalExt = path.extname(file.name) || '.jpg';
          const ext = originalExt.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? originalExt : '.jpg';
          const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');

          await mkdir(uploadDir, { recursive: true });
          await writeFile(path.join(uploadDir, filename), buffer);
          return NextResponse.json({ success: true, url: `/uploads/${filename}` });
        }
      } catch (fsErr) {
        console.warn('Local FS write failed:', fsErr);
      }
    }

    // 3. Fallback: Generate lightweight data URL from raw file buffer
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }

    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Зураг хуулахад сервер дээр алдаа гарлаа.' },
      { status: 500 }
    );
  }
}
