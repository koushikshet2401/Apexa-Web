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
import { useTheme } from '@/components/providers/ThemeProvider'
import { themeTokens } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ContactForm({ serviceOptions }: { serviceOptions?: string[] }) {
  const { isLight } = useTheme()
  const searchParams = useSearchParams()
  const prefillPropertyId = searchParams.get('propertyId') || ''
  const prefillPropertyName = searchParams.get('propertyName') || ''
  const prefillService = searchParams.get('service') || ''

  const [servicesList, setServicesList] = useState<string[]>(() =>
    serviceOptions && serviceOptions.length > 0 ? serviceOptions : ['General Enquiry']
  )
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedService, setSelectedService] = useState(() => {
    const initial = serviceOptions && serviceOptions.length > 0 ? serviceOptions : ['General Enquiry']
    if (prefillService && initial.includes(prefillService)) {
      return prefillService
    }
    return initial[0] || 'General Enquiry'
  })

  useEffect(() => {
    if (serviceOptions && serviceOptions.length > 0) return
    let cancelled = false
    fetch('/api/public/services')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return
        const names = [...data.map((s: { name: string }) => s.name).filter(Boolean), 'General Enquiry']
        setServicesList(names)
        setSelectedService((prev) =>
          prefillService && names.includes(prefillService)
            ? prefillService
            : prev === 'General Enquiry'
              ? names[0] || 'General Enquiry'
              : prev
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [serviceOptions, prefillService])
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
          <div className={cn("p-3 rounded-full transition-colors", themeTokens.contact.monogramBadge(isLight))}>
            <ApexMonogram size={38} strokeWidth={1.2} color={themeTokens.contact.monogramColor(isLight)} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <span className={cn("w-8 h-px transition-colors", themeTokens.contact.tagLine(isLight))} />
          <span className={cn("font-mono text-xs tracking-[0.25em] uppercase font-medium transition-colors", themeTokens.contact.tag(isLight))}>
            Private Enquiries &amp; Advisory
          </span>
          <span className={cn("w-8 h-px transition-colors", themeTokens.contact.tagLine(isLight))} />
        </div>

        <h1 className={cn("heading-display text-3xl sm:text-5xl font-light mb-3 transition-colors", themeTokens.contact.heading(isLight))}>
          Connect With Our Desk
        </h1>
        <p className={cn("font-sans text-xs sm:text-sm font-light leading-relaxed transition-colors", themeTokens.contact.subheading(isLight))}>
          Please enter your requirements below. Our advisory office will review your enquiry confidentially and respond with a curated dossier.
        </p>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto">
        <div className={cn("rounded-2xl p-6 sm:p-10 md:p-12 backdrop-blur-xl transition-colors duration-300", themeTokens.contact.formCard(isLight))}>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="py-10 flex flex-col items-center text-center max-w-md mx-auto"
            >
              <div className={cn(
                "w-16 h-16 rounded-full border flex items-center justify-center mb-6 shadow-md transition-colors",
                isLight ? "border-[#0B1325]/20 bg-[#0B1325]/5 text-[#0B1325]" : "border-sky-400 bg-sky-400/10 text-[#7DD3FC]"
              )}>
                <Check size={28} strokeWidth={2} />
              </div>

              <h2 className={cn("heading-display text-2xl sm:text-3xl mb-3 transition-colors", themeTokens.contact.heading(isLight))}>
                Enquiry Received
              </h2>

              <p className={cn("font-light text-sm sm:text-base mb-6 leading-relaxed transition-colors", themeTokens.contact.subheading(isLight))}>
                Thank you for registering your interest with Apex Pacific Holdings. Our partners will review your requirements and follow up confidentially.
              </p>

              {submissionId && (
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs mb-8 transition-colors",
                  isLight ? "bg-[#0B1325]/5 border border-[#0B1325]/15 text-[#0B1325]" : "bg-white/[0.04] border border-white/10 text-white/70"
                )}>
                  <span className={cn("uppercase", isLight ? "text-[#6B6661]" : "text-white/40")}>Ref ID:</span>
                  <span className={cn("font-semibold", isLight ? "text-[#0B1325]" : "text-[#7DD3FC]")}>{submissionId}</span>
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
                className={cn(
                  "px-6 py-3 rounded-full text-xs font-mono tracking-widest uppercase transition-colors cursor-pointer",
                  isLight ? "border border-[#0B1325]/25 text-[#0B1325] hover:bg-[#0B1325]/5" : "border border-sky-400/40 hover:border-sky-300 text-white hover:bg-sky-400/10"
                )}
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
                <div className={cn(
                  "p-3.5 rounded-xl flex items-center justify-between text-xs transition-colors",
                  isLight ? "bg-[#0B1325]/5 border border-[#0B1325]/15 text-[#0B1325]" : "bg-sky-500/10 border border-sky-400/25 text-sky-200"
                )}>
                  <div className="flex items-center gap-2.5">
                    <span className={cn("w-2 h-2 rounded-full animate-pulse", isLight ? "bg-[#0B1325]" : "bg-sky-400")} />
                    <span>
                      Inquiring regarding: <strong className="font-medium">{prefillPropertyName}</strong>
                    </span>
                  </div>
                  <span className={cn("font-mono text-[10px] uppercase tracking-wider", isLight ? "text-[#6B6661]" : "text-sky-300/70")}>Property Inquiry</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className={cn("block text-xs font-mono tracking-wider uppercase mb-2 transition-colors", themeTokens.contact.label(isLight))}>
                  Full Name <span className={isLight ? "text-[#0B1325]" : "text-sky-400"}>*</span>
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
                  className={cn("w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-colors", themeTokens.contact.input(isLight))}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className={cn("block text-xs font-mono tracking-wider uppercase mb-2 transition-colors", themeTokens.contact.label(isLight))}>
                  Confidential Email <span className={isLight ? "text-[#0B1325]" : "text-sky-400"}>*</span>
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
                  className={cn("w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-colors", themeTokens.contact.input(isLight))}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone with Country Dropdown */}
              <div>
                <label htmlFor="phone" className={cn("block text-xs font-mono tracking-wider uppercase mb-2 transition-colors", themeTokens.contact.label(isLight))}>
                  Direct Contact Number <span className={isLight ? "text-[#0B1325]" : "text-sky-400"}>*</span>
                </label>
                <div className="flex gap-2 relative">
                  {/* Country Selector Trigger */}
                  <div ref={countryDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className={cn("h-full px-3 py-3 rounded-lg text-sm flex items-center gap-2 transition-colors min-w-[105px]", themeTokens.contact.input(isLight))}
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className={cn("font-mono text-xs", isLight ? "text-[#0B1325]" : "text-white/80")}>{selectedCountry.dialCode}</span>
                      <ChevronDown size={14} className={cn("ml-auto", isLight ? "text-[#0B1325]/50" : "text-white/40")} />
                    </button>

                    {/* Country Search Dropdown */}
                    {isCountryDropdownOpen && (
                      <div className={cn("absolute top-full left-0 mt-1 w-72 rounded-lg z-50 overflow-hidden transition-colors", themeTokens.contact.dropdownMenu(isLight))}>
                        <div className={cn("p-2 border-b flex items-center gap-2 transition-colors", isLight ? "border-[#0B1325]/10" : "border-white/10")}>
                          <Search size={14} className={isLight ? "text-[#0B1325]/50" : "text-white/40"} />
                          <input
                            ref={countrySearchInputRef}
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className={cn("w-full bg-transparent text-xs focus:outline-none", isLight ? "text-[#0B1325] placeholder:text-[#6B6661]/60" : "text-white placeholder-white/40")}
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
                              className={cn("w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors", themeTokens.contact.dropdownItem(isLight))}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span>{c.flag}</span>
                                <span className="truncate">{c.name}</span>
                              </span>
                              <span className={cn("font-mono text-[11px] ml-2", isLight ? "text-[#6B6661]" : "text-white/40")}>{c.dialCode}</span>
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
                    className={cn("flex-1 px-4 py-3 rounded-lg text-sm focus:outline-none transition-colors font-mono", themeTokens.contact.input(isLight))}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-400">{validationErrors.phone}</p>
                )}
              </div>

              {/* Service of Interest */}
              <div ref={serviceDropdownRef} className="relative">
                <label className={cn("block text-xs font-mono tracking-wider uppercase mb-2 transition-colors", themeTokens.contact.label(isLight))}>
                  Portfolio / Practice of Interest
                </label>
                <button
                  type="button"
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  className={cn("w-full px-4 py-3 rounded-lg text-sm flex items-center justify-between transition-colors text-left", themeTokens.contact.input(isLight))}
                >
                  <span>{selectedService}</span>
                  <ChevronDown size={14} className={isLight ? "text-[#0B1325]/50" : "text-white/40"} />
                </button>
                {isServiceDropdownOpen && (
                  <div className={cn("absolute top-full left-0 right-0 mt-1 rounded-lg z-40 py-1 overflow-hidden transition-colors", themeTokens.contact.dropdownMenu(isLight))}>
                    {servicesList.map((svc) => (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => {
                          setSelectedService(svc)
                          setIsServiceDropdownOpen(false)
                        }}
                        className={cn("w-full px-4 py-2.5 text-left text-xs transition-colors", themeTokens.contact.dropdownItem(isLight))}
                      >
                        {svc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className={cn("block text-xs font-mono tracking-wider uppercase mb-2 transition-colors", themeTokens.contact.label(isLight))}>
                  Confidential Brief / Requirements
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Outline your acquisition criteria, preferred territories, or architectural requirements..."
                  className={cn("w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-colors resize-none", themeTokens.contact.input(isLight))}
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
                  className={cn("mt-1 w-4 h-4 rounded cursor-pointer", isLight ? "border-[#0B1325]/30 text-[#0B1325] focus:ring-0" : "border-white/20 bg-white/5 text-sky-400 focus:ring-0")}
                />
                <label htmlFor="consent" className={cn("text-xs leading-relaxed cursor-pointer font-light transition-colors", themeTokens.contact.label(isLight))}>
                  I consent to Apex Pacific Holdings contacting me confidentially regarding luxury real estate opportunities. View our{' '}
                  <Link href="/privacy-policy" className={isLight ? "text-[#0B1325] underline font-medium" : "text-sky-400 hover:underline"}>
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
                  className={cn(
                    "w-full py-4 rounded-full font-sans font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50 cursor-pointer",
                    themeTokens.contact.submitButton(isLight)
                  )}
                >
                  {loading ? 'Submitting Confidential Dossier...' : 'Submit Confidential Enquiry'}
                </button>
              </div>

              <div className={cn("flex items-center justify-center gap-2 pt-2 text-[11px] transition-colors", themeTokens.contact.label(isLight))}>
                <ShieldCheck size={14} className={isLight ? "text-emerald-600" : "text-sky-400"} />
                <span>Strict Non-Disclosure Protocol · Direct Partner Attention</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
