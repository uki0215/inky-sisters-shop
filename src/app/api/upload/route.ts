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

    let buffer: Buffer | null = null;
    let base64Str = '';

    if (file) {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Зургийн хэмжээ 10MB-аас бага байх ёстой.' }, { status: 400 });
      }
      base64Str = buffer.toString('base64');
    } else if (clientDataUrl && clientDataUrl.includes('base64,')) {
      base64Str = clientDataUrl.split('base64,')[1];
    }

    // 1. Try ImgBB CDN for permanent, high-speed HTTPS image hosting (works everywhere on Vercel & local)
    if (base64Str) {
      try {
        const imgbbForm = new FormData();
        imgbbForm.append('image', base64Str);

        const imgbbRes = await fetch('https://api.imgbb.com/1/upload?key=6d02737556a31b2b619786270f736899', {
          method: 'POST',
          body: imgbbForm,
        });

        if (imgbbRes.ok) {
          const imgbbData = await imgbbRes.json();
          if (imgbbData?.data?.display_url || imgbbData?.data?.url) {
            const finalUrl = imgbbData.data.display_url || imgbbData.data.url;
            return NextResponse.json({ success: true, url: finalUrl });
          }
        }
      } catch (cdnErr) {
        console.warn('ImgBB CDN upload failed, trying fallback:', cdnErr);
      }
    }

    // 2. Fallback: Local filesystem (if local dev)
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    if (!isVercel && file && buffer) {
      try {
        const originalExt = path.extname(file.name) || '.jpg';
        const ext = originalExt.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? originalExt : '.jpg';
        const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        return NextResponse.json({ success: true, url: `/uploads/${filename}` });
      } catch (fsErr) {
        console.warn('Local FS write failed:', fsErr);
      }
    }

    // 3. Fallback: Compressed Data URL
    if (clientDataUrl) {
      return NextResponse.json({ success: true, url: clientDataUrl });
    }

    if (file && buffer) {
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
