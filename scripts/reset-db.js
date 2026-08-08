const fs = require('fs');
const path = require('path');

// Try loading environment variables from .env.prod.decrypted or .env
const envPaths = [
  path.join(__dirname, '..', '.env.prod.decrypted'),
  path.join(__dirname, '..', '.env.production.local'),
  path.join(__dirname, '..', '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (value && value !== '[SENSITIVE]') {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

// Fallback PRISMA_DATABASE_URL if missing
if (!process.env.PRISMA_DATABASE_URL && process.env.DATABASE_URL) {
  process.env.PRISMA_DATABASE_URL = process.env.DATABASE_URL;
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('⚠️  Starting database wipe and reset process...');
  console.log('Connecting to DB URL:', (process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '').replace(/:[^:@]+@/, ':****@'));
  
  try {
    // Delete transactional items first due to Foreign Key constraints
    console.log('🧹 Clearing OrderItems...');
    await prisma.orderItem.deleteMany();

    console.log('🧹 Clearing Orders...');
    await prisma.order.deleteMany();

    console.log('🧹 Clearing Financial Logs...');
    await prisma.financialLog.deleteMany();

    console.log('🧹 Clearing Operating Expenses...');
    await prisma.expense.deleteMany();

    console.log('🧹 Clearing Product Histories...');
    await prisma.productHistory.deleteMany();

    console.log('🧹 Clearing Product Bundle Items...');
    await prisma.productBundleItem.deleteMany();

    console.log('🧹 Clearing Product Bundles...');
    await prisma.productBundle.deleteMany();

    console.log('🧹 Clearing Featured Collection Items...');
    await prisma.featuredCollectionItem.deleteMany();

    console.log('🧹 Clearing Featured Collections...');
    await prisma.featuredCollection.deleteMany();

    console.log('🧹 Clearing Products...');
    await prisma.product.deleteMany();

    console.log('🧹 Clearing Promotions...');
    await prisma.promotion.deleteMany();

    console.log('✨ SUCCESS! All database records (Orders, Products, Financials, Expenses) have been reset to 0.');
  } catch (err) {
    console.error('❌ Error resetting database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
