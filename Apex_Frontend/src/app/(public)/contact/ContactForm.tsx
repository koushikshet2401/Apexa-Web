'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Search, ShieldCheck } from 'lucide-react'
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  Country,
  parsePastedPhone,
  validatePhoneNumber,
  formatPhoneNumber,
} from '@/data/countries'
import { ApexMonogram } from '@/components/ui/ApexMonogram'

const SERVICE_OPTIONS = [
  'Luxury Villas',
  'Commercial Properties',
  'Sky Residences',
  'Waterfront Residences',
  'General Enquiry',
]

export function ContactForm() {
  const searchParams = useSearchParams()
  const prefillPropertyId = searchParams.get('propertyId') || ''
  const prefillPropertyName = searchParams.get('propertyName') || ''
  const prefillService = searchParams.get('service') || ''

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedService, setSelectedService] = useState(() => {
    if (prefillService && SERVICE_OPTIONS.includes(prefillService)) {
      return prefillService
    }
    return 'Luxury Villas'
  })
  const [message, setMessage] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [honeypot, setHoneypot] = useState('')

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

  useEffect(() => {
    if (isCountryDropdownOpen) {
      setTimeout(() => countrySearchInputRef.current?.focus(), 50)
    } else {
      setCountrySearch('')
    }
  }, [isCountryDropdownOpen])

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const { detectedCountry, nationalNumber } = parsePastedPhone(pastedText, selectedCountry)
    setSelectedCountry(detectedCountry)
    setPhoneNumber(formatPhoneNumber(nationalNumber))
    if (validationErrors.phone) {
      setValidationErrors((prev) => ({ ...prev, phone: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    if (honeypot) return

    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.name = 'Please provide your full name.'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email address.'
    }
    const phoneValidation = validatePhoneNumber(phoneNumber, selectedCountry)
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || 'Please provide a valid phone number.'
    }
    if (!consentGiven) {
      errors.consent = 'Please confirm consent to proceed.'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          phone: phoneValidation.e164 || `${selectedCountry.dialCode}${phoneNumber.replace(/\D/g, '')}`,
          service: selectedService,
          message: message.trim(),
          consent: consentGiven,
          propertyId: prefillPropertyId || undefined,
        }),
      })

      const result = await response.json()
      if (response.ok && result.success) {
        setSubmissionId(result.enquiryId || 'APX-CONFIDENTIAL')
        setSubmitted(true)
      } else {
        setFormError(result.error || 'Unable to register enquiry. Please retry.')
      }
    } catch {
      setFormError('Network error connecting to private advisory desk. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  )

  return (
    <div className="w-full">
      {/* Header with centered monogram and title */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full border border-sky-400/30 bg-sky-400/[0.06] shadow-[0_0_25px_rgba(56,189,248,0.15)]">
            <ApexMonogram size={38} strokeWidth={1.2} color="#7DD3FC" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="w-8 h-px bg-sky-400/60" />
          <span className="font-mono text-xs tracking-[0.25em] text-[#7DD3FC] uppercase font-medium">
            Private Enquiries &amp; Advisory
          </span>
          <span className="w-8 h-px bg-sky-400/60" />
        </div>

        <h1 className="heading-display text-3xl sm:text-5xl text-white font-light mb-3">
          Connect With Our Desk
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#94A3B8] font-light leading-relaxed">
          Please enter your requirements below. Our advisory office will review your enquiry confidentially and respond with a curated dossier.
        </p>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-[#070E1C]/85 p-6 sm:p-10 md:p-12 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="py-10 flex flex-col items-center text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 rounded-full border border-sky-400 bg-sky-400/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
                <Check size={28} className="text-[#7DD3FC]" strokeWidth={2} />
              </div>

              <h2 className="heading-display text-2xl sm:text-3xl text-white mb-3">
                Enquiry Received
              </h2>

              <p className="text-[#94A3B8] font-light text-sm sm:text-base mb-6 leading-relaxed">
                Thank you for registering your interest with Apex Pacific Holdings. Our partners will review your requirements and follow up confidentially.
              </p>

              {submissionId && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-xs text-white/70 mb-8">
                  <span className="text-white/40 uppercase">Ref ID:</span>
                  <span className="text-[#7DD3FC] font-semibold">{submissionId}</span>
                </div>
              )}

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
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
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

              {prefillPropertyName && (
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-400/25 flex items-center justify-between text-xs text-sky-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>
                      Inquiring regarding: <strong className="text-white font-medium">{prefillPropertyName}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-sky-300/70 uppercase tracking-wider">Property Inquiry</span>
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
                  placeholder="e.g. Lord Alexander Wright"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400 transition-colors"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                  Confidential Email <span className="text-sky-400">*</span>
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
                  placeholder="e.g. wright@familyoffice.co.uk"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400 transition-colors"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone with Country Dropdown */}
              <div>
                <label htmlFor="phone" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                  Direct Contact Number <span className="text-sky-400">*</span>
                </label>
                <div className="flex gap-2 relative">
                  {/* Country Selector Trigger */}
                  <div ref={countryDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="h-full px-3 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white flex items-center gap-2 hover:border-white/20 transition-colors min-w-[105px]"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="font-mono text-xs text-white/80">{selectedCountry.dialCode}</span>
                      <ChevronDown size={14} className="text-white/40 ml-auto" />
                    </button>

                    {/* Country Search Dropdown */}
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-72 bg-[#0B1528] border border-white/15 rounded-lg shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-white/10 flex items-center gap-2">
                          <Search size={14} className="text-white/40" />
                          <input
                            ref={countrySearchInputRef}
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c)
                                setIsCountryDropdownOpen(false)
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-sky-400/10 hover:text-white flex items-center justify-between transition-colors"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span>{c.flag}</span>
                                <span className="truncate">{c.name}</span>
                              </span>
                              <span className="font-mono text-[11px] text-white/40 ml-2">{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Input */}
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phoneNumber}
                    onPaste={handlePhonePaste}
                    onChange={(e) => {
                      setPhoneNumber(formatPhoneNumber(e.target.value))
                      if (validationErrors.phone) setValidationErrors((prev) => ({ ...prev, phone: '' }))
                    }}
                    placeholder={selectedCountry.format}
                    className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400 transition-colors font-mono"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.phone}</p>
                )}
              </div>

              {/* Service of Interest */}
              <div ref={serviceDropdownRef} className="relative">
                <label className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                  Portfolio / Practice of Interest
                </label>
                <button
                  type="button"
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white flex items-center justify-between hover:border-white/20 transition-colors text-left"
                >
                  <span>{selectedService}</span>
                  <ChevronDown size={14} className="text-white/40" />
                </button>
                {isServiceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0B1528] border border-white/15 rounded-lg shadow-2xl z-40 py-1 overflow-hidden">
                    {SERVICE_OPTIONS.map((svc) => (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => {
                          setSelectedService(svc)
                          setIsServiceDropdownOpen(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-white/80 hover:bg-sky-400/10 hover:text-white transition-colors"
                      >
                        {svc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-xs font-mono tracking-wider uppercase text-[#94A3B8] mb-2">
                  Confidential Brief / Requirements
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Outline your acquisition criteria, preferred territories, or architectural requirements..."
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400 transition-colors resize-none"
                />
              </div>

              {/* Confidentiality Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked)
                    if (validationErrors.consent) setValidationErrors((prev) => ({ ...prev, consent: '' }))
                  }}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-sky-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="consent" className="text-xs text-[#94A3B8] leading-relaxed cursor-pointer font-light">
                  I consent to Apex Pacific Holdings contacting me confidentially regarding luxury real estate opportunities. View our{' '}
                  <Link href="/privacy-policy" className="text-sky-400 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              {validationErrors.consent && (
                <p className="text-xs text-red-400">{validationErrors.consent}</p>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-[#040810] font-sans font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Submitting Confidential Dossier...' : 'Submit Confidential Enquiry'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 text-[#64748B] text-[11px]">
                <ShieldCheck size={14} className="text-sky-400" />
                <span>Strict Non-Disclosure Protocol · Direct Partner Attention</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
