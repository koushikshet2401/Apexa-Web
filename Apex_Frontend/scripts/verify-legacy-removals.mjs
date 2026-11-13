import fs from 'fs'
import path from 'path'

const CANDIDATES = [
  'src/components/sections/AboutSection.tsx',
  'src/components/sections/CinematicPropertyShowcase.tsx',
  'src/components/sections/EditorialQuoteSection.tsx',
  'src/components/sections/HeroSection.tsx',
  'src/components/sections/ImmersiveCommunitiesSection.tsx',
  'src/components/sections/LoadingScreen.tsx',
  'src/components/sections/LogoMaskTransition.tsx',
  'src/components/sections/NewLaunchesIntroSection.tsx',
  'src/components/sections/OneTeamSection.tsx',
  'src/components/sections/PerspectiveGallerySection.tsx',
  'src/components/sections/SpeakWithUsSection.tsx',
  'src/components/sections/TheCollectionSection.tsx',
  'src/components/sections/CollectionSection.tsx',
  'src/components/sections/FeaturedVideoStackingSection.tsx',
  'src/components/pages/PropertiesClient.tsx',
  'src/data/destinations.ts',
  'src/data/services.ts',
]

function getFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, exts))
    } else if (exts.includes(path.extname(fullPath))) {
      results.push(fullPath)
    }
  }
  return results
}

const allFiles = getFiles('src')
const candidateSet = new Set(CANDIDATES.map((c) => path.normalize(c)))
const externalFiles = allFiles.filter((f) => !candidateSet.has(path.normalize(f)))

console.log('=== EXACT IMPORT AUDIT ===')

for (const candidate of CANDIDATES) {
  const baseName = path.basename(candidate, path.extname(candidate))
  const importRegexes = [
    new RegExp(`from\\s+['"][^'"]*\\/${baseName}['"]`),
    new RegExp(`import\\(['"][^'"]*\\/${baseName}['"]\\)`),
    new RegExp(`require\\(['"][^'"]*\\/${baseName}['"]\\)`),
  ]

  const matches = []
  for (const ext of externalFiles) {
    const code = fs.readFileSync(ext, 'utf-8')
    for (const rx of importRegexes) {
      if (rx.test(code)) {
        matches.push(ext)
        break
      }
    }
  }

  if (matches.length > 0) {
    console.log(`❌ ACTIVE IMPORT FOUND for ${candidate}:`)
    for (const m of matches) console.log(`   * ${m}`)
  } else {
    console.log(`✓ 0 active imports: ${candidate}`)
  }
}
