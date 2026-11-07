import puppeteer from 'puppeteer-core'

async function main() {
  console.log('[BROWSER] Launching Chrome executable...')
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  console.log('[BROWSER] Opening new page...')
  const page = await browser.newPage()
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 15000 })

  const title = await page.title()
  console.log('[BROWSER OK] Title of http://localhost:3001:', title)

  await browser.close()
  console.log('[BROWSER OK] Browser closed cleanly.')
}

main().catch((err) => {
  console.error('Browser launch failed:', err)
  process.exit(1)
})
