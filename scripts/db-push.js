const { execSync } = require('child_process');

// Only run db push in production Vercel environment, skip locally
if (process.env.VERCEL === '1') {
  console.log('🚀 Vercel build: applying Prisma schema (indexes + structure)...');
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Prisma schema applied successfully.');
  } catch (err) {
    console.error('⚠️ Prisma db push failed (non-fatal):', err.message);
  }
} else {
  console.log('ℹ️ Local build: Prisma db push skipped (use npx prisma db push manually if needed).');
}
