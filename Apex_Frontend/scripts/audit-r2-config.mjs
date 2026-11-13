import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import fs from 'fs'

function parseEnv() {
  const env = {}
  if (fs.existsSync('.env')) {
    const lines = fs.readFileSync('.env', 'utf-8').split('\n')
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        let value = match[2] || ''
        value = value.trim()
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
        env[match[1]] = value
      }
    }
  }
  return env
}

async function main() {
  console.log('=== PHASE 10: CLOUDFLARE R2 PRODUCTION AUDIT (READ-ONLY) ===\n')

  const env = parseEnv()
  const accountId = (env.R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (env.R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (env.R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (env.R2_BUCKET_NAME || 'apex-media').trim()
  const publicUrl = (env.R2_PUBLIC_URL || '').trim().replace(/\/$/, '')

  const configured = Boolean(accountId && accessKeyId && secretAccessKey)
  console.log('R2 Configured in .env:', configured)
  console.log('R2 Bucket Name:', bucket)
  console.log('R2 Public URL Domain:', publicUrl)

  const isR2DevDomain = publicUrl.includes('.r2.dev')
  const isCustomDomain = !isR2DevDomain && publicUrl.startsWith('http')
  console.log('Using *.r2.dev Managed Domain:', isR2DevDomain)
  console.log('Using Custom Production Domain (e.g. media.apexpacificholdings.com):', isCustomDomain)

  if (isR2DevDomain) {
    console.log('\n[DOMAIN STRATEGY FINDING]:')
    console.log('  The current R2_PUBLIC_URL points to a Cloudflare *.r2.dev managed dev domain.')
    console.log('  While functional, Cloudflare imposes default rate limits on r2.dev and it does not leverage custom CDN caching rules or brand domain SSL (e.g. media.apexpacificholdings.com).')
    console.log('  Recommendation: For high-traffic production, map a Custom Domain (e.g., media.apexpacificholdings.com) to the R2 bucket with Cloudflare CDN edge caching.')
  }

  if (configured) {
    try {
      const client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      })

      const listRes = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          MaxKeys: 10,
        })
      )
      console.log('\n[R2 READ-ONLY ACCESS TEST]:')
      console.log('  Bucket read access: SUCCESS (HTTP 200)')
      console.log(`  Sample object count returned: ${listRes.Contents?.length || 0}`)
      if (listRes.Contents && listRes.Contents.length > 0) {
        console.log('  Sample objects in bucket:')
        for (const obj of listRes.Contents.slice(0, 5)) {
          console.log(`    - ${obj.Key} (${obj.Size} bytes, modified: ${obj.LastModified})`)
        }
      }
    } catch (err) {
      console.error('  R2 Read access check failed:', err.message)
    }
  } else {
    console.error('  R2 credentials missing or incomplete.')
  }
}

main().catch(console.error)
