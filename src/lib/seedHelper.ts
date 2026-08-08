import { db } from '@/lib/db';

export async function seedDefaultData() {
  try {
    const existingProductsCount = await db.product.count();
    if (existingProductsCount > 0) {
      return { success: true, message: 'Database already contains product data.' };
    }

    // 1. Ensure Categories exist
    let catPens = await db.category.findFirst({ where: { slug: 'pens-markers' } });
    if (!catPens) {
      catPens = await db.category.create({
        data: { name: 'Үзэг & Балушка', slug: 'pens-markers', icon: 'PenTool' },
      });
    }

    let catNotebooks = await db.category.findFirst({ where: { slug: 'notebooks-planners' } });
    if (!catNotebooks) {
      catNotebooks = await db.category.create({
        data: { name: 'Дэвтэр & Төлөвлөгч', slug: 'notebooks-planners', icon: 'BookOpen' },
      });
    }

    let catArt = await db.category.findFirst({ where: { slug: 'art-drawing' } });
    if (!catArt) {
      catArt = await db.category.create({
        data: { name: 'Будаг & Зургийн хэрэгсэл', slug: 'art-drawing', icon: 'Palette' },
      });
    }

    let catOffice = await db.category.findFirst({ where: { slug: 'office-supplies' } });
    if (!catOffice) {
      catOffice = await db.category.create({
        data: { name: 'Албан тасалгааны хэрэгсэл', slug: 'office-supplies', icon: 'Briefcase' },
      });
    }

    let catSchool = await db.category.findFirst({ where: { slug: 'school-supplies' } });
    if (!catSchool) {
      catSchool = await db.category.create({
        data: { name: 'Сургуулийн хэрэгсэл', slug: 'school-supplies', icon: 'Backpack' },
      });
    }

    // 2. Initial Products List
    const defaultProducts = [
      {
        barcode: '8690123456011',
        name: 'Pastel Gel Pen Set (6 Шинэ Өнгө)',
        description: 'Япон бэхэн пастел бэхтэй, 0.5mm нарийн хошуутай гоёмсог үзэгний цуглуулга.',
        categoryId: catPens.id,
        imageUrl: 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80',
        costYuan: 8.5,
        yuanRate: 485,
        costMnt: 4122.5,
        priceMnt: 12500,
        priceYuan: 25.7,
        boxCount: 5,
        unitsPerBox: 20,
        stock: 45,
        isDiscounted: true,
        discountPercent: 15,
        discountPriceMnt: 10625,
        isFeatured: true,
      },
      {
        barcode: '8690123456028',
        name: 'A5 Leather Bullet Journal (Хатуу хавтастай төлөвлөгч)',
        description: '160 гр зузаан цаастай, торон (grid) шугамтай, бэх нэвтрэхгүй Bullet Journal дэвтэр.',
        categoryId: catNotebooks.id,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        costYuan: 22.0,
        yuanRate: 485,
        costMnt: 10670,
        priceMnt: 28000,
        priceYuan: 57.7,
        boxCount: 2,
        unitsPerBox: 15,
        stock: 12,
        isDiscounted: false,
        isFeatured: true,
      },
      {
        barcode: '8690123456035',
        name: 'Zebra Mildliner Aesthetic Highlighter Set (5 ширхэг)',
        description: 'Зөөлөн пастел өнгөтэй текстийн тодруулагч маркер. Хичээл болон ажлын тэмдэглэлд нэн тохиромжтой.',
        categoryId: catPens.id,
        imageUrl: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80',
        costYuan: 14.2,
        yuanRate: 485,
        costMnt: 6887,
        priceMnt: 18500,
        priceYuan: 38.1,
        boxCount: 3,
        unitsPerBox: 10,
        stock: 15,
        isDiscounted: true,
        discountPercent: 10,
        discountPriceMnt: 16650,
        isFeatured: true,
      },
      {
        barcode: '8690123456042',
        name: 'Aesthetic Wooden Desk Organizer (Бэх/Үзэгний тавиур)',
        description: 'Эколог цэвэр модон, олон тасалгаат ширээний зохион байгуулагч хайрцаг.',
        categoryId: catOffice.id,
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
        costYuan: 35.0,
        yuanRate: 485,
        costMnt: 16975,
        priceMnt: 45000,
        priceYuan: 92.7,
        boxCount: 1,
        unitsPerBox: 10,
        stock: 8,
        isDiscounted: false,
        isFeatured: false,
      },
      {
        barcode: '8690123456059',
        name: 'Professional Water Color Pencil Set (36 Өнгө)',
        description: 'Усан будган харандааны иж бүрдэл. Төмөр савтай, маш тод өнгө гаргалттай.',
        categoryId: catArt.id,
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
        costYuan: 28.5,
        yuanRate: 485,
        costMnt: 13822.5,
        priceMnt: 36000,
        priceYuan: 74.2,
        boxCount: 2,
        unitsPerBox: 8,
        stock: 14,
        isDiscounted: true,
        discountPercent: 20,
        discountPriceMnt: 28800,
        isFeatured: true,
      },
      {
        barcode: '8690123456066',
        name: 'Vintage Sticky Notes & Washi Tape Box (Стикер ба тууз)',
        description: 'Винтаж хэв маягтай 6 рулон тууз болон 4 блок наалддаг цаасны цуглуулга.',
        categoryId: catSchool.id,
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80',
        costYuan: 6.0,
        yuanRate: 485,
        costMnt: 2910,
        priceMnt: 9500,
        priceYuan: 19.5,
        boxCount: 4,
        unitsPerBox: 25,
        stock: 60,
        isDiscounted: false,
        isFeatured: false,
      },
    ];

    for (const p of defaultProducts) {
      const existingP = await db.product.findUnique({ where: { barcode: p.barcode } });
      if (!existingP) {
        const newProduct = await db.product.create({ data: p });
        // Initial stock log
        await db.productHistory.create({
          data: {
            productId: newProduct.id,
            changeType: 'INITIAL',
            stockChange: p.stock,
            previousStock: 0,
            newStock: p.stock,
            costMnt: p.costMnt,
            priceMnt: p.priceMnt,
            note: 'Эхний суурь дата автомат сэргээлт',
          },
        });
      }
    }

    // 3. Ensure Bank QRs exist
    const bankCount = await db.bankQR.count();
    if (bankCount === 0) {
      await db.bankQR.createMany({
        data: [
          {
            bankName: 'Хаан Банк (Khan Bank)',
            bankCode: 'KHAN',
            accountName: 'Инкий Систерс ХХК',
            accountNumber: '50987654321',
            qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KhanBank_50987654321_InkySisters',
            isActive: true,
          },
          {
            bankName: 'Голомт Банк (Golomt Bank)',
            bankCode: 'GOLOMT',
            accountName: 'Инкий Систерс ХХК',
            accountNumber: '11051234567',
            qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=GolomtBank_11051234567_InkySisters',
            isActive: true,
          },
          {
            bankName: 'Худалдаа Хөгжлийн Банк (TDB)',
            bankCode: 'TDB',
            accountName: 'Инкий Систерс ХХК',
            accountNumber: '404198765',
            qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TDB_404198765_InkySisters',
            isActive: true,
          },
        ],
      });
    }

    // 4. Ensure Promo Banner exists
    const promoCount = await db.promotionBanner.count();
    if (promoCount === 0) {
      await db.promotionBanner.create({
        data: {
          title: '✨ "Inky Sisters" Намрын Сургуулийн Хямдрал!',
          subtitle: 'Бүх пастел будаг, үзэгний цуглуулга болон Bullet Journal 15-20% ХЯМДАРЛАА!',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
          discountCode: '',
          active: true,
        },
      });
    }

    return { success: true, message: 'Жишээ дата амжилттай сэргээгдлээ.' };
  } catch (e: any) {
    console.error('seedDefaultData error:', e);
    return { success: false, error: e.message };
  }
}
