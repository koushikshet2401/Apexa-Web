/**
 * Global Theme Design Tokens & Helper Classes
 * Warm Luxury Palette:
 * - Main Background: Warm Ivory / Pale Off-White (#FBF9F6 to #FFFFFF)
 * - Headings & Primary Body Text: Slate/Charcoal Black (#0B1325 to #1D263B)
 * - Secondary Text & Labels: Muted Gray-Brown (#6B6661)
 * - Buttons: Pure White Background (#FFFFFF), Black Text (#0B1325)
 */

export const THEME_COLORS = {
  light: {
    bgMain: '#FBF9F6',
    bgSurface: '#FFFFFF',
    bgSecondary: '#F5F2EC',
    textHeading: '#0B1325',
    textPrimary: '#0B1325',
    textSecondary: '#1D263B',
    textMuted: '#6B6661',
    buttonBg: '#FFFFFF',
    buttonText: '#0B1325',
    borderLight: 'rgba(11, 19, 37, 0.08)',
    borderDefault: 'rgba(11, 19, 37, 0.15)',
    borderStrong: 'rgba(11, 19, 37, 0.30)',
  },
  dark: {
    bgMain: '#040810',
    bgSurface: '#070E1C',
    bgSecondary: '#0B1528',
    textHeading: '#F8FAFC',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    accentSky: '#38BDF8',
    borderLight: 'rgba(255, 255, 255, 0.10)',
    borderDefault: 'rgba(255, 255, 255, 0.18)',
    borderStrong: 'rgba(255, 255, 255, 0.32)',
  },
} as const

