#!/usr/bin/env node
/**
 * Apex Pacific Holdings — Idempotent Media Migration & R2 Registry Sync Engine (P1-B)
 *
 * Defaults SAFELY to `apex_disposable_test`.
 * Production `apex` requires BOTH `--target=production` AND `--confirm-production-apex`.
 *
 * Usage:
 *   node scripts/migrate-media-to-r2.mjs --dry-run
 *   node scripts/migrate-media-to-r2.mjs --target=disposable
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const { PrismaClient } = require('@prisma/client')
const {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3')

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const targetArg = (args.find((a) => a.startsWith('--target=')) || '--target=disposable').split('=')[1]
const hasProdConfirm = args.includes('--confirm-production-apex')

if (targetArg === 'production' && !hasProdConfirm) {
  console.error('ABORT: --target=production requires explicit --confirm-production-apex approval flag.')
  process.exit(1)
}
if (targetArg !== 'disposable' && targetArg !== 'production') {
  console.error(`ABORT: Unsupported --target=${targetArg}. Expected disposable or production.`)
  process.exit(1)
}

const TARGET_DB_NAME = targetArg === 'production' ? 'apex' : 'apex_disposable_test'
const R2_BUCKET = (process.env.R2_BUCKET_NAME || '').trim()
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '')
const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID || '').trim()
const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || '').trim()
const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || '').trim()

if (!R2_BUCKET || !R2_PUBLIC_URL || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('ABORT: Cloudflare R2 environment variables are incomplete.')
  process.exit(1)
}

const dbUrl = new URL(process.env.DATABASE_URL)
dbUrl.pathname = `/${TARGET_DB_NAME}`

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl.toString() } } })
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public')

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

async function streamToBuffer(body) {
  const chunks = []
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function detectFormatFromMagicAndMime(buffer, rawExt = '', contentType = '') {
  if (!buffer || buffer.length < 4) return null
  const headAscii = buffer.subarray(0, Math.min(64, buffer.length)).toString('utf8').trimStart().toLowerCase()
  if (
    headAscii.startsWith('<!doctype') ||
    headAscii.startsWith('<html') ||
    headAscii.startsWith('<script') ||
    headAscii.startsWith('<svg') ||
    headAscii.startsWith('<?xml') ||
    (buffer[0] === 0x4d && buffer[1] === 0x5a)
  ) {
    return null
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mimeType: 'image/jpeg', mediaType: 'IMAGE' }
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: '.png', mimeType: 'image/png', mediaType: 'IMAGE' }
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { ext: '.webp', mimeType: 'image/webp', mediaType: 'IMAGE' }
  }
  if (buffer.length >= 6 && (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a')) {
    return { ext: '.gif', mimeType: 'image/gif', mediaType: 'IMAGE' }
  }
  if (buffer.length >= 8 && ['ftyp', 'moov', 'mdat', 'free', 'wide', 'skip', 'pnot'].includes(buffer.subarray(4, 8).toString('ascii'))) {
    const ext = rawExt === '.mov' ? '.mov' : rawExt === '.m4v' ? '.m4v' : '.mp4'
    return { ext, mimeType: ext === '.mov' ? 'video/quicktime' : 'video/mp4', mediaType: 'VIDEO' }
  }
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { ext: '.webm', mimeType: 'video/webm', mediaType: 'VIDEO' }
  }
  return null
}

function isR2Url(url) {
  if (!url || typeof url !== 'string') return false
  const t = url.trim()
  return t.startsWith(`${R2_PUBLIC_URL}/`) || /^https:\/\/[^/]+\.(r2\.dev|r2\.cloudflarestorage\.com)\//i.test(t)
}

function extractR2Key(url) {
  if (!isR2Url(url)) return null
  try {
    const u = new URL(url.trim())
    return decodeURIComponent(u.pathname.replace(/^\/+/, ''))
  } catch {
    return null
  }
}

const sourceCache = new Map()

async function acquireSource(urlOrPath) {
  if (sourceCache.has(urlOrPath)) {
    return sourceCache.get(urlOrPath)
  }

  let buffer
  let sourceKind
  let rawExt = ''
  let originalFilename = 'asset'
  let providedMime = ''

  if (urlOrPath.startsWith('/')) {
    sourceKind = 'local'
    const rel = urlOrPath.replace(/^\/+/, '')
    const absPath = path.resolve(PUBLIC_ROOT, rel)
    if (!absPath.startsWith(PUBLIC_ROOT) || !fs.existsSync(absPath)) {
      const result = { ok: false, sourceKind, reason: `Local file missing: ${absPath}` }
      sourceCache.set(urlOrPath, result)
      return result
    }
    buffer = fs.readFileSync(absPath)
    rawExt = path.extname(absPath).toLowerCase()
    originalFilename = path.basename(absPath)
  } else if (/^https:\/\/images\.unsplash\.com\//i.test(urlOrPath)) {
    sourceKind = 'unsplash'
    // Seeded/curated property photography hosted on Unsplash under Unsplash License
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch(urlOrPath, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ApexPacific-R2-Migrator/1.0' },
      })
      clearTimeout(timeout)
      if (!res.ok) {
        const result = { ok: false, sourceKind, reason: `HTTP ${res.status} fetching Unsplash asset` }
        sourceCache.set(urlOrPath, result)
        return result
      }
      providedMime = res.headers.get('content-type') || ''
      const arr = await res.arrayBuffer()
      buffer = Buffer.from(arr)
      const u = new URL(urlOrPath)
      const baseSlug = (u.pathname.split('/').pop() || 'unsplash-photo').replace(/[^a-zA-Z0-9_-]/g, '')
      originalFilename = baseSlug
    } catch (err) {
      clearTimeout(timeout)
      const result = { ok: false, sourceKind, reason: `Network error fetching Unsplash: ${err.message}` }
      sourceCache.set(urlOrPath, result)
      return result
    }
  } else {
    const result = { ok: false, sourceKind: 'external', reason: `Unrecognized or unapproved external URL: ${urlOrPath}` }
    sourceCache.set(urlOrPath, result)
    return result
  }

  const detected = detectFormatFromMagicAndMime(buffer, rawExt, providedMime)
  if (!detected) {
    const result = { ok: false, sourceKind, reason: `Invalid/corrupt or unsupported file signature (${buffer?.length || 0} bytes)` }
    sourceCache.set(urlOrPath, result)
    return result
  }

  if (!originalFilename.includes('.')) {
    originalFilename = `${originalFilename}${detected.ext}`
  }

  const result = {
    ok: true,
    sourceKind,
    buffer,
    sha256: sha256(buffer),
    byteSize: buffer.length,
    ext: detected.ext,
    mimeType: detected.mimeType,
    mediaType: detected.mediaType,
    originalFilename,
  }
  sourceCache.set(urlOrPath, result)
  return result
}

async function headObject(key) {
  try {
    const res = await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return {
      exists: true,
      contentLength: Number(res.ContentLength || 0),
      contentType: res.ContentType || null,
      etag: res.ETag || null,
      lastModified: res.LastModified || null,
      metadata: res.Metadata || {},
    }
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
      return { exists: false }
    }
    throw err
  }
}

async function fetchR2Sha256(key) {
  const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }))
  const buf = await streamToBuffer(res.Body)
  return { sha256: sha256(buf), byteSize: buf.length }
}

async function ensureR2Object(targetKeyWithoutExt, sourceInfo, sourceUrl) {
  const baseKey = `${targetKeyWithoutExt}${sourceInfo.ext}`
  let finalKey = baseKey

  const head = await headObject(finalKey)
  if (head.exists) {
    const remote = await fetchR2Sha256(finalKey)
    if (remote.sha256 === sourceInfo.sha256 && remote.byteSize === sourceInfo.byteSize) {
      return {
        status: 'reused-verified',
        r2Key: finalKey,
        publicUrl: `${R2_PUBLIC_URL}/${finalKey}`,
        r2Sha256: remote.sha256,
        byteSize: remote.byteSize,
        contentType: head.contentType || sourceInfo.mimeType,
      }
    }
    // Never overwrite unrelated/different content at an existing R2 key — append deterministic short hash
    finalKey = `${targetKeyWithoutExt}-${sourceInfo.sha256.slice(0, 8)}${sourceInfo.ext}`
    const altHead = await headObject(finalKey)
    if (altHead.exists) {
      const altRemote = await fetchR2Sha256(finalKey)
      if (altRemote.sha256 === sourceInfo.sha256) {
        return {
          status: 'reused-verified',
          r2Key: finalKey,
          publicUrl: `${R2_PUBLIC_URL}/${finalKey}`,
          r2Sha256: altRemote.sha256,
          byteSize: altRemote.byteSize,
          contentType: altHead.contentType || sourceInfo.mimeType,
        }
      }
    }
  }

  if (isDryRun) {
    return {
      status: 'dry-run-planned',
      r2Key: finalKey,
      publicUrl: `${R2_PUBLIC_URL}/${finalKey}`,
      r2Sha256: sourceInfo.sha256,
      byteSize: sourceInfo.byteSize,
      contentType: sourceInfo.mimeType,
    }
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: finalKey,
      Body: sourceInfo.buffer,
      ContentType: sourceInfo.mimeType,
      ContentLength: sourceInfo.byteSize,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        sha256: sourceInfo.sha256,
        'source-kind': sourceInfo.sourceKind,
        'original-filename': sourceInfo.originalFilename.replace(/[^\x20-\x7e]/g, '_').slice(0, 180),
        migrated: 'p1-b',
      },
    })
  )

  const postHead = await headObject(finalKey)
  if (!postHead.exists || postHead.contentLength !== sourceInfo.byteSize) {
    throw new Error(`Post-upload HeadObject check failed or size mismatch for ${finalKey}`)
  }

  const verified = await fetchR2Sha256(finalKey)
  if (verified.sha256 !== sourceInfo.sha256) {
    throw new Error(`Post-upload SHA-256 mismatch for ${finalKey}: expected ${sourceInfo.sha256}, got ${verified.sha256}`)
  }

  return {
    status: 'uploaded-verified',
    r2Key: finalKey,
    publicUrl: `${R2_PUBLIC_URL}/${finalKey}`,
    r2Sha256: verified.sha256,
    byteSize: verified.byteSize,
    contentType: postHead.contentType || sourceInfo.mimeType,
  }
}

async function listAllR2Objects() {
  const out = []
  let continuationToken
  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        ContinuationToken: continuationToken,
        MaxKeys: 500,
      })
    )
    for (const o of res.Contents || []) {
      if (o.Key) {
        out.push({
          key: o.Key,
          size: Number(o.Size || 0),
          lastModified: o.LastModified ? o.LastModified.toISOString() : null,
          publicUrl: `${R2_PUBLIC_URL}/${o.Key}`,
        })
      }
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)
  return out
}

async function main() {
  console.log(`\n=== Apex Pacific P1-B Media Migration ===`)
  console.log(`Target DB : ${TARGET_DB_NAME} (DryRun: ${isDryRun})`)
  console.log(`R2 Bucket : ${R2_BUCKET}`)
  console.log(`R2 Public : ${R2_PUBLIC_URL}\n`)

  const stats = {
    targetDb: TARGET_DB_NAME,
    dryRun: isDryRun,
    localFilesMigrated: 0,
    unsplashImagesMigrated: 0,
    propertyMainMigrated: 0,
    propertyVideoMigrated: 0,
    propertySpaceRoundMigrated: 0,
    propertyGalleryMigrated: 0,
    homepageAssetsMigrated: 0,
    oneTeamAssetsMigrated: 0,
    countryAssetsMigrated: 0,
    serviceAssetsMigrated: 0,
    reusedFromR2: 0,
    uploadedToR2: 0,
    mediaAssetsRegisteredOrUpdated: 0,
    verifiedDbReferences: 0,
    blocked: [],
    operations: [],
  }

  async function migrateUrl({ sourceUrl, keyStem, category, targetDesc }) {
    if (!sourceUrl || isR2Url(sourceUrl)) return { skipped: true, url: sourceUrl }

    const src = await acquireSource(sourceUrl)
    if (!src.ok) {
      stats.blocked.push({ targetDesc, sourceUrl, category, reason: src.reason })
      console.warn(`[BLOCKED] ${targetDesc}: ${sourceUrl} -> ${src.reason}`)
      return { blocked: true, reason: src.reason }
    }

    const r2Res = await ensureR2Object(keyStem, src, sourceUrl)
    if (r2Res.status === 'uploaded-verified') stats.uploadedToR2++
    if (r2Res.status === 'reused-verified') stats.reusedFromR2++

    if (src.sourceKind === 'local') stats.localFilesMigrated++
    if (src.sourceKind === 'unsplash') stats.unsplashImagesMigrated++

    stats.operations.push({
      category,
      targetDesc,
      sourceUrl,
      sourceKind: src.sourceKind,
      sourceSha256: src.sha256,
      r2Sha256: r2Res.r2Sha256,
      byteSize: src.byteSize,
      contentType: r2Res.contentType,
      r2Key: r2Res.r2Key,
      publicUrl: r2Res.publicUrl,
      status: r2Res.status,
    })

    console.log(`[${r2Res.status}] ${targetDesc} -> ${r2Res.r2Key} (${src.byteSize}B)`)
    return { ok: true, ...src, ...r2Res }
  }

  // 1. HomepageContent
  const home = await prisma.homepageContent.findFirst()
  if (home) {
    const patch = {}
    if (home.heroVideoThumb && !isR2Url(home.heroVideoThumb)) {
      const res = await migrateUrl({
        sourceUrl: home.heroVideoThumb,
        keyStem: 'homepage/hero-thumbnail',
        category: 'homepage',
        targetDesc: 'HomepageContent.heroVideoThumb',
      })
      if (res.ok) {
        patch.heroVideoThumb = res.publicUrl
        stats.homepageAssetsMigrated++
      }
    }
    if (home.oneTeamVideoUrl && !isR2Url(home.oneTeamVideoUrl)) {
      const res = await migrateUrl({
        sourceUrl: home.oneTeamVideoUrl,
        keyStem: 'homepage/one-team-video',
        category: 'homepage',
        targetDesc: 'HomepageContent.oneTeamVideoUrl',
      })
      if (res.ok) {
        patch.oneTeamVideoUrl = res.publicUrl
        stats.homepageAssetsMigrated++
      }
    }
    if (!isDryRun && Object.keys(patch).length > 0) {
      await prisma.homepageContent.update({ where: { id: home.id }, data: patch })
    }
  }

  // 2. OneTeamContent
  const oneTeam = await prisma.oneTeamContent.findFirst({ orderBy: { createdAt: 'asc' } })
  if (oneTeam) {
    const slots = [
      { field: 'luxuryVillasImageUrl', assetIdField: 'luxuryVillasMediaAssetId', role: 'ONE_TEAM_VILLA', stem: 'one-team/luxury-villas' },
      { field: 'commercialImageUrl', assetIdField: 'commercialMediaAssetId', role: 'ONE_TEAM_COMMERCIAL', stem: 'one-team/commercial' },
      { field: 'skyResidencesImageUrl', assetIdField: 'skyResidencesMediaAssetId', role: 'ONE_TEAM_SKY', stem: 'one-team/sky-residences' },
      { field: 'waterfrontImageUrl', assetIdField: 'waterfrontMediaAssetId', role: 'ONE_TEAM_WATERFRONT', stem: 'one-team/waterfront-residences' },
      { field: 'centerVideoUrl', assetIdField: 'centerVideoMediaAssetId', role: 'ONE_TEAM_VIDEO', stem: 'one-team/middle-video' },
    ]
    const otPatch = {}
    for (const s of slots) {
      const val = oneTeam[s.field]
      if (val && !isR2Url(val)) {
        const res = await migrateUrl({
          sourceUrl: val,
          keyStem: s.stem,
          category: 'one-team',
          targetDesc: `OneTeamContent.${s.field}`,
        })
        if (res.ok) {
          otPatch[s.field] = res.publicUrl
          stats.oneTeamAssetsMigrated++
        }
      }
    }
    if (!isDryRun && Object.keys(otPatch).length > 0) {
      await prisma.oneTeamContent.update({ where: { id: oneTeam.id }, data: otPatch })
    }
  }

  // 3. Countries & CollectionMedia
  const countries = await prisma.country.findMany({
    include: { collectionMedia: true },
    orderBy: { displayOrder: 'asc' },
  })
  for (const country of countries) {
    const slug = country.slug
    const cPatch = {}
    const cmPatch = {}

    const rawCover = country.collectionMedia?.coverImageUrl || country.cardImage
    if (rawCover && !isR2Url(rawCover)) {
      const res = await migrateUrl({
        sourceUrl: rawCover,
        keyStem: `collection-media/${slug}/cover`,
        category: 'country',
        targetDesc: `Country(${slug}).coverImage`,
      })
      if (res.ok) {
        cPatch.cardImage = res.publicUrl
        cmPatch.coverImageUrl = res.publicUrl
        stats.countryAssetsMigrated++
      }
    }

    if (country.heroVideoThumb && !isR2Url(country.heroVideoThumb)) {
      const res = await migrateUrl({
        sourceUrl: country.heroVideoThumb,
        keyStem: `collection-media/${slug}/hero-thumb`,
        category: 'country',
        targetDesc: `Country(${slug}).heroVideoThumb`,
      })
      if (res.ok) {
        cPatch.heroVideoThumb = res.publicUrl
        stats.countryAssetsMigrated++
      }
    }

    const rawVideo = country.collectionMedia?.heroVideoUrl || country.heroVideoUrl
    if (rawVideo && !isR2Url(rawVideo)) {
      const res = await migrateUrl({
        sourceUrl: rawVideo,
        keyStem: `collection-media/${slug}/hero-video`,
        category: 'country',
        targetDesc: `Country(${slug}).heroVideoUrl`,
      })
      if (res.ok) {
        cPatch.heroVideoUrl = res.publicUrl
        cmPatch.heroVideoUrl = res.publicUrl
        stats.countryAssetsMigrated++
      }
    }

    if (!isDryRun && (Object.keys(cPatch).length > 0 || Object.keys(cmPatch).length > 0)) {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(cPatch).length > 0) {
          await tx.country.update({ where: { id: country.id }, data: cPatch })
        }
        if (Object.keys(cmPatch).length > 0 && country.collectionMedia) {
          await tx.collectionMedia.update({ where: { id: country.collectionMedia.id }, data: cmPatch })
        }
      })
    }
  }

  // 4. Services
  const services = await prisma.serviceCategory.findMany({ orderBy: { displayOrder: 'asc' } })
  for (const svc of services) {
    const sPatch = {}
    if (svc.image && !isR2Url(svc.image)) {
      const res = await migrateUrl({
        sourceUrl: svc.image,
        keyStem: `services/${svc.slug}/cover`,
        category: 'service',
        targetDesc: `ServiceCategory(${svc.slug}).image`,
      })
      if (res.ok) {
        sPatch.image = res.publicUrl
        stats.serviceAssetsMigrated++
      }
    }
    if (svc.videoUrl && !isR2Url(svc.videoUrl)) {
      const res = await migrateUrl({
        sourceUrl: svc.videoUrl,
        keyStem: `services/${svc.slug}/hero-video`,
        category: 'service',
        targetDesc: `ServiceCategory(${svc.slug}).videoUrl`,
      })
      if (res.ok) {
        sPatch.videoUrl = res.publicUrl
        stats.serviceAssetsMigrated++
      }
    }
    if (!isDryRun && Object.keys(sPatch).length > 0) {
      await prisma.serviceCategory.update({ where: { id: svc.id }, data: sPatch })
    }
  }

  // 5. Properties & PropertyImages
  const properties = await prisma.property.findMany({
    include: {
      country: { select: { slug: true } },
      images: { orderBy: { order: 'asc' } },
    },
    orderBy: [{ slug: 'asc' }],
  })

  for (const prop of properties) {
    const cSlug = prop.country?.slug || 'general'
    const pPatch = {}

    if (prop.mainImage && !isR2Url(prop.mainImage)) {
      const res = await migrateUrl({
        sourceUrl: prop.mainImage,
        keyStem: `properties/${cSlug}/${prop.slug}/thumbnail`,
        category: 'property-main',
        targetDesc: `Property(${prop.slug}).mainImage`,
      })
      if (res.ok) {
        pPatch.mainImage = res.publicUrl
        stats.propertyMainMigrated++
      }
    }

    if (prop.mainVideoUrl && !isR2Url(prop.mainVideoUrl)) {
      const res = await migrateUrl({
        sourceUrl: prop.mainVideoUrl,
        keyStem: `properties/${cSlug}/${prop.slug}/hero-video`,
        category: 'property-video',
        targetDesc: `Property(${prop.slug}).mainVideoUrl`,
      })
      if (res.ok) {
        pPatch.mainVideoUrl = res.publicUrl
        stats.propertyVideoMigrated++
      }
    }

    if (prop.spaceRoundImage && !isR2Url(prop.spaceRoundImage)) {
      const res = await migrateUrl({
        sourceUrl: prop.spaceRoundImage,
        keyStem: `properties/${cSlug}/${prop.slug}/space-round`,
        category: 'property-space-round',
        targetDesc: `Property(${prop.slug}).spaceRoundImage`,
      })
      if (res.ok) {
        pPatch.spaceRoundImage = res.publicUrl
        stats.propertySpaceRoundMigrated++
      }
    }

    const imgUpdates = []
    for (let i = 0; i < prop.images.length; i++) {
      const img = prop.images[i]
      if (img.url && !isR2Url(img.url)) {
        const num = String(i + 1).padStart(2, '0')
        const res = await migrateUrl({
          sourceUrl: img.url,
          keyStem: `properties/${cSlug}/${prop.slug}/gallery/image-${num}`,
          category: 'property-gallery',
          targetDesc: `PropertyImage(${prop.slug}#${num})`,
        })
        if (res.ok) {
          imgUpdates.push({ id: img.id, url: res.publicUrl })
          stats.propertyGalleryMigrated++
        }
      }
    }

    if (!isDryRun && (Object.keys(pPatch).length > 0 || imgUpdates.length > 0)) {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(pPatch).length > 0) {
          await tx.property.update({ where: { id: prop.id }, data: pPatch })
        }
        for (const u of imgUpdates) {
          await tx.propertyImage.update({ where: { id: u.id }, data: { url: u.url } })
        }
      })
    }
  }

  // 6. MediaAsset Registry Synchronization + Complete R2 Bucket Classification
  console.log('\n--- Synchronizing MediaAsset Registry & Classifying R2 Bucket ---')
  const [freshHome, freshOt, freshCountries, freshServices, freshProps, freshImgs] = await Promise.all([
    prisma.homepageContent.findFirst(),
    prisma.oneTeamContent.findFirst({ orderBy: { createdAt: 'asc' } }),
    prisma.country.findMany({ include: { collectionMedia: true } }),
    prisma.serviceCategory.findMany(),
    prisma.property.findMany(),
    prisma.propertyImage.findMany(),
  ])

  // Build map: r2Key -> reference descriptors
  const refsByKey = new Map()
  const addRef = (url, ref) => {
    const key = extractR2Key(url)
    if (!key) return
    if (!refsByKey.has(key)) refsByKey.set(key, [])
    refsByKey.get(key).push(ref)
  }

  if (freshHome) {
    addRef(freshHome.heroVideoUrl, { classification: 'HOMEPAGE', mediaType: 'VIDEO', mediaRole: 'HOMEPAGE_VIDEO', propertyId: null })
    addRef(freshHome.heroVideoThumb, { classification: 'HOMEPAGE', mediaType: 'IMAGE', mediaRole: 'HOMEPAGE_THUMB', propertyId: null })
    addRef(freshHome.oneTeamVideoUrl, { classification: 'HOMEPAGE', mediaType: 'VIDEO', mediaRole: 'ONE_TEAM_VIDEO', propertyId: null })
    addRef(freshHome.advisoryVideoUrl, { classification: 'HOMEPAGE', mediaType: 'VIDEO', mediaRole: 'HOMEPAGE_VIDEO', propertyId: null })
  }
  if (freshOt) {
    addRef(freshOt.luxuryVillasImageUrl, { classification: 'ONE_TEAM', mediaType: 'IMAGE', mediaRole: 'ONE_TEAM_VILLA', propertyId: null })
    addRef(freshOt.commercialImageUrl, { classification: 'ONE_TEAM', mediaType: 'IMAGE', mediaRole: 'ONE_TEAM_COMMERCIAL', propertyId: null })
    addRef(freshOt.skyResidencesImageUrl, { classification: 'ONE_TEAM', mediaType: 'IMAGE', mediaRole: 'ONE_TEAM_SKY', propertyId: null })
    addRef(freshOt.waterfrontImageUrl, { classification: 'ONE_TEAM', mediaType: 'IMAGE', mediaRole: 'ONE_TEAM_WATERFRONT', propertyId: null })
    addRef(freshOt.centerVideoUrl, { classification: 'ONE_TEAM', mediaType: 'VIDEO', mediaRole: 'ONE_TEAM_VIDEO', propertyId: null })
  }
  for (const c of freshCountries) {
    addRef(c.cardImage, { classification: 'COLLECTION_MEDIA', mediaType: 'IMAGE', mediaRole: 'COLLECTION_COVER', propertyId: null })
    addRef(c.heroVideoThumb, { classification: 'COLLECTION_MEDIA', mediaType: 'IMAGE', mediaRole: 'COUNTRY_MEDIA', propertyId: null })
    addRef(c.heroVideoUrl, { classification: 'COLLECTION_MEDIA', mediaType: 'VIDEO', mediaRole: 'COLLECTION_HERO_VIDEO', propertyId: null })
    addRef(c.collectionMedia?.coverImageUrl, { classification: 'COLLECTION_MEDIA', mediaType: 'IMAGE', mediaRole: 'COLLECTION_COVER', propertyId: null })
    addRef(c.collectionMedia?.heroVideoUrl, { classification: 'COLLECTION_MEDIA', mediaType: 'VIDEO', mediaRole: 'COLLECTION_HERO_VIDEO', propertyId: null })
  }
  for (const s of freshServices) {
    addRef(s.image, { classification: 'SERVICE', mediaType: 'IMAGE', mediaRole: 'SERVICE_MEDIA', propertyId: null })
    addRef(s.videoUrl, { classification: 'SERVICE', mediaType: 'VIDEO', mediaRole: 'SERVICE_MEDIA', propertyId: null })
  }
  for (const p of freshProps) {
    addRef(p.mainImage, { classification: 'PROJECT', mediaType: 'IMAGE', mediaRole: 'THUMBNAIL', propertyId: p.id })
    addRef(p.mainVideoUrl, { classification: 'PROJECT', mediaType: 'VIDEO', mediaRole: 'HERO_VIDEO', propertyId: p.id })
    addRef(p.mainVideoThumb, { classification: 'PROJECT', mediaType: 'IMAGE', mediaRole: 'VIDEO_THUMB', propertyId: p.id })
    addRef(p.spaceRoundImage, { classification: 'PROJECT', mediaType: 'IMAGE', mediaRole: 'SPACE_IN_ROUND', propertyId: p.id })
  }
  for (const pi of freshImgs) {
    addRef(pi.url, { classification: 'PROJECT', mediaType: 'IMAGE', mediaRole: 'GALLERY_IMAGE', propertyId: pi.propertyId, displayOrder: pi.order, description: pi.description })
  }

  const allR2Objects = await listAllR2Objects()
  const r2Classification = []

  for (const obj of allR2Objects) {
    const refs = refsByKey.get(obj.key) || []
    let categoryLabel
    if (refs.length > 0) {
      categoryLabel = refs[0].classification
    } else if (/test/i.test(obj.key) || obj.size < 100) {
      categoryLabel = 'CONFIRMED_TEST_OR_OBSOLETE'
    } else {
      categoryLabel = 'UNREFERENCED_POTENTIALLY_REQUIRED'
    }

    r2Classification.push({
      key: obj.key,
      size: obj.size,
      lastModified: obj.lastModified,
      classification: categoryLabel,
      referenceCount: refs.length,
    })

    if (!isDryRun && refs.length > 0) {
      const primary = refs[0]
      const head = await headObject(obj.key)
      const ext = path.extname(obj.key).toLowerCase()
      const mimeType = head.contentType || (primary.mediaType === 'VIDEO' ? 'video/mp4' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg')
      const origName = obj.key.split('/').pop() || obj.key

      await prisma.mediaAsset.upsert({
        where: { r2Key: obj.key },
        create: {
          propertyId: primary.propertyId || null,
          mediaType: primary.mediaType,
          mediaRole: primary.mediaRole,
          originalFilename: origName,
          r2Key: obj.key,
          publicUrl: obj.publicUrl,
          mimeType,
          fileSize: obj.size,
          displayOrder: primary.displayOrder ?? 0,
          description: primary.description || null,
        },
        update: {
          propertyId: primary.propertyId ?? undefined,
          mediaType: primary.mediaType,
          mediaRole: primary.mediaRole,
          publicUrl: obj.publicUrl,
          mimeType,
          fileSize: obj.size,
          displayOrder: primary.displayOrder ?? 0,
          description: primary.description ?? undefined,
        },
      })
      stats.mediaAssetsRegisteredOrUpdated++
    }
  }

  // Link OneTeamContent and CollectionMedia FK MediaAsset IDs in target DB
  if (!isDryRun) {
    const allAssets = await prisma.mediaAsset.findMany({ select: { id: true, r2Key: true } })
    const assetIdByKey = new Map(allAssets.map((a) => [a.r2Key, a.id]))
    const assetFor = (url) => {
      const k = extractR2Key(url)
      return k ? assetIdByKey.get(k) || null : null
    }

    if (freshOt) {
      await prisma.oneTeamContent.update({
        where: { id: freshOt.id },
        data: {
          luxuryVillasMediaAssetId: assetFor(freshOt.luxuryVillasImageUrl),
          commercialMediaAssetId: assetFor(freshOt.commercialImageUrl),
          skyResidencesMediaAssetId: assetFor(freshOt.skyResidencesImageUrl),
          waterfrontMediaAssetId: assetFor(freshOt.waterfrontImageUrl),
          centerVideoMediaAssetId: assetFor(freshOt.centerVideoUrl),
        },
      })
    }

    for (const c of freshCountries) {
      if (c.collectionMedia) {
        await prisma.collectionMedia.update({
          where: { id: c.collectionMedia.id },
          data: {
            coverImageMediaAssetId: assetFor(c.collectionMedia.coverImageUrl),
            heroVideoMediaAssetId: assetFor(c.collectionMedia.heroVideoUrl),
          },
        })
      }
    }
  }

  // Final verification of DB references
  const r2KeySet = new Set(allR2Objects.map((o) => o.key))
  let brokenCount = 0
  let totalCheckedRefs = 0
  let nonR2Remaining = []

  const checkUrl = (label, url) => {
    if (!url) return
    totalCheckedRefs++
    if (!isR2Url(url)) {
      nonR2Remaining.push({ label, url })
      return
    }
    const k = extractR2Key(url)
    if (!k || !r2KeySet.has(k)) {
      brokenCount++
      nonR2Remaining.push({ label, url, reason: 'Missing in R2' })
    }
  }

  if (freshHome) {
    checkUrl('Homepage.heroVideoUrl', freshHome.heroVideoUrl)
    checkUrl('Homepage.heroVideoThumb', freshHome.heroVideoThumb)
    checkUrl('Homepage.oneTeamVideoUrl', freshHome.oneTeamVideoUrl)
    checkUrl('Homepage.advisoryVideoUrl', freshHome.advisoryVideoUrl)
  }
  if (freshOt) {
    checkUrl('OneTeam.luxuryVillas', freshOt.luxuryVillasImageUrl)
    checkUrl('OneTeam.commercial', freshOt.commercialImageUrl)
    checkUrl('OneTeam.skyResidences', freshOt.skyResidencesImageUrl)
    checkUrl('OneTeam.waterfront', freshOt.waterfrontImageUrl)
    checkUrl('OneTeam.centerVideo', freshOt.centerVideoUrl)
  }
  for (const c of freshCountries) {
    checkUrl(`Country(${c.slug}).cardImage`, c.cardImage)
    checkUrl(`Country(${c.slug}).heroVideoUrl`, c.heroVideoUrl)
    checkUrl(`Country(${c.slug}).heroVideoThumb`, c.heroVideoThumb)
    if (c.collectionMedia) {
      checkUrl(`CollectionMedia(${c.slug}).cover`, c.collectionMedia.coverImageUrl)
      checkUrl(`CollectionMedia(${c.slug}).heroVideo`, c.collectionMedia.heroVideoUrl)
    }
  }
  for (const s of freshServices) {
    checkUrl(`Service(${s.slug}).image`, s.image)
    checkUrl(`Service(${s.slug}).videoUrl`, s.videoUrl)
  }
  for (const p of freshProps) {
    checkUrl(`Property(${p.slug}).mainImage`, p.mainImage)
    checkUrl(`Property(${p.slug}).mainVideoUrl`, p.mainVideoUrl)
    checkUrl(`Property(${p.slug}).mainVideoThumb`, p.mainVideoThumb)
    checkUrl(`Property(${p.slug}).spaceRoundImage`, p.spaceRoundImage)
  }
  for (const pi of freshImgs) {
    checkUrl(`PropertyImage(${pi.id})`, pi.url)
  }

  stats.verifiedDbReferences = totalCheckedRefs - nonR2Remaining.length
  stats.totalCheckedRefs = totalCheckedRefs
  stats.nonR2Remaining = nonR2Remaining
  stats.brokenCount = brokenCount
  stats.totalR2ObjectsInBucket = allR2Objects.length
  stats.r2ClassificationSummary = r2Classification.reduce((acc, item) => {
    acc[item.classification] = (acc[item.classification] || 0) + 1
    return acc
  }, {})
  stats.r2Classification = r2Classification

  const reportPath = path.resolve(process.cwd(), `scripts/migration-report-${targetArg}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2))

  console.log('\n=== MIGRATION SUMMARY ===')
  console.log({
    targetDb: stats.targetDb,
    dryRun: stats.dryRun,
    localFilesMigrated: stats.localFilesMigrated,
    unsplashImagesMigrated: stats.unsplashImagesMigrated,
    propertyMainMigrated: stats.propertyMainMigrated,
    propertyVideoMigrated: stats.propertyVideoMigrated,
    propertySpaceRoundMigrated: stats.propertySpaceRoundMigrated,
    propertyGalleryMigrated: stats.propertyGalleryMigrated,
    homepageAssetsMigrated: stats.homepageAssetsMigrated,
    oneTeamAssetsMigrated: stats.oneTeamAssetsMigrated,
    countryAssetsMigrated: stats.countryAssetsMigrated,
    serviceAssetsMigrated: stats.serviceAssetsMigrated,
    uploadedToR2: stats.uploadedToR2,
    reusedFromR2: stats.reusedFromR2,
    mediaAssetsRegisteredOrUpdated: stats.mediaAssetsRegisteredOrUpdated,
    verifiedDbReferences: stats.verifiedDbReferences,
    totalCheckedRefs: stats.totalCheckedRefs,
    nonR2RemainingCount: nonR2Remaining.length,
    blockedCount: stats.blocked.length,
    totalR2ObjectsInBucket: stats.totalR2ObjectsInBucket,
    r2ClassificationSummary: stats.r2ClassificationSummary,
  })
  console.log(`Detailed manifest written to: ${reportPath}`)
}

main()
  .catch((err) => {
    console.error('FATAL migration error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
