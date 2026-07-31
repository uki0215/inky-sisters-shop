import nodemailer from 'nodemailer';

interface SendOrderEmailParams {
  to: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalMnt: number;
  items: any[];
}

export async function sendOrderConfirmationEmail({
  to,
  orderNumber,
  customerName,
  customerPhone,
  totalMnt,
  items,
}: SendOrderEmailParams) {
  // Check if SMTP environment variables exist
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[EMAIL NOTICE] Order #${orderNumber} created. SMTP credentials not set in .env. Email to ${to} was not sent.`);
    return { success: false, reason: 'SMTP credentials not configured in .env' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.productName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity} ш</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${item.priceMnt.toLocaleString()}₮</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; background-color: #ffffff;">
        <h2 style="color: #0f766e; margin-top: 0; font-size: 20px;">Inky Sisters — Захиалга Баталгаажлаа</h2>
        <p style="font-size: 14px; color: #334155;">Сайн байна уу, <strong>${customerName}</strong>?</p>
        <p style="font-size: 13px; color: #475569;">Таны бичиг хэрэглэлийн захиалга амжилттай бүртгэгдлээ. Төлбөр болон захиалгын мэдээллийг доороос харна уу:</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 20px 0;">
          <div style="margin-bottom: 10px;">
            <span style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: bold; display: block;">Захиалга баталгаажуулах код:</span>
            <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #065f46;">${orderNumber}</span>
          </div>

          <div style="margin-bottom: 10px; padding-top: 8px; border-top: 1px solid #dcfce7;">
            <span style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: bold; display: block;">Гүйлгээний утга:</span>
            <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #1e293b;">${customerPhone} ${customerName}</span>
          </div>

          <div style="padding-top: 8px; border-top: 1px solid #dcfce7;">
            <span style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: bold; display: block;">Шилжүүлсэн Нийт Төлбөр:</span>
            <span style="font-size: 20px; font-weight: bold; color: #dc2626;">${totalMnt.toLocaleString()}₮</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
          <thead>
            <tr style="background-color: #f8fafc; color: #475569; font-size: 12px;">
              <th style="padding: 10px; text-align: left; border-radius: 6px 0 0 6px;">Барааны нэр</th>
              <th style="padding: 10px; text-align: center;">Тоо хэмжээ</th>
              <th style="padding: 10px; text-align: right; border-radius: 0 6px 6px 0;">Нэгж үнэ</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="margin-top: 28px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; pt: 16px;">
          Бид систем дээр таны төлбөрийг шалгаж баталгаажуулсан тул хүргэлтийг шуурхай зохион байгуулах болно.<br/>
          <strong>Inky Sisters бичиг хэргийн дэлгүүр</strong>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Inky Sisters Shop" <${smtpUser}>`,
      to,
      subject: `[Inky Sisters] Захиалга баталгаажлаа #${orderNumber}`,
      html: htmlContent,
    });

    console.log(`[EMAIL SUCCESS] Confirmation email sent to ${to} for order #${orderNumber}`);
    return { success: true };
  } catch (error: any) {
    console.error('[EMAIL ERROR] Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
