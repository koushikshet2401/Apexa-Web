export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
  format: string // placeholder/mask format
  minLength: number
  maxLength: number
}

export const COUNTRIES: Country[] = [
  // Core Focus Territories
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', format: '50 123 4567', minLength: 9, maxLength: 9 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '98765 43210', minLength: 10, maxLength: 10 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', format: '81 234 5678', minLength: 9, maxLength: 10 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', format: '12 345 6789', minLength: 9, maxLength: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '412 345 678', minLength: 9, maxLength: 9 },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪', format: '599 12 34 56', minLength: 9, maxLength: 9 },

  // GCC / Middle East
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', format: '50 123 4567', minLength: 9, maxLength: 9 },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', format: '3312 3456', minLength: 8, maxLength: 8 },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', format: '9123 4567', minLength: 8, maxLength: 8 },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', format: '3612 3456', minLength: 8, maxLength: 8 },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', format: '9123 4567', minLength: 8, maxLength: 8 },

  // Global Financial & Private Client Hubs
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '7911 123456', minLength: 10, maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '(555) 012-3456', minLength: 10, maxLength: 10 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', format: '8123 4567', minLength: 8, maxLength: 8 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', format: '78 123 45 67', minLength: 9, maxLength: 9 },
  { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨', format: '6 12 34 56 78', minLength: 8, maxLength: 9 },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', format: '9123 4567', minLength: 8, maxLength: 8 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '151 23456789', minLength: 10, maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '6 12 34 56 78', minLength: 9, maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: '312 345 6789', minLength: 10, maxLength: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '(555) 012-3456', minLength: 10, maxLength: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '90 1234 5678', minLength: 10, maxLength: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: '10 1234 5678', minLength: 10, maxLength: 10 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', format: '21 123 4567', minLength: 8, maxLength: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', format: '82 123 4567', minLength: 9, maxLength: 9 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', format: '300 1234567', minLength: 10, maxLength: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', format: '1712 345678', minLength: 10, maxLength: 10 },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', format: '9841 234567', minLength: 10, maxLength: 10 },
]

export const DEFAULT_COUNTRY = COUNTRIES[0] // UAE (+971)

/**
 * Smart phone parser & country detector:
 * Handles pasted text like "+971 50 123 4567", "0044 7911 123456", "+91 98765 43210"
 */
export function parsePastedPhone(
  rawInput: string,
  currentCountry: Country
): { detectedCountry: Country; nationalNumber: string } {
  let cleaned = rawInput.trim()
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2)
  }

  if (cleaned.startsWith('+')) {
    const sortedCountries = [...COUNTRIES].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    )
    for (const c of sortedCountries) {
      if (cleaned.startsWith(c.dialCode)) {
        return {
          detectedCountry: c,
          nationalNumber: cleaned.slice(c.dialCode.length).trim(),
        }
      }
    }
  }

  return {
    detectedCountry: currentCountry,
    nationalNumber: cleaned.replace(/\D/g, ''),
  }
}

export function validatePhoneNumber(
  phone: string,
  country: Country
): { isValid: boolean; error?: string; e164?: string } {
  const digitsOnly = phone.replace(/\D/g, '')

  if (!digitsOnly) {
    return { isValid: false, error: 'Phone number is required.' }
  }

  if (digitsOnly.length < country.minLength) {
    return {
      isValid: false,
      error: `Number is too short for ${country.name} (minimum ${country.minLength} digits).`,
    }
  }

  if (digitsOnly.length > country.maxLength) {
    return {
      isValid: false,
      error: `Number is too long for ${country.name} (maximum ${country.maxLength} digits).`,
    }
  }

  return {
    isValid: true,
    e164: `${country.dialCode}${digitsOnly}`,
  }
}

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 11)}`
}
