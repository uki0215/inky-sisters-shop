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

    // Limit maximum file size (e.g. 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Зургийн хэмжээ 10MB-аас бага байх ёстой.' }, { status: 400 });
    }

    // Determine extension safely
    const originalName = file.name || 'image.jpg';
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '.jpg';
    
    // Generate clean filename
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;
      return NextResponse.json({ success: true, url: publicUrl });
    } catch (fsError: any) {
      console.warn('FS write error, using Base64 data URL fallback:', fsError?.message);
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
