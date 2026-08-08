const { execSync } = require('child_process');

const dbUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '';

if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('file:')) {
  console.log('🔄 Syncing Prisma schema with Cloud Database...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️ Warning: Prisma db push encountered an issue:', err.message);
  }
} else {
  console.log('ℹ️ Local environment detected. Skipping cloud prisma db push.');
}
