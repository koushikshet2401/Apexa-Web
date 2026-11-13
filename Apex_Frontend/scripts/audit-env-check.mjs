import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.log('.env file not found');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const keys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_SESSION_MAX_AGE',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'ADMIN_EMAIL',
  'EMAIL_FROM',
  'NEXT_PUBLIC_SITE_URL'
];

keys.forEach(k => {
  const match = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  const val = match ? match[1].trim() : '';
  const configured = val.length > 0;
  console.log(`${k}: ${configured ? `CONFIGURED (${val.length} chars)` : 'MISSING / EMPTY'}`);
});
