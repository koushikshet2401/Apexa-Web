import fs from 'fs'
import path from 'path'

const SECTIONS_DIR = 'src/components/sections'
const SRC_DIR = 'src'

function getFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = []
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

const sectionFiles = fs.readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
const allSrcFiles = getFiles(SRC_DIR)

console.log('=== SECTIONS AUDIT ===')
for (const sf of sectionFiles) {
  const baseName = path.basename(sf, path.extname(sf))
  const selfPath = path.join(SECTIONS_DIR, sf)
  const matchingFiles = []

  for (const f of allSrcFiles) {
    if (f === selfPath) continue
    const content = fs.readFileSync(f, 'utf-8')
    if (
      content.includes(`/${baseName}`) ||
      content.includes(`'${baseName}'`) ||
      content.includes(`"${baseName}"`) ||
      content.includes(baseName)
    ) {
      matchingFiles.push(f)
    }
  }

  console.log(`\n[${sf}]`)
  if (matchingFiles.length === 0) {
    console.log('  -> UNUSED: 0 references across entire src/')
  } else {
    console.log(`  -> REFERENCED in ${matchingFiles.length} file(s):`)
    for (const m of matchingFiles) {
      console.log(`     * ${m}`)
    }
  }
}
