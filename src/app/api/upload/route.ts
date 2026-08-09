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

    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

    // On Vercel (serverless environment where public/uploads is ephemeral),
    // return compact data URL so images load reliably across all devices without 404
    if (isVercel) {
      if (clientDataUrl) {
        return NextResponse.json({ success: true, url: clientDataUrl });
      }
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = file.type || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
        return NextResponse.json({ success: true, url: dataUrl });
      }
    }

    // On Local development: Save to public/uploads directory
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Зургийн хэмжээ 10MB-аас бага байх ёстой.' }, { status: 400 });
      }

      const originalExt = path.extname(file.name) || '.jpg';
      const ext = originalExt.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? originalExt : '.jpg';
      const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');

      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        return NextResponse.json({ success: true, url: `/uploads/${filename}` });
      } catch (fsErr) {
        console.warn('Local FS upload failed, falling back to base64 data URL:', fsErr);
        if (clientDataUrl) return NextResponse.json({ success: true, url: clientDataUrl });
        const mimeType = file.type || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
        return NextResponse.json({ success: true, url: dataUrl });
      }
    }

    if (clientDataUrl) {
      return NextResponse.json({ success: true, url: clientDataUrl });
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
