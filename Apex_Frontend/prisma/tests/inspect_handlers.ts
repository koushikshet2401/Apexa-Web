import fs from 'fs'
import path from 'path'

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
const handlers: any[] = []

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8')
  const lines = content.split('\n')
  const rel = path.relative(process.cwd(), f).replace(/\\/g, '/')
  
  lines.forEach((line, idx) => {
    const match = line.match(/^export async function (GET|POST|PUT|PATCH|DELETE)/)
    if (match) {
      const method = match[1]
      const lineNum = idx + 1
      // inspect next 10 lines for guard
      const block = lines.slice(idx, idx + 15).join('\n')
      let authGuard = 'None'
      let permGuard = 'None'
      let reqPerm = 'None'

      if (block.includes('requirePermission')) {
        authGuard = 'requirePermission'
        permGuard = 'hasPermission (internal)'
        const pMatch = block.match(/requirePermission\(\s*request\s*,\s*PERMISSIONS\.([A-Z_]+)\)/)
        reqPerm = pMatch ? `PERMISSIONS.${pMatch[1]}` : 'Unknown'
      } else if (block.includes('requireAdmin')) {
        authGuard = 'requireAdmin'
        permGuard = 'verifyLiveAdminSession'
        reqPerm = 'Active Session'
      } else if (rel.includes('auth/login')) {
        authGuard = 'Public (Rate Limited)'
        permGuard = 'None'
        reqPerm = 'None'
      } else if (rel.includes('auth/logout')) {
        authGuard = 'Optional / Server Revocation'
        permGuard = 'None'
        reqPerm = 'None'
      }

      handlers.push({
        file: rel,
        line: lineNum,
        method,
        authGuard,
        permGuard,
        reqPerm
      })
    }
  })
}

console.log(JSON.stringify(handlers, null, 2))
