import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Зураг оруулаагүй байна.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Зургийн хэмжээ 10MB-аас бага байх ёстой.' }, { status: 400 });
    }

    // Generate safe filename with timestamp and random suffix
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
      const mimeType = file.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Зураг хуулахад сервер дээр алдаа гарлаа.' },
      { status: 500 }
    );
  }
}
