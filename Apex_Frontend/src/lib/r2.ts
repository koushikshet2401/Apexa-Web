import { S3Client } from '@aws-sdk/client-s3'

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  )
}

export function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID || 'placeholder-account'}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || 'placeholder-access-key',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'placeholder-secret-key',
    },
  })
}

export const r2 = getR2Client()
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'apex-media'
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')
