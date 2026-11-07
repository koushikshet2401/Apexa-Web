import puppeteer from 'puppeteer-core'

async function checkLoginState() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  
  await page.goto('http://localhost:3001/admin/login')
  await page.waitForSelector('#email')
  await page.type('#email', 'superadmin@apexpacificholdings.com')
  await page.type('#password', 'TestPassword123!')
  await page.click('button[type="submit"]')
  
  await new Promise(r => setTimeout(r, 3000))
  console.log('After login URL:', page.url())

  // Now evaluate fetch
  const fetchRes = await page.evaluate(async () => {
    const res = await fetch('/api/admin/users', { credentials: 'include' })
    const data = await res.json().catch(() => null)
    return { status: res.status, data }
  })

  console.log('Fetch /api/admin/users result:', fetchRes)

  await browser.close()
}

checkLoginState().catch(console.error)
