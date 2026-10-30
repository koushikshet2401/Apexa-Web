'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export function EnquiryForm({ propertyName }: { propertyName: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refId, setRefId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)

    const rawPhone = (formData.get('phone') as string) || ''
    // Ensure international format
    const formattedPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone.replace(/\D/g, '') || '971500000000'}`

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formattedPhone,
          service: 'Luxury Villas',
          message: `Private Residence Enquiry for ${propertyName}`,
          consent: true,
        }),
      })

      const data = await response.json()
      if (data?.enquiryId) {
        setRefId(data.enquiryId)
      }
    } catch (err) {
      console.warn('Enquiry dispatch error:', err)
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="py-8 text-center sm:text-left">
        <div className="w-10 h-10 rounded-full border border-sky-400 bg-sky-400/10 flex items-center justify-center mb-4 mx-auto sm:mx-0">
          <Check size={18} className="text-sky-400" strokeWidth={2} />
        </div>
        <p className="text-white font-serif text-xl mb-1">Enquiry Registered</p>
        <p className="text-[#94A3B8] text-xs leading-relaxed mb-4">
          Our team will be in touch confidentially within one working day regarding {propertyName}.
        </p>
        {refId && (
          <div className="inline-block px-3 py-1 rounded bg-white/[0.04] border border-white/10 font-mono text-[10px] text-[#7DD3FC]">
            REF: {refId}
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="font-mono text-xs uppercase tracking-wider text-[#7DD3FC] mb-2">
        Enquire about {propertyName}
      </p>
      {[
        ['name', 'Full Name', 'text', 'Your name'],
        ['email', 'Email Address', 'email', 'name@example.com'],
        ['phone', 'Phone (+Country Code)', 'tel', '+971 50 123 4567'],
      ].map(([name, label, type, placeholder]) => (
        <div key={name} className="flex flex-col gap-1.5">
          <label htmlFor={`enquiry-${name}`} className="font-mono text-[11px] uppercase tracking-wider text-[#94A3B8]">
            {label}
          </label>
          <input
            id={`enquiry-${name}`}
            type={type}
            name={name}
            required
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1528] border border-white/10 text-white text-xs placeholder:text-[#64748B] focus:outline-none focus:border-sky-400 transition-colors"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full bg-white text-[#040810] text-xs font-mono tracking-widest uppercase hover:bg-sky-200 transition-colors duration-300 mt-4 font-semibold disabled:opacity-50 cursor-pointer shadow-md"
      >
        {loading ? 'Submitting...' : 'Register Private Interest'}
      </button>
    </form>
  )
}
