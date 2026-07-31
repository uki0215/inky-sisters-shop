import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inky Sisters — Бичиг Хэрэглэлийн Дэлгүүр',
  description: 'Пастел үзэг, Bullet Journal дэвтэр, зургийн хэрэгслийн онцгой e-commerce дэлгүүр. Бүртгэлгүй шууд захиалж, Банкны QR-аар баталгаажуулна.',
  openGraph: {
    title: 'Inky Sisters — Бичиг Хэрэглэлийн Дэлгүүр',
    description: 'Бичиг хэргийн e-commerce сайт.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-inky-950 text-slate-100 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
