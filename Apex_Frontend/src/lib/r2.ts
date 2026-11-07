import { S3Client } from '@aws-sdk/client-s3'

export function isR2Configured(): boolean {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim()
  return Boolean(accountId && accessKeyId && secretAccessKey)
}

let _cachedClient: S3Client | null = null
let _lastAccountId: string | null = null
let _lastAccessKey: string | null = null

export function getR2Client(): S3Client {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim()

  if (!_cachedClient || _lastAccountId !== accountId || _lastAccessKey !== accessKeyId) {
    _cachedClient = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId || 'placeholder-account'}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || 'placeholder-access-key',
        secretAccessKey: secretAccessKey || 'placeholder-secret-key',
      },
      forcePathStyle: true,
    })
    _lastAccountId = accountId
    _lastAccessKey = accessKeyId
  }

  return _cachedClient
}

// Dynamic proxy to guarantee the latest client is used even if credentials are set after module load
export const r2 = new Proxy({} as S3Client, {
  get(_target, prop, receiver) {
    const client = getR2Client()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export const R2_BUCKET_NAME = (process.env.R2_BUCKET_NAME || 'apex-media').trim()
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/$/, '')

export function getR2BucketName(): string {
  return (process.env.R2_BUCKET_NAME || 'apex-media').trim()
}

export function getR2PublicUrl(): string {
  return (process.env.R2_PUBLIC_URL || '').trim().replace(/\/$/, '')
}
