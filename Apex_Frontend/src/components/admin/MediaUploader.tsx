'use client'

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileImage,
  X,
  Loader2,
} from 'lucide-react'

interface MediaUploaderProps {
  onUploadComplete: (url: string, key?: string) => void
  accept?: 'image/*' | 'video/mp4' | string
  folder?: 'properties' | 'countries' | 'services' | 'homepage' | 'general'
  label?: string
}

export default function MediaUploader({
  onUploadComplete,
  accept = 'image/*',
  folder = 'general',
  label = 'Upload Media',
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successUrl, setSuccessUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isVideo = accept.includes('video')

  const validateAndSelectFile = (selectedFile: File) => {
    setError(null)
    setSuccessUrl(null)

    // Check allowed extensions
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const allowedVideoExts = ['.mp4']

    const extMatch = selectedFile.name.toLowerCase().match(/\.[a-z0-9]+$/)
    const ext = extMatch ? extMatch[0] : ''

    if (isVideo) {
      if (!allowedVideoExts.includes(ext) && selectedFile.type !== 'video/mp4') {
        setError('Only MP4 videos are allowed (.mp4).')
        return
      }
      // 500MB max for video
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError(`Video exceeds 500MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB).`)
        return
      }
    } else {
      if (!allowedImageExts.includes(ext) && !selectedFile.type.startsWith('image/')) {
        setError('Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed.')
        return
      }
      // 20MB max for image
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError(`Image exceeds 20MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB).`)
        return
      }
    }

    setFile(selectedFile)

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // 1. Get presigned upload URL from API
      const presignRes = await fetch('/api/admin/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          folder,
        }),
      })

      const presignData = await presignRes.json()

      if (!presignRes.ok || !presignData.uploadUrl) {
        throw new Error(presignData.error || 'Failed to acquire upload authorization.')
      }

      const { uploadUrl, publicUrl, key } = presignData

      // 2. Upload file directly via XHR to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        if (!uploadUrl.includes('/api/admin/media/upload-local')) {
          xhr.setRequestHeader('Content-Type', file.type || (isVideo ? 'video/mp4' : 'image/jpeg'))
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setProgress(percent)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with HTTP status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Network error occurred during file upload.'))
        xhr.send(file)
      })

      setProgress(100)
      setSuccessUrl(publicUrl)
      onUploadComplete(publicUrl, key)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'An unexpected error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
    setError(null)
    setSuccessUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full space-y-3 font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              validateAndSelectFile(e.dataTransfer.files[0])
            }
          }}
          className="group border border-dashed border-white/20 hover:border-[#7DD3FC]/60 rounded-xl p-5 text-center cursor-pointer transition-all bg-[#040810]/50 hover:bg-[#070E1C]"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#0B1528] border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-[#7DD3FC] group-hover:scale-105 transition-all">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-white">{label}</div>
            <p className="text-[11px] text-gray-500 font-mono">
              {isVideo ? 'Click or drag & drop MP4 (max 500MB)' : 'Click or drag & drop PNG, JPG, WebP (max 20MB)'}
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl p-4 bg-[#070E1C] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {preview ? (
                <div className="w-12 h-12 rounded border border-white/10 overflow-hidden shrink-0 bg-black">
                  <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded border border-white/10 bg-[#0B1528] flex items-center justify-center text-[#7DD3FC] shrink-0">
                  {isVideo ? <FileVideo className="w-6 h-6" /> : <FileImage className="w-6 h-6" />}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'binary'}
                </div>
              </div>
            </div>

            {!uploading && (
              <button
                type="button"
                onClick={reset}
                className="p-1 rounded text-gray-500 hover:text-white"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span className="flex items-center gap-1.5 text-[#7DD3FC]">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Storage...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#040810] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7DD3FC] to-sky-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action button */}
          {!uploading && !successUrl && (
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={reset}
                className="px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="px-4 py-1.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Start Upload</span>
              </button>
            </div>
          )}

          {/* Success banner */}
          {successUrl && (
            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate flex-1">Upload complete: {successUrl}</span>
            </div>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
