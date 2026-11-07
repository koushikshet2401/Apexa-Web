import puppeteer from 'puppeteer-core'

const BASE_URL = 'http://localhost:3001'

async function debugAllRoles() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  let ip = 300

  async function login(email: string, pass: string, expectSuccess = true) {
    const client = await page.target().createCDPSession()
    await client.send('Network.clearBrowserCookies')

    const clientIp = `127.0.0.${++ip}`
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': clientIp })
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.$eval('#email', (el) => ((el as HTMLInputElement).value = ''))
    await page.type('#email', email)
    await page.$eval('#password', (el) => ((el as HTMLInputElement).value = ''))
    await page.type('#password', pass)

    if (expectSuccess) {
      await page.click('button[type="submit"]')
      await page.waitForSelector('aside, nav', { timeout: 15000 })
      await new Promise((r) => setTimeout(r, 1000))
      console.log(`[LOGIN SUCCESS] ${email} -> URL: ${page.url()}`)
    } else {
      await page.click('button[type="submit"]')
      await page.waitForSelector('.text-rose-300, .text-rose-400, [role="alert"]', { timeout: 10000 })
      const alert = await page.evaluate(() => document.querySelector('.text-rose-300, .text-rose-400')?.textContent || '')
      console.log(`[LOGIN REJECTED] ${email} -> Alert: "${alert}"`)
    }
  }

  // 1. Super Admin
  await login('superadmin@apexpacificholdings.com', 'TestPassword123!')
  const superRes = await page.evaluate(async () => {
    const resUsers = await fetch('/api/admin/users', { credentials: 'include' })
    const resProps = await fetch('/api/admin/properties', { credentials: 'include' })
    return { users: resUsers.status, props: resProps.status }
  })
  console.log('Super Admin access:', superRes)

  // 2. Manager
  await login('manager@apexpacificholdings.com', 'TestPassword123!')
  const mgrRes = await page.evaluate(async () => {
    const resUsers = await fetch('/api/admin/users', { credentials: 'include' })
    const resProps = await fetch('/api/admin/properties', { credentials: 'include' })
    return { users: resUsers.status, props: resProps.status }
  })
  console.log('Manager access:', mgrRes)

  // 3. Editor
  await login('editor@apexpacificholdings.com', 'TestPassword123!')
  const edRes = await page.evaluate(async () => {
    const resUsers = await fetch('/api/admin/users', { credentials: 'include' })
    const resProps = await fetch('/api/admin/properties', { credentials: 'include' })
    const reprice = await fetch('/api/admin/projects/reprice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ propertyId: 'dummy', pricingState: 'PRICED', priceAmount: '1000', priceCurrency: 'AED', reason: 'test' }),
    })
    return { users: resUsers.status, props: resProps.status, reprice: reprice.status }
  })
  console.log('Editor access:', edRes)

  // 4. Advisor
  await login('advisor@apexpacificholdings.com', 'TestPassword123!')
  const advRes = await page.evaluate(async () => {
    const resEnquiries = await fetch('/api/admin/enquiries', { credentials: 'include' })
    const resDeleteProp = await fetch('/api/admin/properties/prop-meridian', { method: 'DELETE', credentials: 'include' })
    return { enquiries: resEnquiries.status, deleteProp: resDeleteProp.status }
  })
  console.log('Advisor access:', advRes)

  // 5. Compliance
  await login('compliance@apexpacificholdings.com', 'TestPassword123!')
  const compRes = await page.evaluate(async () => {
    const resAnalytics = await fetch('/api/admin/analytics/dashboard', { credentials: 'include' })
    const resCreateProp = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: 'Compliance Test Property', countryId: 'country-uae' }),
    })
    return { analytics: resAnalytics.status, createProp: resCreateProp.status }
  })
  console.log('Compliance access:', compRes)

  // 6. Inactive
  await login('inactive@apexpacificholdings.com', 'TestPassword123!', false)

  await browser.close()
}

debugAllRoles().catch(console.error)