export const themeTokens = {
  // Drawer & Full-screen overlays
  drawer: {
    container: (isLight: boolean) =>
      isLight ? 'bg-[#FBF9F6] text-[#0B1325]' : 'bg-[#040810] text-[#F8FAFC]',
    header: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6]/95 border-[#0B1325]/10 text-[#0B1325]'
        : 'bg-[#040810]/95 border-white/10 text-white',
    brand: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-sky-400',
    closeButton: (isLight: boolean) =>
      isLight
        ? 'border-[#0B1325]/20 hover:border-[#0B1325] text-[#0B1325] bg-white/60 hover:bg-[#0B1325]/5 shadow-sm'
        : 'border-white/20 hover:border-sky-400 text-white hover:text-sky-300 bg-white/[0.04] hover:bg-sky-500/15 shadow-lg',
  },

  // Typography
  typography: {
    heading: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    headingAccent: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-[#38BDF8]',
    subheading: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    primary: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-[#F8FAFC]',
    secondary: (isLight: boolean) =>
      isLight ? 'text-[#1D263B]' : 'text-[#CBD5E1]',
    muted: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#64748B]',
  },

  // Buttons & Filter Pills
  button: {
    // Default luxury white button in light mode, dark glass in dark mode
    default: (isLight: boolean, isSelected?: boolean) => {
      if (isLight) {
        return isSelected
          ? 'bg-[#0B1325] text-white border-[#0B1325] shadow-md scale-[1.02]'
          : 'bg-white text-[#0B1325] border-[#0B1325]/15 hover:border-[#0B1325]/40 hover:bg-[#FDFCFB] shadow-sm'
      }
      return isSelected
        ? 'bg-sky-500/25 border-[#38BDF8] text-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.25)] scale-[1.02]'
        : 'bg-[#070E1C]/80 border-white/20 text-neutral-200 hover:border-white/50 hover:text-white'
    },
    // Primary action button (e.g. Search, Submit)
    primary: (isLight: boolean) =>
      isLight
        ? 'bg-white text-[#0B1325] border border-[#0B1325]/25 hover:border-[#0B1325]/60 hover:bg-[#FDFCFB] shadow-md'
        : 'bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-black shadow-lg shadow-sky-500/25',
    // Card explore button
    cardAction: (isLight: boolean) =>
      isLight
        ? 'bg-white text-[#0B1325] border border-[#0B1325]/15 hover:border-[#0B1325]/40 hover:bg-[#FDFCFB] shadow-sm'
        : 'border border-white/20 group-hover:border-sky-400 bg-white/[0.04] group-hover:bg-sky-500/20 text-white group-hover:text-sky-200 shadow-md',
  },

  // Input & Form Controls
  input: {
    container: (isLight: boolean) =>
      isLight
        ? 'bg-white border-[#0B1325]/20 text-[#0B1325] focus-within:border-[#0B1325] focus-within:ring-2 focus-within:ring-[#0B1325]/10 shadow-sm'
        : 'bg-[#070E1C] border-[#38BDF8]/60 text-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/30 shadow-lg',
    icon: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-[#38BDF8]',
    field: (isLight: boolean) =>
      isLight
        ? 'text-[#0B1325] placeholder-[#6B6661]'
        : 'text-white placeholder-neutral-400',
  },

  // Cards
  card: {
    container: (isLight: boolean) =>
      isLight
        ? 'bg-white border-[#0B1325]/10 hover:border-[#0B1325]/30 text-[#0B1325] shadow-md'
        : 'bg-[#070E1C] border-white/15 hover:border-sky-400/60 text-white shadow-xl',
    badge: (isLight: boolean) =>
      isLight
        ? 'bg-white/95 text-[#0B1325] border border-[#0B1325]/15 shadow-sm'
        : 'bg-black/70 text-sky-300 border border-white/20 backdrop-blur-md',
  },

  // Dividers
  border: (isLight: boolean) =>
    isLight ? 'border-[#0B1325]/10' : 'border-white/10',

  // Collection Section Tokens
  collection: {
    container: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)]',
    eyebrow: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#7DD3FC]',
    eyebrowLine: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/40' : 'bg-sky-400',
    title: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    titleAccent: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]/75 font-normal' : 'text-sky-200',
    description: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    searchInput: (isLight: boolean) =>
      isLight
        ? 'bg-white text-[#0B1325] placeholder-[#6B6661] border-[#0B1325]/20 focus:border-[#0B1325] shadow-sm'
        : 'bg-white/[0.04] text-white placeholder-[#64748B] border-white/15 focus:border-sky-400',
    searchIcon: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]/70' : 'text-sky-400/80',
    filterChip: (isLight: boolean, isSelected: boolean) => {
      if (isLight) {
        return isSelected
          ? 'bg-[#0B1325] text-white font-semibold border-[#0B1325] shadow-sm'
          : 'bg-white text-[#0B1325] border-[#0B1325]/15 hover:border-[#0B1325]/40 hover:bg-[#FDFCFB]'
      }
      return isSelected
        ? 'bg-sky-400 text-[#040810] font-semibold border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
        : 'bg-white/[0.04] text-[#CBD5E1] border-white/10 hover:border-white/30 hover:text-white'
    },
    carouselCard: (isLight: boolean, isActive: boolean) => {
      if (isLight) {
        return isActive
          ? 'border border-[#0B1325]/30 shadow-[0_20px_50px_rgba(11,19,37,0.18)]'
          : 'border border-[#0B1325]/10 hover:opacity-70'
      }
      return isActive
        ? 'border border-sky-400/60 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
        : 'border border-white/10 hover:opacity-70'
    },
    cardExploreButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 shadow-md'
        : 'bg-white/20 hover:bg-sky-400 hover:text-[#040810] text-white border border-white/30 backdrop-blur-md shadow-lg',
    bottomLabel: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#7DD3FC]',
    bottomTitle: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    bottomSpecs: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-sky-200/80',
    bottomExploreButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 hover:border-[#0B1325]/50 shadow-md'
        : 'bg-sky-500/20 hover:bg-sky-400 text-sky-200 hover:text-[#040810] border border-sky-400/50 shadow-lg',
    divider: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/10' : 'bg-white/10',
  },

  // One Team Section Tokens (Layers 6 & 7)
  oneTeam: {
    container: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)]',
    eyebrow: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#7DD3FC]',
    eyebrowLine: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/40' : 'bg-sky-400/60',
    title: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    titleAccent: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]/75 font-normal' : 'text-sky-200',
    description: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    scrollCue: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#64748B]',
    scrollLine: (isLight: boolean) =>
      isLight
        ? 'bg-gradient-to-b from-[#0B1325]/40 to-transparent'
        : 'bg-gradient-to-b from-sky-400 to-transparent',
    cardBorder: (isLight: boolean) =>
      isLight ? 'border-[#0B1325]/15 hover:border-[#0B1325]/40' : 'border-white/10 hover:border-sky-400/50',
    videoContainer: (isLight: boolean) =>
      isLight
        ? 'border border-[#0B1325]/20 shadow-xl'
        : 'border border-white/15 shadow-2xl',
    exploreButton: (isLight: boolean) =>
      isLight
        ? 'bg-white text-[#0B1325] border border-[#0B1325]/20 shadow-sm group-hover:border-[#0B1325]'
        : 'bg-black/60 group-hover:bg-white text-white/80 group-hover:text-black border border-white/20 group-hover:border-white',
  },

  // Spaces in the Round Section Tokens (Layer 8)
  spacesInTheRound: {
    container: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)]',
    title: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    titleAccent: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]/75 font-normal' : 'text-sky-200',
    description: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    cardBorder: (isLight: boolean) =>
      isLight
        ? 'border border-[#0B1325]/20 hover:border-[#0B1325]/50 shadow-[0_20px_50px_rgba(11,19,37,0.15)] bg-white'
        : 'border border-white/20 hover:border-sky-400/60 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-[#070E1C]',
    visitButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 hover:border-[#0B1325]/50 shadow-md'
        : 'bg-black/70 hover:bg-white text-white hover:text-black border border-white/25 hover:border-white',
    navButton: (isLight: boolean) =>
      isLight
        ? 'border border-[#0B1325]/20 bg-white hover:bg-[#FDFCFB] text-[#0B1325] shadow-md'
        : 'border border-white/20 bg-black/50 hover:bg-white/10 hover:border-sky-400 text-white/80 hover:text-white shadow-lg',
    dragLabel: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
  },

  // Private Advisory Section Tokens (Layer 9)
  privateAdvisory: {
    container: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)]',
    videoOverlay: (_isLight: boolean) => 'bg-black/25',
    eyebrow: (_isLight: boolean) => 'text-[#7DD3FC] drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]',
    eyebrowLine: (_isLight: boolean) => 'bg-sky-400/80 drop-shadow-sm',
    title: (_isLight: boolean) => 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]',
    titleAccent: (_isLight: boolean) => 'text-sky-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]',
    description: (_isLight: boolean) => 'text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]',
    button: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/25 hover:border-[#0B1325]/60 shadow-lg'
        : 'bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-[#040810] shadow-[0_4px_30px_rgba(56,189,248,0.3)] hover:shadow-[0_4px_40px_rgba(56,189,248,0.5)]',
    confidentialText: (_isLight: boolean) => 'text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]',
  },

  // Footer Tokens
  footer: {
    container: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] text-[#0B1325] border-[#0B1325]/10'
        : 'bg-[#040810] text-[#F8FAFC] border-white/10',
    glow: (isLight: boolean) =>
      isLight ? 'opacity-0' : 'opacity-20 blur-[100px]',
    logoBorder: (isLight: boolean) =>
      isLight ? 'border-[#0B1325]/20 shadow-sm' : 'border-white/20',
    brandTitle: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    brandTagline: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    exploreLink: (isLight: boolean) =>
      isLight
        ? 'text-[#0B1325] hover:text-[#0B1325]/70'
        : 'text-[#7DD3FC] hover:text-white',
    divider: (isLight: boolean) =>
      isLight ? 'border-[#0B1325]/10' : 'border-white/[0.08]',
    colHeading: (isLight: boolean) =>
      isLight ? 'text-[#0B1325] font-semibold' : 'text-[#7DD3FC]',
    colList: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    colLink: (isLight: boolean) =>
      isLight ? 'hover:text-[#0B1325]' : 'hover:text-white',
    bottomText: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#64748B]',
    legalLinks: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    legalDot: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]/20' : 'text-white/20',
  },

  // Property Detail Page Tokens (CinematicPropertyDetail)
  propertyDetail: {
    pageBg: (isLight: boolean) =>
      isLight ? 'bg-[#FBF9F6] text-[#0B1325]' : 'bg-[#040810] text-[#F8FAFC]',
    backButton: (isLight: boolean) =>
      isLight
        ? 'bg-white/85 hover:bg-white text-[#0B1325] border border-[#0B1325]/20 shadow-md'
        : 'bg-black/60 hover:bg-black/90 text-[#7DD3FC] hover:text-white border border-white/20 shadow-lg',
    heroCard: (isLight: boolean) =>
      isLight
        ? 'bg-white/85 backdrop-blur-xl border border-[#0B1325]/15 shadow-xl text-[#0B1325]'
        : 'bg-black/65 sm:bg-black/55 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white',
    heroCardTag: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#7DD3FC]',
    heroCardTagLine: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/40' : 'bg-[#7DD3FC]',
    heroCardDesc: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white/85',
    heroCardButton1: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 shadow-sm'
        : 'bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white',
    heroCardButton2: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 shadow-sm'
        : 'bg-gradient-to-r from-[#0C1F38]/90 via-[#123157]/90 to-[#0C1F38]/90 hover:from-[#123157] hover:to-[#1E4D82] text-white border border-[#7DD3FC]/40 hover:border-[#7DD3FC]',
    sectionContainer: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-t border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] border-t border-white/10 shadow-[0_-40px_100px_rgba(0,0,0,0.98)]',
    showcaseContainer: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-t border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#060D1A] border-t border-white/10 shadow-[0_-35px_80px_rgba(0,0,0,0.95)]',
    label: (isLight: boolean) =>
      isLight ? 'text-[#0B1325] font-semibold' : 'text-[#7DD3FC] font-medium',
    labelLine: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/40' : 'bg-[#7DD3FC]/60',
    specs: (isLight: boolean) =>
      isLight ? 'text-[#1D263B] font-semibold' : 'text-white/95 font-medium',
    price: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    description: (isLight: boolean) =>
      isLight ? 'text-[#1D263B] font-normal' : 'text-[#F1F5F9] font-normal',
    highlightItem: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-[#F8FAFC]',
    highlightDot: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]' : 'bg-[#7DD3FC] shadow-[0_0_8px_rgba(125,211,252,0.9)]',
    showcaseTitle: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    enquiryCard: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15 shadow-xl text-[#0B1325]'
        : 'bg-[#070E1C] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-white',
    enquiryBadge: (isLight: boolean) =>
      isLight
        ? 'bg-white text-[#0B1325] border border-[#0B1325]/15 shadow-sm'
        : 'bg-sky-500/10 border-sky-400/30 text-sky-300',
    enquiryTitle: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    enquiryDesc: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    formLabel: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    formInput: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border border-[#0B1325]/15 text-[#0B1325] placeholder:text-[#6B6661]/60 focus:border-[#0B1325]'
        : 'bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 focus:border-[#7DD3FC]',
    formTargetContext: (isLight: boolean) =>
      isLight
        ? 'bg-[#F5F2EC] border border-[#0B1325]/15 text-[#0B1325]'
        : 'bg-sky-500/[0.07] border border-sky-400/20 text-white',
    formButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/25 shadow-md'
        : 'bg-white text-[#040810] hover:bg-[#7DD3FC]',
  },

  // Collection Country Page Tokens (/collection/[country])
  collectionCountry: {
    pageBg: (isLight: boolean) =>
      isLight ? 'bg-[#FBF9F6] text-[#0B1325]' : 'bg-[#040810] text-[#F8FAFC]',
    backButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/15 shadow-sm'
        : 'bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 text-[#7DD3FC] hover:text-white',
    sectionContainer: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-t border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] shadow-[0_-40px_100px_rgba(0,0,0,0.98)] border-t border-white/10',
    tag: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#7DD3FC]',
    tagLine: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/40' : 'bg-[#7DD3FC]',
    heading: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    subheading: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-white/50',
    description: (isLight: boolean) =>
      isLight ? 'text-[#1D263B]' : 'text-white/80',
    videoFrame: (isLight: boolean) =>
      isLight
        ? 'border border-[#0B1325]/15 shadow-xl bg-black'
        : 'border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)] bg-black',
    cardStageFrame: (isLight: boolean) =>
      isLight
        ? 'border border-[#0B1325]/15 bg-white shadow-xl'
        : 'border border-white/15 bg-[#070E1C] shadow-[0_25px_80px_rgba(0,0,0,0.95)]',
    cardItem: (isLight: boolean) =>
      isLight ? 'bg-white text-[#0B1325]' : 'bg-[#070E1C] text-white',
    cardBadge: (isLight: boolean) =>
      isLight
        ? 'bg-white/95 text-[#0B1325] border border-[#0B1325]/15 shadow-sm'
        : 'bg-black/70 backdrop-blur-md border border-white/20 text-[#7DD3FC]',
    cardBadgeSecondary: (isLight: boolean) =>
      isLight
        ? 'bg-white/95 text-[#6B6661] border border-[#0B1325]/15 shadow-sm'
        : 'bg-black/70 backdrop-blur-md border border-white/20 text-white/80',
    cardPrice: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-[#7DD3FC]',
    cardSpecs: (isLight: boolean) =>
      isLight ? 'text-[#6B6661] border-[#0B1325]/10' : 'text-white/70 border-white/10',
    cardDesc: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-white/80',
    cardHighlightTag: (isLight: boolean) =>
      isLight
        ? 'bg-[#F5F2EC] border border-[#0B1325]/10 text-[#1D263B]'
        : 'bg-white/5 border border-white/10 text-white/85',
    cardHighlightIcon: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-[#7DD3FC]',
    exploreButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 shadow-sm'
        : 'bg-gradient-to-r from-[#0C1F38] via-[#123157] to-[#0C1F38] hover:from-[#123157] hover:to-[#1E4D82] border border-[#7DD3FC]/40 hover:border-[#7DD3FC] text-white shadow-[0_0_20px_rgba(56,189,248,0.2)]',
    detailsButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 shadow-sm'
        : 'bg-white/5 hover:bg-[#7DD3FC]/20 border border-white/15 hover:border-[#7DD3FC] text-white hover:text-[#7DD3FC]',
    dialogContent: (isLight: boolean) =>
      isLight
        ? 'bg-white text-[#0B1325] border border-[#0B1325]/15 shadow-2xl'
        : 'bg-[#070E1C] text-white border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.95)]',
    dialogClose: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#F5F2EC] text-[#0B1325] border border-[#0B1325]/20 shadow-md'
        : 'bg-black/70 hover:bg-black text-white border border-white/20',
    inquiryCard: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15 shadow-xl text-[#0B1325]'
        : 'bg-[#070E1C] border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.9)] text-white',
    inquiryBadge: (isLight: boolean) =>
      isLight
        ? 'bg-white text-[#0B1325] border border-[#0B1325]/15 shadow-sm'
        : 'bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#7DD3FC]',
    inquiryLabel: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-white/60',
    inquiryIcon: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-white/40',
    inquiryInput: (isLight: boolean) =>
      isLight
        ? 'bg-[#FDFCFB] border border-[#0B1325]/15 text-[#0B1325] placeholder-[#6B6661]/60 focus:border-[#0B1325]'
        : 'bg-[#040810] border border-white/15 focus:border-[#7DD3FC] text-white placeholder-white/30',
    inquiryButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/25 shadow-md'
        : 'bg-gradient-to-r from-[#0C1F38] via-[#123157] to-[#0C1F38] hover:from-[#123157] hover:to-[#1E4D82] border border-[#7DD3FC]/40 hover:border-[#7DD3FC] text-white shadow-[0_0_30px_rgba(56,189,248,0.25)]',
    footerSection: (isLight: boolean) =>
      isLight ? 'bg-[#FBF9F6] border-t border-[#0B1325]/10' : 'bg-[#040810] border-t border-white/10',
  },

  // Service Detail Page Tokens (/services/[slug])
  serviceDetail: {
    pageBg: (isLight: boolean) =>
      isLight ? 'bg-[#FBF9F6] text-[#0B1325]' : 'bg-[#040810] text-[#F8FAFC]',
    backButton: (isLight: boolean) =>
      isLight
        ? 'text-[#6B6661] hover:text-[#0B1325] hover:bg-[#0B1325]/5'
        : 'text-[var(--accent)] hover:text-white hover:bg-white/5',
    sectionContainer: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-t border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] border-t border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)]',
    tag: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[var(--accent)]',
    tagLine: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/40' : 'bg-[var(--accent)]/60',
    heading: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    subheading: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-sky-200/90',
    description: (isLight: boolean) =>
      isLight ? 'text-[#1D263B]' : 'text-neutral-300',
    consultButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/25 shadow-sm'
        : 'bg-[var(--accent)] hover:bg-[#93c5fd] text-black shadow-sky-500/20',
    exploreButton: (isLight: boolean) =>
      isLight
        ? 'bg-white/80 hover:bg-white text-[#0B1325] border border-[#0B1325]/20 shadow-sm'
        : 'border-white/20 hover:border-white text-white hover:bg-white/10',
    focusCard: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15 shadow-xl text-[#0B1325]'
        : 'bg-gradient-to-b from-[#0B1528]/95 to-[#050B16]/95 border border-sky-400/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)]',
    focusIconWrap: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15'
        : 'bg-black/50 border border-white/20',
    focusCheckCircle: (isLight: boolean) =>
      isLight
        ? 'bg-[#0B1325]/5 border border-[#0B1325]/20 text-[#0B1325]'
        : 'bg-sky-500/10 border border-sky-400/30 text-[var(--accent)]',
    focusItemText: (isLight: boolean) =>
      isLight ? 'text-[#1D263B]' : 'text-neutral-200',
    focusDivider: (isLight: boolean) =>
      isLight ? 'border-[#0B1325]/10' : 'border-white/10',
    focusSubtext: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-neutral-400',
    scrollPrompt: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-neutral-400',
    propertiesSection: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-t border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#030712] border-t border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)]',
    propertyCard: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15 shadow-xl hover:shadow-2xl'
        : 'bg-[#070E1C] border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.95)] hover:shadow-[0_25px_80px_rgba(56,189,248,0.25)]',
    propertyBadge: (isLight: boolean) =>
      isLight
        ? 'bg-white/95 text-[#0B1325] border border-[#0B1325]/15 shadow-sm'
        : 'bg-black/60 backdrop-blur-md border border-white/20 text-[#7DD3FC]',
    propertyBadgeSecondary: (isLight: boolean) =>
      isLight
        ? 'bg-white/95 text-[#6B6661] border border-[#0B1325]/15 shadow-sm'
        : 'bg-black/60 backdrop-blur-md border border-white/20 text-white/80',
    propertyViewBtn: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 shadow-md'
        : 'bg-white/10 group-hover:bg-white text-white group-hover:text-black border border-white/25 group-hover:border-white',
    deliverablesSection: (isLight: boolean) =>
      isLight
        ? 'bg-[#FBF9F6] border-t border-[#0B1325]/10 shadow-[0_-30px_70px_rgba(11,19,37,0.08)]'
        : 'bg-[#040810] border-t border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)]',
    deliverableCard: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15 shadow-md hover:border-[#0B1325]/40 text-[#0B1325]'
        : 'bg-gradient-to-b from-[#091122]/90 to-[#040812]/95 border border-white/10 hover:border-sky-400/40 text-white shadow-lg',
    deliverablePillarLabel: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-neutral-500 group-hover:text-sky-300',
    deliverableDetail: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-neutral-400',
    enquireButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/25 shadow-md'
        : 'bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-black shadow-sky-500/25',
    nextButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/20 shadow-sm'
        : 'border-white/20 hover:border-white text-white hover:text-sky-200 hover:bg-white/5',
  },

  // Contact Page Tokens (/contact)
  contact: {
    pageBg: (isLight: boolean) =>
      isLight ? 'bg-[#FBF9F6] text-[#0B1325]' : 'bg-[#040810] text-[#F8FAFC]',
    monogramBadge: (isLight: boolean) =>
      isLight
        ? 'border border-[#0B1325]/15 bg-white shadow-sm'
        : 'border border-sky-400/30 bg-sky-400/[0.06] shadow-[0_0_25px_rgba(56,189,248,0.15)]',
    monogramColor: (isLight: boolean) =>
      isLight ? '#0B1325' : '#7DD3FC',
    tagLine: (isLight: boolean) =>
      isLight ? 'bg-[#0B1325]/30' : 'bg-sky-400/60',
    tag: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#7DD3FC]',
    heading: (isLight: boolean) =>
      isLight ? 'text-[#0B1325]' : 'text-white',
    subheading: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    formCard: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15 shadow-xl text-[#0B1325]'
        : 'border border-white/10 bg-[#070E1C]/85 shadow-[0_25px_60px_rgba(0,0,0,0.6)]',
    label: (isLight: boolean) =>
      isLight ? 'text-[#6B6661]' : 'text-[#94A3B8]',
    input: (isLight: boolean) =>
      isLight
        ? 'bg-[#FDFCFB] border border-[#0B1325]/15 text-[#0B1325] placeholder-[#6B6661]/60 focus:border-[#0B1325]'
        : 'bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-sky-400',
    dropdownMenu: (isLight: boolean) =>
      isLight
        ? 'bg-white border border-[#0B1325]/15 shadow-2xl text-[#0B1325]'
        : 'bg-[#0B1528] border border-white/15 text-white shadow-2xl',
    dropdownItem: (isLight: boolean) =>
      isLight
        ? 'text-[#0B1325] hover:bg-[#F5F2EC]'
        : 'text-white/80 hover:bg-sky-400/10 hover:text-white',
    submitButton: (isLight: boolean) =>
      isLight
        ? 'bg-white hover:bg-[#FDFCFB] text-[#0B1325] border border-[#0B1325]/25 shadow-md'
        : 'bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-[#040810] shadow-[0_0_25px_rgba(56,189,248,0.3)]',
  },
}
