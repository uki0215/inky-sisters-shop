const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products in DB`);

  if (products.length === 0) {
    console.log('No products found in DB');
    return;
  }

  // Clear old test bundles
  await prisma.bundleItem.deleteMany();
  await prisma.productBundle.deleteMany();

  const p1 = products[0];
  const p2 = products[1] || products[0];
  const p3 = products[2] || products[0];

  const origPrice1 = (p1.priceMnt * 2) + (p2.priceMnt * 1) + (p3.priceMnt * 1);
  const bundlePrice1 = Math.round(origPrice1 * 0.85); // 15% discount

  await prisma.productBundle.create({
    data: {
      name: '🎒 Сургуулийн Бэлтгэл Иж Бүрэн Багц (Special Set)',
      description: 'Ахлах ба дунд ангийн сурагчдад зориулсан хамгийн хэрэгцээт хичээлийн хэрэгслийн 15% хямдралтай тусгай багц.',
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80',
      originalPriceMnt: origPrice1 || 45000,
      discountPercent: 15,
      bundlePriceMnt: bundlePrice1 || 38250,
      isActive: true,
      items: {
        create: [
          { productId: p1.id, quantity: 2 },
          { productId: p2.id, quantity: 1 },
          { productId: p3.id, quantity: 1 },
        ],
      },
    },
  });

  const p4 = products[3] || products[0];
  const p5 = products[4] || products[1] || products[0];

  const origPrice2 = (p4.priceMnt * 1) + (p5.priceMnt * 2);
  const bundlePrice2 = Math.round(origPrice2 * 0.80); // 20% discount

  await prisma.productBundle.create({
    data: {
      name: '🎨 Aesthetic Арт & Зургийн Иж Бүрэн Багц',
      description: 'Зураг зурах, тэмдэглэл хөтлөх дуртай хүүхдүүд болон оюутнуудад зориулсан 20% хямдралтай будаг, маркерийн багц.',
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
      originalPriceMnt: origPrice2 || 58000,
      discountPercent: 20,
      bundlePriceMnt: bundlePrice2 || 46400,
      isActive: true,
      items: {
        create: [
          { productId: p4.id, quantity: 1 },
          { productId: p5.id, quantity: 2 },
        ],
      },
    },
  });

  console.log('Successfully created active product bundles!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
