import fs from 'fs'
import path from 'path'
import { PERMISSIONS } from '../../src/lib/rbac'

const adminDir = path.join(process.cwd(), 'src/app/api/admin')

function getFiles(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat && stat.isDirectory()) results = results.concat(getFiles(full))
    else if (file === 'route.ts') results.push(full)
  }
  return results
}

const files = getFiles(adminDir)
console.log(`TOTAL ROUTE FILES: ${files.length}`)

let handlerCount = 0
const definedPermissions = new Set(Object.values(PERMISSIONS))
let errors = 0

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8')
  const lines = content.split('\n')
  const rel = path.relative(process.cwd(), f).replace(/\\/g, '/')

  lines.forEach((line, idx) => {
    const match = line.match(/^export async function ([A-Z]+)/)
    if (match) {
      handlerCount++
      const method = match[1]
      const lineNum = idx + 1
      const slice = lines.slice(idx, idx + 15).join('\n')
      const mReqPerm = slice.match(/requirePermission\s*\([^,]+,\s*([^)]+)\)/)
      const mReqAdmin = slice.match(/requireAdmin\s*\([^)]*\)/)

      let guard = 'PUBLIC / NO GUARD'
      if (mReqPerm) {
        const permArg = mReqPerm[1].trim()
        guard = `requirePermission(${permArg})`
        
        // Verify permArg resolves to a known permission in PERMISSIONS
        const cleanKey = permArg.replace(/^PERMISSIONS\./, '')
        const permValue = (PERMISSIONS as any)[cleanKey]
        if (!permValue || !definedPermissions.has(permValue)) {
          console.error(`❌ REGRESSION: Undefined permission [${permArg}] in ${rel}:${lineNum}`)
          errors++
        }
      } else if (mReqAdmin) {
        guard = 'requireAdmin()'
      } else {
        if (!rel.includes('login') && !rel.includes('logout')) {
          console.error(`❌ REGRESSION: Protected route without guard: ${rel}:${lineNum}`)
          errors++
        }
      }

      console.log(`[${handlerCount}] ${method} ${rel}:${lineNum} -> ${guard}`)
    }
  })
}

console.log(`\nTOTAL EXPORTED HANDLERS: ${handlerCount}`)
console.log(`TOTAL VALIDATION ERRORS: ${errors}`)

if (handlerCount !== 37 || errors > 0) {
  process.exit(1)
} else {
  console.log('✅ ALL 37 HANDLERS STRICTLY VERIFIED AND ACCREDITED.')
}
