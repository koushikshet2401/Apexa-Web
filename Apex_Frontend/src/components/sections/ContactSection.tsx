'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Search,
  ShieldCheck,
  ArrowUpRight,
  X,
} from 'lucide-react'
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  Country,
  parsePastedPhone,
  validatePhoneNumber,
  formatPhoneNumber,
} from '@/data/countries'
import { ApexMonogram } from '@/components/ui/ApexMonogram'
import { cn } from '@/lib/utils'

// Verified practice categories
const SERVICE_OPTIONS = [
  'Luxury Villas',
  'Commercial Properties',
  'Sky Residences',
  'General Enquiry',
]

export interface ContactSectionProps {
  isOpen?: boolean
  onClose?: () => void
}

export function ContactSection({ isOpen, onClose }: ContactSectionProps) {
  // Modal visibility state (click-to-open only)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const activeOpen = isOpen !== undefined ? isOpen : isModalOpen

  // Form field states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedService, setSelectedService] = useState('Luxury Villas')
  const [message, setMessage] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  // UI state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const serviceDropdownRef = useRef<HTMLDivElement>(null)
  const countrySearchInputRef = useRef<HTMLInputElement>(null)

  // Handle Close
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      setIsModalOpen(false)
    }
    if (typeof window !== 'undefined' && window.location.hash === '#contact') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [onClose])

  // Listen for open events ('open-contact'), hash changes (#contact), and Escape key
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsModalOpen(true)
    }

    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#contact') {
        setIsModalOpen(true)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeOpen) {
        handleClose()
      }
    }

    window.addEventListener('open-contact', handleOpenEvent)
    window.addEventListener('hashchange', handleHash)
    window.addEventListener('keydown', handleKeyDown)

    // Check initial hash on mount
    handleHash()

    return () => {
      window.removeEventListener('open-contact', handleOpenEvent)
      window.removeEventListener('hashchange', handleHash)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeOpen, handleClose])

  // Synchronize Lenis and Body Scroll when modal opens/closes
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis
    if (activeOpen) {
      if (lenis) lenis.stop()
      document.body.style.overflow = 'hidden'
    } else {
      if (lenis) lenis.start()
      document.body.style.overflow = ''
    }
    return () => {
      if (lenis) lenis.start()
      document.body.style.overflow = ''
    }
  }, [activeOpen])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false)
      }
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsServiceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when country dropdown opens
  useEffect(() => {
    if (isCountryDropdownOpen) {
      setTimeout(() => countrySearchInputRef.current?.focus(), 50)
    } else {
      setCountrySearch('')
    }
  }, [isCountryDropdownOpen])

  // Handle phone paste with auto-country detection
  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const { detectedCountry, nationalNumber } = parsePastedPhone(pastedText, selectedCountry)
    setSelectedCountry(detectedCountry)
    setPhoneNumber(formatPhoneNumber(nationalNumber))
    setValidationErrors((prev) => ({ ...prev, phone: '' }))
  }

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    if (rawVal.startsWith('+')) {
      const { detectedCountry, nationalNumber } = parsePastedPhone(rawVal, selectedCountry)
      setSelectedCountry(detectedCountry)
      setPhoneNumber(formatPhoneNumber(nationalNumber))
    } else {
      setPhoneNumber(formatPhoneNumber(rawVal))
    }
    if (validationErrors.phone) {
      setValidationErrors((prev) => ({ ...prev, phone: '' }))
    }
  }

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.name = 'Please enter your full name (minimum 2 characters).'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    const phoneValidation = validatePhoneNumber(phoneNumber, selectedCountry)
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || 'Please enter a valid phone number.'
    }

    if (!consentGiven) {
      errors.consent = 'Please provide consent to proceed with your enquiry.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const phoneValidation = validatePhoneNumber(phoneNumber, selectedCountry)
      const e164Phone = phoneValidation.e164 || `${selectedCountry.dialCode}${phoneNumber.replace(/\D/g, '')}`

      const payload = {
        name: fullName.trim(),
        phone: e164Phone,
        countryCode: selectedCountry.code,
        email: email.trim(),
        service: selectedService,
        message: message.trim(),
        consent: consentGiven,
        consentTimestamp: new Date().toISOString(),
        honeypot,
      }

      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit enquiry. Please try again.')
      }

      setSubmissionId(data.enquiryId || 'APX-CONFIRMED')
      setSubmitted(true)
    } catch (err: any) {
      console.error('Enquiry submission error:', err)
      setFormError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter countries by search query
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  )

  return (
    <AnimatePresence>
      {activeOpen && (
        <motion.div
          id="contact"
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] w-full h-full min-h-[100dvh] max-h-[100dvh] bg-[#040810] text-[#F8FAFC] flex flex-col overflow-hidden shadow-2xl"
          aria-label="Private Enquiries"
          role="dialog"
          aria-modal="true"
        >
          {/* Background Video: public/videos/gemini_generated_video_0e105bc8.mp4 */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <video
              src="/videos/gemini_generated_video_0e105bc8.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle clean overlay without blur or heavy gradients */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          </div>

          {/* Sticky Top Navigation Bar with Close Button (Always visible during scrolling) */}
          <div className="sticky top-0 z-30 w-full bg-[#040810]/80 backdrop-blur-md border-b border-white/10 shrink-0">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-10 py-3 sm:py-4">
              <div className="flex items-center gap-3">
                <span className="font-serif text-xs sm:text-sm tracking-[0.25em] text-white uppercase font-light drop-shadow-md">
                  APEX PACIFIC HOLDINGS
                </span>
                <span className="hidden sm:inline-block font-mono text-[9px] tracking-[0.2em] text-[#7DD3FC] uppercase">
                  · PRIVATE ADVISORY &amp; ENQUIRIES
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/20 hover:border-white text-white hover:text-sky-300 bg-black/40 hover:bg-black/70 backdrop-blur-md transition-all text-[10px] sm:text-xs font-mono uppercase tracking-widest cursor-pointer shadow-lg active:scale-95"
                aria-label="Close Contact Modal"
              >
                <span>CLOSE</span>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Main Scrollable Content Container with Native & Touch Momentum Scrolling */}
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="relative z-10 w-full flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-5 sm:py-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            }}
          >
            <div className="container-content max-w-4xl mx-auto pb-16 sm:pb-24 pb-[calc(env(safe-area-inset-bottom)+60px)]">
              {/* Header with centered monogram and title */}
              <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-9">
                {/* APEX A Monogram Emblem */}
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="p-2.5 rounded-full border border-sky-400/30 bg-sky-400/[0.06] shadow-[0_0_25px_rgba(56,189,248,0.15)]">
                    <ApexMonogram size={34} strokeWidth={1.2} color="#7DD3FC" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mb-2.5">
                  <span className="w-8 h-px bg-sky-400/60" />
                  <span className="font-mono text-xs tracking-[0.25em] text-[#7DD3FC] uppercase font-medium">
                    Private Enquiries
                  </span>
                  <span className="w-8 h-px bg-sky-400/60" />
                </div>

                <h2 className="heading-display text-2xl sm:text-3xl md:text-4xl text-white font-light mb-2">
                  Register Your Interest
                </h2>
                <p className="font-sans text-xs sm:text-sm text-[#94A3B8] font-light leading-relaxed">
                  Please enter your requirements below. Our advisory team will review your enquiry confidentially and respond with a curated dossier.
                </p>
              </div>

              {/* Form Container */}
              <div className="max-w-2xl mx-auto">
                <div className="rounded-2xl border border-white/10 bg-[#070E1C]/85 p-5 sm:p-9 md:p-10 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
                  {submitted ? (
                    /* Confirmed Success State */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="py-10 flex flex-col items-center text-center max-w-md mx-auto"
                    >
                      <div className="w-16 h-16 rounded-full border border-sky-400 bg-sky-400/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
                        <Check size={28} className="text-[#7DD3FC]" strokeWidth={2} />
                      </div>

                      <h3 className="heading-display text-2xl sm:text-3xl text-white mb-3">
                        Enquiry Received
                      </h3>

                      <p className="text-[#94A3B8] font-light text-sm sm:text-base mb-6 leading-relaxed">
                        Thank you for registering your interest with Apex Pacific Holdings. Our team will review your requirements and follow up with a bespoke presentation.
                      </p>

                      {submissionId && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-xs text-white/70 mb-8">
                          <span className="text-white/40 uppercase">Ref ID:</span>
                          <span className="text-[#7DD3FC] font-semibold">{submissionId}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitted(false)
                            setFullName('')
                            setEmail('')
                            setPhoneNumber('')
                            setMessage('')
                            setConsentGiven(false)
                            setSubmissionId(null)
                          }}
                          className="px-6 py-3 rounded-full border border-sky-400/40 hover:border-sky-300 text-xs font-mono tracking-widest uppercase text-white hover:bg-sky-400/10 transition-colors"
                        >
                          Submit Another Enquiry
                        </button>
                        <button
                          type="button"
                          onClick={handleClose}
                          className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono tracking-widest uppercase text-white transition-colors"
                        >
                          Close Window
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* Enquiry Form */
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                      {/* Honeypot field (hidden for anti-spam) */}
                      <input
                        type="text"
                        name="website_enquiry_hp"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        className="sr-only"
                        aria-hidden="true"
                      />

                      {formError && (
                        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs">
                          {formError}
                        </div>
                      )}

                      {/* Full Name */}
                      <div>
                        <label htmlFor="fullName" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                          Full Name <span className="text-sky-400">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value)
                            if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: '' }))
                          }}
                          placeholder="Enter your name"
                          className={cn(
                            'w-full px-4 py-3 rounded-lg bg-[#0B1528] border text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-sky-400 transition-colors',
                            validationErrors.name ? 'border-red-500/60' : 'border-white/10'
                          )}
                        />
                        {validationErrors.name && (
                          <p className="mt-1.5 text-xs text-red-400">{validationErrors.name}</p>
                        )}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label htmlFor="email" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                          Email Address <span className="text-sky-400">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: '' }))
                          }}
                          placeholder="name@example.com"
                          className={cn(
                            'w-full px-4 py-3 rounded-lg bg-[#0B1528] border text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-sky-400 transition-colors',
                            validationErrors.email ? 'border-red-500/60' : 'border-white/10'
                          )}
                        />
                        {validationErrors.email && (
                          <p className="mt-1.5 text-xs text-red-400">{validationErrors.email}</p>
                        )}
                      </div>

                      {/* Phone Input with Country Selector */}
                      <div>
                        <label htmlFor="phoneNumber" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                          Contact Phone Number <span className="text-sky-400">*</span>
                        </label>
                        <div className="relative flex rounded-lg border border-white/10 bg-[#0B1528] focus-within:border-sky-400 transition-colors">
                          {/* Country trigger button */}
                          <button
                            type="button"
                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            className="flex items-center gap-1.5 px-3.5 py-3 border-r border-white/10 text-sm text-[#F8FAFC] hover:bg-white/[0.04] transition-colors shrink-0"
                          >
                            <span className="text-base">{selectedCountry.flag}</span>
                            <span className="font-mono text-xs text-[#94A3B8]">{selectedCountry.dialCode}</span>
                            <ChevronDown size={14} className="text-[#64748B]" />
                          </button>

                          {/* Number input */}
                          <input
                            id="phoneNumber"
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            onPaste={handlePhonePaste}
                            placeholder="Phone number"
                            className="w-full px-4 py-3 bg-transparent text-white text-sm placeholder:text-[#64748B] focus:outline-none"
                          />

                          {/* Country dropdown */}
                          {isCountryDropdownOpen && (
                            <div
                              ref={countryDropdownRef}
                              className="absolute left-0 top-full mt-2 w-72 max-h-60 overflow-y-auto rounded-lg bg-[#070E1C] border border-[#3B5373]/60 shadow-2xl z-50 p-2"
                            >
                              <div className="relative mb-2">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                                <input
                                  ref={countrySearchInputRef}
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  placeholder="Search country..."
                                  className="w-full pl-8 pr-3 py-1.5 rounded bg-[#0B1528] border border-white/10 text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-sky-400"
                                />
                              </div>
                              <div className="space-y-0.5">
                                {filteredCountries.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c)
                                      setIsCountryDropdownOpen(false)
                                    }}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left text-[#CBD5E1] hover:bg-white/10 hover:text-white transition-colors"
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span>{c.flag}</span>
                                      <span className="truncate">{c.name}</span>
                                    </span>
                                    <span className="font-mono text-[#64748B] shrink-0">{c.dialCode}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {validationErrors.phone && (
                          <p className="mt-1.5 text-xs text-red-400">{validationErrors.phone}</p>
                        )}
                      </div>

                      {/* Service Interest Dropdown */}
                      <div className="relative" ref={serviceDropdownRef}>
                        <label htmlFor="service-interest-button" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                          Interest Category
                        </label>
                        <button
                          id="service-interest-button"
                          type="button"
                          onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#0B1528] border border-white/10 text-white text-sm hover:border-white/20 transition-colors"
                        >
                          <span>{selectedService}</span>
                          <ChevronDown size={14} className="text-[#64748B]" />
                        </button>

                        {isServiceDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-2 rounded-lg bg-[#070E1C] border border-[#3B5373]/60 shadow-2xl z-50 p-1.5">
                            {SERVICE_OPTIONS.map((srv) => (
                              <button
                                key={srv}
                                type="button"
                                onClick={() => {
                                  setSelectedService(srv)
                                  setIsServiceDropdownOpen(false)
                                }}
                                className={cn(
                                  'w-full text-left px-3.5 py-2.5 rounded text-xs transition-colors',
                                  selectedService === srv
                                    ? 'bg-sky-400/20 text-[#7DD3FC] font-medium'
                                    : 'text-[#CBD5E1] hover:bg-white/10 hover:text-white'
                                )}
                              >
                                {srv}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message */}
                      <div>
                        <label htmlFor="message" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                          Enquiry Details (Optional)
                        </label>
                        <textarea
                          id="message"
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Tell us about your property requirements, desired destinations, or timeframe..."
                          className="w-full px-4 py-3 rounded-lg bg-[#0B1528] border border-white/10 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-sky-400 transition-colors resize-none"
                        />
                      </div>

                      {/* Consent Checkbox */}
                      <div className="pt-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consentGiven}
                            onChange={(e) => {
                              setConsentGiven(e.target.checked)
                              if (validationErrors.consent) setValidationErrors((prev) => ({ ...prev, consent: '' }))
                            }}
                            className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0B1528] text-sky-400 focus:ring-sky-400"
                          />
                          <span className="text-xs text-[#94A3B8] leading-relaxed">
                            I consent to Apex Pacific Holdings processing my enquiry confidentially in accordance with the{' '}
                            <Link href="/privacy" className="text-[#7DD3FC] hover:underline">
                              Privacy Policy
                            </Link>
                            . We never sell or share your personal data.
                          </span>
                        </label>
                        {validationErrors.consent && (
                          <p className="mt-1.5 text-xs text-red-400">{validationErrors.consent}</p>
                        )}
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-[#040810] font-sans font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_25px_rgba(56,189,248,0.25)] hover:shadow-[0_4px_30px_rgba(56,189,248,0.4)] disabled:opacity-50 mt-4 cursor-pointer"
                      >
                        {loading ? 'Submitting Enquiry...' : 'Submit Private Enquiry'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
