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
    const match = line.match(/^export async function ([A-Z]+)/)
    if (match) {
      const method = match[1]
      const lineNum = idx + 1
      handlers.push({
        file: rel,
        line: lineNum,
        method
      })
    }
  })
}

console.log('TOTAL EXPORTED HANDLERS FOUND:', handlers.length)
console.table(handlers)
