// scripts/hash-admin-password.mjs
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-admin-password.mjs "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log('Add this to your .env.local and Vercel project env vars as ADMIN_PASSWORD_HASH:');
console.log(hash);
