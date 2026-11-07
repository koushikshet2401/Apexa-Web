import puppeteer from 'puppeteer-core'

async function testPuppeteerLogin() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))

  console.log('Navigating to login...')
  await page.goto('http://localhost:3001/admin/login', { waitUntil: 'domcontentloaded' })

  await page.waitForSelector('#email')
  await page.type('#email', 'superadmin@apexpacificholdings.com')
  await page.type('#password', 'TestPassword123!')

  console.log('Clicking submit...')
  await page.click('button[type="submit"]')

  await new Promise((r) => setTimeout(r, 3000))

  console.log('Current URL:', page.url())
  const cookies = await page.cookies()
  console.log('Cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) })))

  const pageText = await page.evaluate(() => document.body.innerText)
  console.log('Page text snippet:', pageText.substring(0, 300))

  await browser.close()
}

testPuppeteerLogin().catch(console.error)
