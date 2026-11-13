import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
function getEnv(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${getEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
  },
});

async function listAllR2() {
  const bucket = getEnv('R2_BUCKET_NAME') || 'apex-media';
  let continuationToken = undefined;
  const allObjects = [];

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }));
    if (res.Contents) {
      allObjects.push(...res.Contents);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  console.log(`Total objects currently in R2 bucket '${bucket}': ${allObjects.length}`);

  const byPrefix = {};
  allObjects.forEach(obj => {
    const top = obj.Key.split('/')[0];
    byPrefix[top] = (byPrefix[top] || 0) + 1;
  });
  console.log('By top folder:', byPrefix);

  fs.writeFileSync('scripts/r2-existing-objects.json', JSON.stringify(allObjects.map(o => ({ key: o.Key, size: o.Size, lastModified: o.LastModified })), null, 2));
  console.log('Saved to scripts/r2-existing-objects.json');
}

listAllR2();
