'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Film,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  HardDrive,
  FileVideo,
  Image as ImageIcon,
  Check,
  RefreshCw,
  FolderOpen,
  Edit,
  FileText,
} from 'lucide-react'
import MediaLibraryModal from './MediaLibraryModal'

interface HomepageContentData {
  id?: string
  heroVideoUrl: string | null
  heroVideoThumb: string | null
  unveilLabel?: string | null
  unveilHeading?: string | null
  unveilSubtext?: string | null
  collectionEyebrow?: string | null
  collectionHeading?: string | null
  collectionDescription?: string | null
  spacesHeading?: string | null
  spacesDescription?: string | null
  advisoryEyebrow?: string | null
  advisoryHeading?: string | null
  advisoryDescription?: string | null
  advisoryFooterNote?: string | null
  contactEyebrow?: string | null
  contactHeading?: string | null
  contactDescription?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  contactOfficeAddress?: string | null
  contactWhatsappNumber?: string | null
  contactFormHeading?: string | null
  contactFormSubtext?: string | null
  contactSuccessHeading?: string | null
  contactSuccessSubtext?: string | null
}

export default function HomepageVideoClient({
  initialContent,
  defaultTab = 'media',
}: {
  initialContent: HomepageContentData
  defaultTab?: 'media' | 'sections'
}) {
  const [savedState, setSavedState] = useState({
    heroVideoUrl: initialContent?.heroVideoUrl || '',
    heroVideoThumb: initialContent?.heroVideoThumb || '',
    unveilLabel: initialContent?.unveilLabel || '',
    unveilHeading: initialContent?.unveilHeading || '',
    unveilSubtext: initialContent?.unveilSubtext || '',
    collectionEyebrow: initialContent?.collectionEyebrow || '',
    collectionHeading: initialContent?.collectionHeading || '',
    collectionDescription: initialContent?.collectionDescription || '',
    spacesHeading: initialContent?.spacesHeading || '',
    spacesDescription: initialContent?.spacesDescription || '',
    advisoryEyebrow: initialContent?.advisoryEyebrow || '',
    advisoryHeading: initialContent?.advisoryHeading || '',
    advisoryDescription: initialContent?.advisoryDescription || '',
    advisoryFooterNote: initialContent?.advisoryFooterNote || '',
    contactEyebrow: initialContent?.contactEyebrow || '',
    contactHeading: initialContent?.contactHeading || '',
    contactDescription: initialContent?.contactDescription || '',
    contactPhone: initialContent?.contactPhone || '',
    contactEmail: initialContent?.contactEmail || '',
    contactOfficeAddress: initialContent?.contactOfficeAddress || '',
    contactWhatsappNumber: initialContent?.contactWhatsappNumber || '',
    contactFormHeading: initialContent?.contactFormHeading || '',
    contactFormSubtext: initialContent?.contactFormSubtext || '',
    contactSuccessHeading: initialContent?.contactSuccessHeading || '',
    contactSuccessSubtext: initialContent?.contactSuccessSubtext || '',
  })

  const [activeTab, setActiveTab] = useState<'media' | 'sections'>(defaultTab)

  const [videoUrl, setVideoUrl] = useState<string>(savedState.heroVideoUrl)
  const [videoThumb, setVideoThumb] = useState<string>(savedState.heroVideoThumb)
  const [customUrlInput, setCustomUrlInput] = useState<string>(savedState.heroVideoUrl)

  const [unveilLabel, setUnveilLabel] = useState<string>(savedState.unveilLabel)
  const [unveilHeading, setUnveilHeading] = useState<string>(savedState.unveilHeading)
  const [unveilSubtext, setUnveilSubtext] = useState<string>(savedState.unveilSubtext)

  const [collectionEyebrow, setCollectionEyebrow] = useState<string>(savedState.collectionEyebrow)
  const [collectionHeading, setCollectionHeading] = useState<string>(savedState.collectionHeading)
  const [collectionDescription, setCollectionDescription] = useState<string>(savedState.collectionDescription)

  const [spacesHeading, setSpacesHeading] = useState<string>(savedState.spacesHeading)
  const [spacesDescription, setSpacesDescription] = useState<string>(savedState.spacesDescription)

  const [advisoryEyebrow, setAdvisoryEyebrow] = useState<string>(savedState.advisoryEyebrow)
  const [advisoryHeading, setAdvisoryHeading] = useState<string>(savedState.advisoryHeading)
  const [advisoryDescription, setAdvisoryDescription] = useState<string>(savedState.advisoryDescription)
  const [advisoryFooterNote, setAdvisoryFooterNote] = useState<string>(savedState.advisoryFooterNote)

  const [contactEyebrow, setContactEyebrow] = useState<string>(savedState.contactEyebrow)
  const [contactHeading, setContactHeading] = useState<string>(savedState.contactHeading)
  const [contactDescription, setContactDescription] = useState<string>(savedState.contactDescription)
  const [contactPhone, setContactPhone] = useState<string>(savedState.contactPhone)
  const [contactEmail, setContactEmail] = useState<string>(savedState.contactEmail)
  const [contactOfficeAddress, setContactOfficeAddress] = useState<string>(savedState.contactOfficeAddress)
  const [contactWhatsappNumber, setContactWhatsappNumber] = useState<string>(savedState.contactWhatsappNumber)
  const [contactFormHeading, setContactFormHeading] = useState<string>(savedState.contactFormHeading)
  const [contactFormSubtext, setContactFormSubtext] = useState<string>(savedState.contactFormSubtext)
  const [contactSuccessHeading, setContactSuccessHeading] = useState<string>(savedState.contactSuccessHeading)
  const [contactSuccessSubtext, setContactSuccessSubtext] = useState<string>(savedState.contactSuccessSubtext)

  // Upload state
  const [uploading, setUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload')

  // Poster upload state
  const [uploadingThumb, setUploadingThumb] = useState<boolean>(false)
  const [libraryTarget, setLibraryTarget] = useState<'video' | 'thumb' | null>(null)

  // Save state
  const [saving, setSaving] = useState<boolean>(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Player controls
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const hasUnsavedChanges =
    videoUrl !== savedState.heroVideoUrl ||
    videoThumb !== savedState.heroVideoThumb ||
    unveilLabel !== savedState.unveilLabel ||
    unveilHeading !== savedState.unveilHeading ||
    unveilSubtext !== savedState.unveilSubtext ||
    collectionEyebrow !== savedState.collectionEyebrow ||
    collectionHeading !== savedState.collectionHeading ||
    collectionDescription !== savedState.collectionDescription ||
    spacesHeading !== savedState.spacesHeading ||
    spacesDescription !== savedState.spacesDescription ||
    advisoryEyebrow !== savedState.advisoryEyebrow ||
    advisoryHeading !== savedState.advisoryHeading ||
    advisoryDescription !== savedState.advisoryDescription ||
    advisoryFooterNote !== savedState.advisoryFooterNote ||
    contactEyebrow !== savedState.contactEyebrow ||
    contactHeading !== savedState.contactHeading ||
    contactDescription !== savedState.contactDescription ||
    contactPhone !== savedState.contactPhone ||
    contactEmail !== savedState.contactEmail ||
    contactOfficeAddress !== savedState.contactOfficeAddress ||
    contactWhatsappNumber !== savedState.contactWhatsappNumber ||
    contactFormHeading !== savedState.contactFormHeading ||
    contactFormSubtext !== savedState.contactFormSubtext ||
    contactSuccessHeading !== savedState.contactSuccessHeading ||
    contactSuccessSubtext !== savedState.contactSuccessSubtext

  const handleDiscard = () => {
    setVideoUrl(savedState.heroVideoUrl)
    setVideoThumb(savedState.heroVideoThumb)
    setCustomUrlInput(savedState.heroVideoUrl)
    setUnveilLabel(savedState.unveilLabel)
    setUnveilHeading(savedState.unveilHeading)
    setUnveilSubtext(savedState.unveilSubtext)
    setCollectionEyebrow(savedState.collectionEyebrow)
    setCollectionHeading(savedState.collectionHeading)
    setCollectionDescription(savedState.collectionDescription)
    setSpacesHeading(savedState.spacesHeading)
    setSpacesDescription(savedState.spacesDescription)
    setAdvisoryEyebrow(savedState.advisoryEyebrow)
    setAdvisoryHeading(savedState.advisoryHeading)
    setAdvisoryDescription(savedState.advisoryDescription)
    setAdvisoryFooterNote(savedState.advisoryFooterNote)
    setContactEyebrow(savedState.contactEyebrow)
    setContactHeading(savedState.contactHeading)
    setContactDescription(savedState.contactDescription)
    setContactPhone(savedState.contactPhone)
    setContactEmail(savedState.contactEmail)
    setContactOfficeAddress(savedState.contactOfficeAddress)
    setContactWhatsappNumber(savedState.contactWhatsappNumber)
    setContactFormHeading(savedState.contactFormHeading)
    setContactFormSubtext(savedState.contactFormSubtext)
    setContactSuccessHeading(savedState.contactSuccessHeading)
    setContactSuccessSubtext(savedState.contactSuccessSubtext)
    setToast(null)
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  // Handle direct file upload from device
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate video type
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      setToast({ type: 'error', message: 'Please select a valid video file (.mp4, .webm, .mov).' })
      return
    }

    try {
      setUploading(true)
      setUploadProgress(10)
      setUploadedFileName(file.name)
      setToast(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'homepage')
      formData.append('mediaRole', 'HOMEPAGE_VIDEO')

      // Use XMLHttpRequest for progress feedback
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/media/upload', true)

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100)
          setUploadProgress(Math.min(pct, 95))
        }
      }

      const uploadPromise = new Promise<{ publicUrl: string }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText)
              resolve(res)
            } catch {
              reject(new Error('Failed to parse server response'))
            }
          } else {
            reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during file upload.'))
      })

      xhr.send(formData)
      const data = await uploadPromise

      setUploadProgress(100)
      setVideoUrl(data.publicUrl)
      setCustomUrlInput(data.publicUrl)
      setToast({
        type: 'success',
        message: `Video "${file.name}" uploaded successfully! Click "Save & Publish" to update the live homepage.`,
      })
    } catch (err: any) {
      console.error('Video upload error:', err)
      setToast({ type: 'error', message: err.message || 'Video upload failed. Please try again.' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle poster thumbnail upload
  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingThumb(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'homepage')
      formData.append('mediaRole', 'HOMEPAGE_POSTER')

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Thumbnail upload failed')
      setVideoThumb(data.publicUrl)
      setToast({ type: 'success', message: 'Video poster thumbnail updated.' })
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Thumbnail upload failed.' })
    } finally {
      setUploadingThumb(false)
      if (thumbInputRef.current) thumbInputRef.current.value = ''
    }
  }

  // Apply custom URL
  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) {
      setToast({ type: 'error', message: 'Please enter a valid video URL or path.' })
      return
    }
    setVideoUrl(customUrlInput.trim())
    setToast({
      type: 'success',
      message: 'Video URL applied to preview. Click "Save & Publish" to push live.',
    })
  }

  // Save and publish to live homepage
  const handleSave = async () => {
    try {
      setSaving(true)
      setToast(null)

      const payload = {
        heroVideoUrl: videoUrl.trim() || null,
        heroVideoThumb: videoThumb.trim() || null,
        unveilLabel: unveilLabel.trim() || null,
        unveilHeading: unveilHeading.trim() || null,
        unveilSubtext: unveilSubtext.trim() || null,
        collectionEyebrow: collectionEyebrow.trim() || null,
        collectionHeading: collectionHeading.trim() || null,
        collectionDescription: collectionDescription.trim() || null,
        spacesHeading: spacesHeading.trim() || null,
        spacesDescription: spacesDescription.trim() || null,
        advisoryEyebrow: advisoryEyebrow.trim() || null,
        advisoryHeading: advisoryHeading.trim() || null,
        advisoryDescription: advisoryDescription.trim() || null,
        advisoryFooterNote: advisoryFooterNote.trim() || null,
        contactEyebrow: contactEyebrow.trim() || null,
        contactHeading: contactHeading.trim() || null,
        contactDescription: contactDescription.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactOfficeAddress: contactOfficeAddress.trim() || null,
        contactWhatsappNumber: contactWhatsappNumber.trim() || null,
        contactFormHeading: contactFormHeading.trim() || null,
        contactFormSubtext: contactFormSubtext.trim() || null,
        contactSuccessHeading: contactSuccessHeading.trim() || null,
        contactSuccessSubtext: contactSuccessSubtext.trim() || null,
      }

      const res = await fetch('/api/admin/homepage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        const nextState = {
          heroVideoUrl: data.heroVideoUrl || '',
          heroVideoThumb: data.heroVideoThumb || '',
          unveilLabel: data.unveilLabel || '',
          unveilHeading: data.unveilHeading || '',
          unveilSubtext: data.unveilSubtext || '',
          collectionEyebrow: data.collectionEyebrow || '',
          collectionHeading: data.collectionHeading || '',
          collectionDescription: data.collectionDescription || '',
          spacesHeading: data.spacesHeading || '',
          spacesDescription: data.spacesDescription || '',
          advisoryEyebrow: data.advisoryEyebrow || '',
          advisoryHeading: data.advisoryHeading || '',
          advisoryDescription: data.advisoryDescription || '',
          advisoryFooterNote: data.advisoryFooterNote || '',
          contactEyebrow: data.contactEyebrow || '',
          contactHeading: data.contactHeading || '',
          contactDescription: data.contactDescription || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          contactOfficeAddress: data.contactOfficeAddress || '',
          contactWhatsappNumber: data.contactWhatsappNumber || '',
          contactFormHeading: data.contactFormHeading || '',
          contactFormSubtext: data.contactFormSubtext || '',
          contactSuccessHeading: data.contactSuccessHeading || '',
          contactSuccessSubtext: data.contactSuccessSubtext || '',
        }
        setSavedState(nextState)
        setVideoUrl(nextState.heroVideoUrl)
        setVideoThumb(nextState.heroVideoThumb)
        setCustomUrlInput(nextState.heroVideoUrl)
        setUnveilLabel(nextState.unveilLabel)
        setUnveilHeading(nextState.unveilHeading)
        setUnveilSubtext(nextState.unveilSubtext)
        setCollectionEyebrow(nextState.collectionEyebrow)
        setCollectionHeading(nextState.collectionHeading)
        setCollectionDescription(nextState.collectionDescription)
        setSpacesHeading(nextState.spacesHeading)
        setSpacesDescription(nextState.spacesDescription)
        setAdvisoryEyebrow(nextState.advisoryEyebrow)
        setAdvisoryHeading(nextState.advisoryHeading)
        setAdvisoryDescription(nextState.advisoryDescription)
        setAdvisoryFooterNote(nextState.advisoryFooterNote)
        setContactEyebrow(nextState.contactEyebrow)
        setContactHeading(nextState.contactHeading)
        setContactDescription(nextState.contactDescription)
        setContactPhone(nextState.contactPhone)
        setContactEmail(nextState.contactEmail)
        setContactOfficeAddress(nextState.contactOfficeAddress)
        setContactWhatsappNumber(nextState.contactWhatsappNumber)
        setContactFormHeading(nextState.contactFormHeading)
        setContactFormSubtext(nextState.contactFormSubtext)
        setContactSuccessHeading(nextState.contactSuccessHeading)
        setContactSuccessSubtext(nextState.contactSuccessSubtext)

        setToast({
          type: 'success',
          message: 'Homepage media and editorial copy successfully saved and published!',
        })
      } else {
        setToast({
          type: 'error',
          message: data.error || 'Failed to update homepage content.',
        })
      }
    } catch (err: any) {
      console.error('Error saving homepage content:', err)
      setToast({ type: 'error', message: 'Network error saving homepage configuration.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg border animate-in fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-[#ECFDF5] border-2 border-[#10B981] text-[#064E3B] font-bold'
              : 'bg-[#FEE2E2] border-2 border-[#DC2626] text-[#7F1D1D] font-bold'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#059669]" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-[#B91C1C]" />
            )}
            <span className="text-xs leading-relaxed">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs px-2 py-1 rounded hover:bg-black/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC] font-semibold">
              Apex Flagship Experience
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2.5">
            {activeTab === 'media' ? (
              <>
                <Film className="w-6 h-6 text-[#7DD3FC]" />
                <span>Home Page Video</span>
              </>
            ) : (
              <>
                <Edit className="w-6 h-6 text-[#7DD3FC]" />
                <span>Homepage Editorial Content</span>
              </>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'media'
              ? 'Manage the flagship cinematic hero video running on the Apex Pacific Holdings homepage.'
              : 'Curate headlines, descriptions, and callouts across all homepage stack sections.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[#070E1C] border border-white/15 hover:border-[#7DD3FC]/50 text-xs text-white hover:text-[#7DD3FC] flex items-center gap-2 transition-all shadow-sm group"
          >
            <span>View Live Homepage</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="px-5 py-2 rounded-lg bg-[#7DD3FC] hover:bg-white text-[#040810] text-xs font-bold tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.25)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{hasUnsavedChanges ? 'Save & Publish *' : 'Save & Publish'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#070E1C] border border-white/10 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'media'
              ? 'bg-[#7DD3FC] text-[#040810] shadow-sm font-semibold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Hero Cinematic Media</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-[#7DD3FC] text-[#040810] shadow-sm font-semibold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>Editorial Sections &amp; Headings</span>
        </button>
      </div>

      {/* Unsaved changes notice banner */}
      {hasUnsavedChanges && (
        <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-500 text-amber-950 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>You have unsaved changes. Click &quot;Save &amp; Publish&quot; to push updates to the live website.</span>
          </div>
          <button
            onClick={handleDiscard}
            className="text-xs underline text-amber-900 hover:text-black font-semibold cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}

      {/* SECTION 1: CINEMATIC LIVE VIDEO PLAYER PREVIEW */}
      {activeTab === 'media' && (
        <>
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-0">
        {/* Top Player Control Header */}
        <div className="p-4 px-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#0B1528]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
              {hasUnsavedChanges ? 'Live Video Preview (Pending Save)' : 'Currently Live on Homepage'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 px-3 rounded-md bg-white/10 hover:bg-white/20 text-xs text-white font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0
                  videoRef.current.play()
                  setIsPlaying(true)
                }
              }}
              className="p-1.5 px-3 rounded-md bg-white/10 hover:bg-white/20 text-xs text-white font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restart Video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </div>

        {/* Cinematic Video Showcase */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            poster={videoThumb || undefined}
            autoPlay
            loop
            muted
            playsInline
            controls
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          <div className="absolute bottom-4 left-4 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-gray-300 max-w-[80%] truncate">
            <span className="text-gray-400">Source: </span>
            <span className="text-[#7DD3FC] font-semibold">{videoUrl}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: UPDATE VIDEO OPTIONS (UPLOAD OR URL) */}
      <div className="bg-[#070E1C] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide">
            Change Home Page Video
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Choose whether to upload a video file directly from your computer or provide a hosted URL link.
          </p>
        </div>

        {/* Switcher Tabs */}
        <div className="flex border-b border-white/10 gap-3">
          <button
            type="button"
            onClick={() => setUploadMode('upload')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              uploadMode === 'upload'
                ? 'border-[#7DD3FC] text-[#7DD3FC]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Upload from Computer (Explorer)</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              uploadMode === 'url'
                ? 'border-[#7DD3FC] text-[#7DD3FC]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Enter Video URL Directly</span>
          </button>
          <button
            type="button"
            onClick={() => setLibraryTarget('video')}
            className="pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 border-transparent text-gray-400 hover:text-[#7DD3FC] transition-all cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-[#7DD3FC]" />
            <span>From Library</span>
          </button>
        </div>

        {/* Tab 1: Direct File Upload */}
        {uploadMode === 'upload' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/m4v"
              onChange={handleFileUpload}
              className="hidden"
              id="homepage-video-file-input"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-[#7DD3FC]/70 bg-[#040810] hover:bg-[#040810]/80 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-14 h-14 mx-auto rounded-xl bg-white/5 border border-white/10 group-hover:border-[#7DD3FC]/40 group-hover:bg-[#7DD3FC]/10 flex items-center justify-center transition-all">
                <UploadCloud className="w-7 h-7 text-gray-400 group-hover:text-[#7DD3FC] transition-colors" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white group-hover:text-[#7DD3FC] transition-colors">
                  Click to select video from your File Explorer
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports MP4, WebM, MOV video files. Automatically saved and previewed.
                </p>
              </div>

              <span className="inline-block text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                Max recommended size: 100MB · 1080p / 4K Cinematic
              </span>
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="p-4 rounded-xl bg-[#040810] border border-[#7DD3FC]/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7DD3FC]" />
                    <span>Uploading "{uploadedFileName}"...</span>
                  </span>
                  <span className="text-[#7DD3FC] font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7DD3FC] to-sky-400 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: URL Input */}
        {uploadMode === 'url' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2 font-medium">
                Video Stream URL or Local Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="e.g. /videos/home-page.mp4 or https://..."
                  className="flex-1 bg-[#040810] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC] font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
                >
                  Preview Video
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                You can specify any video file hosted in <code className="text-[#7DD3FC]">/videos/</code> or an external CDN/S3/R2 URL.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: POSTER / THUMBNAIL (OPTIONAL) */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-white block">
                Video Poster / Thumbnail (Shown while video loads)
              </label>
              <p className="text-[11px] text-gray-400">
                Recommended 1920x1080 static frame.
              </p>
            </div>

            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbUpload}
              className="hidden"
              id="homepage-thumb-file-input"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploadingThumb}
                onClick={() => thumbInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#7DD3FC]" />
                <span>{uploadingThumb ? 'Uploading...' : 'Upload Image'}</span>
              </button>
              <button
                type="button"
                disabled={uploadingThumb}
                onClick={() => setLibraryTarget('thumb')}
                className="px-3 py-1.5 rounded-lg bg-[#0B1528] hover:bg-[#11203B] border border-white/15 text-xs text-gray-200 font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#7DD3FC]" />
                <span>From Library</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {videoThumb && (
              <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/15 bg-black shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={videoThumb} alt="Poster preview" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              type="text"
              value={videoThumb}
              onChange={(e) => setVideoThumb(e.target.value)}
              placeholder="/images/hero-thumb.jpg"
              className="flex-1 bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC] font-mono"
            />
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {hasUnsavedChanges ? (
              <span className="text-amber-300 font-semibold">● Changes ready to publish</span>
            ) : (
              <span className="text-emerald-400 font-semibold">✓ Currently in sync with homepage</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Discard Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="px-6 py-2.5 rounded-lg bg-[#7DD3FC] hover:bg-white text-[#040810] text-xs font-bold tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.25)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Publish to Homepage</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </>
    )}

      {/* SECTION 2: EDITORIAL CONTENT & HEADINGS */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Card 1: Unveil Section */}
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7DD3FC]" />
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
                  1. Unveil Section (New Launches)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#7DD3FC]">#unveil</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Section Eyebrow Label
                </label>
                <input
                  type="text"
                  value={unveilLabel}
                  onChange={(e) => setUnveilLabel(e.target.value)}
                  placeholder="NEW LAUNCHES"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Default: NEW LAUNCHES</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Unveil Main Heading
                </label>
                <input
                  type="text"
                  value={unveilHeading}
                  onChange={(e) => setUnveilHeading(e.target.value)}
                  placeholder="Unveil the Latest in Exceptional Living"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Default: Unveil the Latest in Exceptional Living</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Unveil Subtext / Narrative
                </label>
                <textarea
                  rows={2}
                  value={unveilSubtext}
                  onChange={(e) => setUnveilSubtext(e.target.value)}
                  placeholder="Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: The Collection Showcase */}
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7DD3FC]" />
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
                  2. The Collection Showcase
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#7DD3FC]">#collection</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Collection Eyebrow Label
                </label>
                <input
                  type="text"
                  value={collectionEyebrow}
                  onChange={(e) => setCollectionEyebrow(e.target.value)}
                  placeholder="SIGNATURE RESIDENCES"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Default: SIGNATURE RESIDENCES</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Collection Heading
                </label>
                <input
                  type="text"
                  value={collectionHeading}
                  onChange={(e) => setCollectionHeading(e.target.value)}
                  placeholder="The collection"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Default: The collection</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Collection Description
                </label>
                <textarea
                  rows={2}
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  placeholder="Five addresses, each designed around its site. Drag, swipe or click to explore the portfolio."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Spaces in the Round */}
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7DD3FC]" />
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
                  3. Spaces in the Round
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#7DD3FC]">#spaces</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Spaces Heading
                </label>
                <input
                  type="text"
                  value={spacesHeading}
                  onChange={(e) => setSpacesHeading(e.target.value)}
                  placeholder="Spaces in the round"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Default: Spaces in the round</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Spaces Description
                </label>
                <textarea
                  rows={2}
                  value={spacesDescription}
                  onChange={(e) => setSpacesDescription(e.target.value)}
                  placeholder="Exteriors and interiors from across the portfolio. Drag the ring to turn it."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Private Advisory */}
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7DD3FC]" />
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
                  4. Private Advisory &amp; Enquiries
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#7DD3FC]">#advisory</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Advisory Eyebrow Label
                </label>
                <input
                  type="text"
                  value={advisoryEyebrow}
                  onChange={(e) => setAdvisoryEyebrow(e.target.value)}
                  placeholder="PRIVATE ADVISORY"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Default: PRIVATE ADVISORY</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Advisory Heading
                </label>
                <input
                  type="text"
                  value={advisoryHeading}
                  onChange={(e) => setAdvisoryHeading(e.target.value)}
                  placeholder="Begin your conversation"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Default: Begin your conversation</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Advisory Narrative / Description
                </label>
                <textarea
                  rows={2}
                  value={advisoryDescription}
                  onChange={(e) => setAdvisoryDescription(e.target.value)}
                  placeholder="Our senior partners advise private clients and family offices on prime residential acquisitions across the Gulf, Southeast Asia, and Australasia."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Advisory Confidentiality Note / Footer Note
                </label>
                <input
                  type="text"
                  value={advisoryFooterNote}
                  onChange={(e) => setAdvisoryFooterNote(e.target.value)}
                  placeholder="Confidential consultations available in Dubai, Singapore, and London."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Contact Details & Global Channels */}
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7DD3FC]" />
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
                  5. Contact Details &amp; Global Channels
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#7DD3FC]">#contact</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Contact Eyebrow
                </label>
                <input
                  type="text"
                  value={contactEyebrow}
                  onChange={(e) => setContactEyebrow(e.target.value)}
                  placeholder="Private Enquiries & Advisory"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Contact Main Heading
                </label>
                <input
                  type="text"
                  value={contactHeading}
                  onChange={(e) => setContactHeading(e.target.value)}
                  placeholder="Connect With Our Desk"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Contact Description / Advisory Subtitle
                </label>
                <textarea
                  rows={2}
                  value={contactDescription}
                  onChange={(e) => setContactDescription(e.target.value)}
                  placeholder="Please enter your requirements below. Our advisory office will review your enquiry confidentially and respond with a curated dossier."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+971 4 248 3888"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Official Concierge Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="concierge@apexpacificholdings.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  WhatsApp Advisory Number
                </label>
                <input
                  type="text"
                  value={contactWhatsappNumber}
                  onChange={(e) => setContactWhatsappNumber(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Global Office Address
                </label>
                <input
                  type="text"
                  value={contactOfficeAddress}
                  onChange={(e) => setContactOfficeAddress(e.target.value)}
                  placeholder="Level 42, Al Saada Tower, DIFC, Dubai, UAE"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Form Heading
                </label>
                <input
                  type="text"
                  value={contactFormHeading}
                  onChange={(e) => setContactFormHeading(e.target.value)}
                  placeholder="Private Advisory Consultation"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Form Subtitle
                </label>
                <input
                  type="text"
                  value={contactFormSubtext}
                  onChange={(e) => setContactFormSubtext(e.target.value)}
                  placeholder="Direct registration with our senior managing partners"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Success Modal Heading
                </label>
                <input
                  type="text"
                  value={contactSuccessHeading}
                  onChange={(e) => setContactSuccessHeading(e.target.value)}
                  placeholder="Enquiry Received"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Success Modal Message
                </label>
                <input
                  type="text"
                  value={contactSuccessSubtext}
                  onChange={(e) => setContactSuccessSubtext(e.target.value)}
                  placeholder="Thank you for registering your interest with Apex Pacific Holdings. Our partners will review your requirements and follow up confidentially."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Bar for Editorial Sections */}
          <div className="p-4 px-6 rounded-2xl bg-[#0B1528] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="text-xs font-mono">
              {hasUnsavedChanges ? (
                <span className="text-amber-300 font-semibold">● Unsaved editorial changes pending</span>
              ) : (
                <span className="text-emerald-400 font-semibold">✓ Content in sync with database</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                className="px-6 py-2.5 rounded-lg bg-[#7DD3FC] hover:bg-white text-[#040810] text-xs font-bold tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(125,211,252,0.25)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Publish Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaLibraryModal
        open={libraryTarget !== null}
        title={
          libraryTarget === 'video'
            ? 'Choose Homepage Hero Video from Library'
            : 'Choose Homepage Poster Thumbnail from Library'
        }
        initialFolder="homepage"
        acceptFilter={libraryTarget === 'thumb' ? 'image' : 'video'}
        onSelect={(url) => {
          if (libraryTarget === 'video') {
            setVideoUrl(url)
            setCustomUrlInput(url)
          } else if (libraryTarget === 'thumb') {
            setVideoThumb(url)
          }
          setLibraryTarget(null)
        }}
        onClose={() => setLibraryTarget(null)}
      />
    </div>
  )
}
