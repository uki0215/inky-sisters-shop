import { NextResponse } from 'next/server';

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

    // 1. Upload to free ImgBB CDN for permanent, fast HTTPS image hosting
    try {
      const imgbbForm = new FormData();
      const base64Str = buffer.toString('base64');
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
      console.warn('CDN Upload warning, using data URL fallback:', cdnErr);
    }

    // 2. Fallback: Base64 data URL
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Зураг хуулахад сервер дээр алдаа гарлаа.' },
      { status: 500 }
    );
  }
}
