# 🚀 GitHub, Vercel & Production Database Холбох Заавар

Энэхүү заавар нь таны веб платформыг **GitHub**-д оруулж, **Vercel** дээр байршуулан, онлайн өгөгдлийн сан (Database)-тай холбох цогц алхмуудыг харуулна.

---

## 📌 1-р Алхам: GitHub руу төслөө оруулж холбох (Push to GitHub)

1. **GitHub.com** руу нэвтрэн орно.
2. Баруун дээд өнцөгт байрлах **`+`** дээр дарж **`New repository`** сонгоно.
3. Нэр хэсэгт `inky-sisters-shop` гэж өгөөд **`Create repository`** товчийг дарна.
4. Компьютерийнхоо Терминал (Terminal) дээр дараах тушаалуудыг дарааллуулан ажиллуулна:

```bash
# 1. GitHub репозиторитой холбох (Энд [YOUR_USERNAME]-ийг өөрийн GitHub нэрээр солино)
git remote add origin https://github.com/[YOUR_USERNAME]/inky-sisters-shop.git

# 2. Кодоо GitHub руу илгээх (Push)
git push -u origin main
```

---

## 📌 2-р Алхам: Өгөгдлийн Сан (Database) бэлтгэх & Холбох

> **⚠️ ЧУХАЛ АНХААРУУЛГА:** Vercel-ийн Serverless систем нь файлын системд шинээр файл бичихийг зөвшөөрдөггүй (Serverless байна). Тиймээс локал `dev.db` (SQLite) файлыг Vercel дээр шууд ашиглаж болохгүй бөгөөд Cloud DB (Turso / Supabase / Neon) ашиглана.

### 💡 СОНГОЛТ А: Turso Database (SQLite дэмждэг, Кодод хамгийн бага өөрчлөлт орно) - 🌟 ЗӨВЛӨЖ БАЙНА

Turso нь SQLite-д зориулсан Cloud DB тул та Prisma одоогийн бүтцээ өөрчлөх шаардлагагүй.

1. **[Turso.tech](https://turso.tech)** рүү нэвтэрч бүртгүүлнэ.
2. Шинэ Database үүсгэнэ (Жишээ нь: `inky-shop-db`).
3. Тухайн DB-ийн **Database URL** болон **Auth Token**-ийг хуулж авна.
   * `DATABASE_URL`: `libsql://inky-shop-db-[username].turso.io`
   * `TURSO_AUTH_TOKEN`: `eyJhbGci...`

### 💡 СОНГОЛТ Б: Neon эсвэл Supabase Postgres (PostgreSQL)

Хэрэв та Supabase эсвэл Neon Postgres ашиглах бол `prisma/schema.prisma` файл дотор `provider = "postgresql"` болгон өөрчилнө:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 📌 3-р Алхам: Vercel дээр Веб Сайтаа Байршуулах (Deploy to Vercel)

1. **[Vercel.com](https://vercel.com)** рүү нэвтрэн орно (GitHub аккаунтуудаа шууд холбож болно).
2. Dashboard дээр **`Add New...`** -> **`Project`** сонгоно.
3. GitHub дээрх `inky-sisters-shop` репозиторийг сонгож **`Import`** товчийг дарна.
4. **Environment Variables** (Орчны хувьсагчууд) хэсэгт дараах хувьсагчийг нэмнэ:
   * **Key:** `DATABASE_URL`
   * **Value:** `[Таны Cloud DB-ийн холболтын URL string]`
5. **`Deploy`** товчийг дарна.

---

## 📌 4-р Алхам: Өгөгдлийн Сангийн Бүтцийг Мигрейт хийх & Эхний өгөгдлийг оруулах (Migration & Seeding)

Vercel дээр Deploy амжилттай болсны дараа өгөгдлийн сандаа хүснэгтүүдийг үүсгэж, анхны датаг (Ангилал, Бараа, Касс, Банкны QR) оруулна.

Локал терминалаасаа орчны хувьсагчаа зааж өгөөд дараах тушаалуудыг ажиллуулна:

```bash
# 1. Cloud DB руу Prisma Схемээ шахах (Хүснэгтүүд үүснэ)
DATABASE_URL="[Таны_Cloud_DB_URL]" npx prisma db push

# 2. Эхний туршилтын бараа болон бэлэн тохиргоонуудыг оруулах
DATABASE_URL="[Таны_Cloud_DB_URL]" node prisma/seed.js
DATABASE_URL="[Таны_Cloud_DB_URL]" node scripts/seed-bundles.js
```

---

## 🎉 Бэлэн боллоо!

Төлбөр баталгаажуулалт, Кассын систем (POS), Багцын хямдрал, Захиалга болон Өртөг ашгийн бүх лог систем Cloud DB-тэй холбогдон Vercel дээр 24/7 найдвартай ажиллах болно!
