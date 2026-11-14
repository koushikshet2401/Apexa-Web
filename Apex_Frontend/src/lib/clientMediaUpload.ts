'use client'

export interface ClientUploadOptions {
  folder?: string
  mediaRole?: string
  countrySlug?: string | null
  projectSlug?: string | null
  propertyId?: string | null
  description?: string | null
  onProgress?: (percent: number) => void
}

/**
 * Enterprise client-side R2 upload utility.
 * Uses presign + direct HTTP PUT streaming to bypass Next.js multipart form body limits,
 * enabling reliable upload of high-resolution images and large 4K video reels up to 500MB.
 */
export async function uploadFileToR2(
  file: File,
  options: ClientUploadOptions = {}
): Promise<{ publicUrl: string; key: string }> {
  const {
    folder = 'general',
    mediaRole = 'OTHER',
    countrySlug = null,
    projectSlug = null,
    propertyId = null,
    description = null,
    onProgress,
  } = options

  // Validate non-empty file
  if (!file || file.size === 0) {
    throw new Error('Selected file is empty (0 bytes). Please choose a valid file.')
  }

  // 1. Acquire upload authorization & R2 key via presign
  const presignRes = await fetch('/api/admin/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
      folder,
      countrySlug,
      projectSlug,
      mediaRole,
    }),
  })

  const presignData = await presignRes.json()
  if (!presignRes.ok || !presignData.uploadUrl) {
    throw new Error(presignData.error || 'Failed to acquire upload authorization.')
  }

  const { uploadUrl, publicUrl, key } = presignData

  // Append optional metadata query parameters for the PUT handler
  let targetUrl = uploadUrl
  if (propertyId) {
    targetUrl += `&propertyId=${encodeURIComponent(propertyId)}`
  }
  if (description) {
    targetUrl += `&description=${encodeURIComponent(description)}`
  }

  // 2. Stream binary directly via PUT (bypasses Next.js multipart body limits)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', targetUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        let errMsg = `Upload failed with HTTP status ${xhr.status}`
        try {
          const res = JSON.parse(xhr.responseText)
          if (res?.error) errMsg = res.error
        } catch {}
        reject(new Error(errMsg))
      }
    }

    xhr.onerror = () => reject(new Error('Network error uploading file to Cloudflare R2.'))
    xhr.send(file)
  })

  return { publicUrl, key }
}
