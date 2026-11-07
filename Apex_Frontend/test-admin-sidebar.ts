import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:3001'
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-evidence', 'screenshots')

async function runVerification() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }

  console.log('--- STARTING ADMIN SIDEBAR & AUTH COMPLIANCE VERIFICATION ---')
  const results: { test: string; status: 'PASSED' | 'FAILED'; details?: string }[] = []

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    // Step 1: Login
    console.log('[1/7] Logging into Admin Portal...')
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2' })
    await page.type('input[type="email"]', 'admin@apexpacificholdings.com')
    await page.type('input[type="password"]', 'Admin@Apex2025!')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]'),
    ])

    const currentUrl = page.url()
    if (!currentUrl.includes('/admin')) {
      throw new Error(`Login failed. Redirected to: ${currentUrl}`)
    }
    results.push({ test: 'Admin Authentication', status: 'PASSED', details: 'Successfully logged in as admin@apexpacificholdings.com' })

    // Step 2: Dashboard and Unauthorized Error Check
    console.log('[2/7] Verifying Dashboard & Absence of "Unauthorized" Error...')
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1500))

    const bodyText = await page.evaluate(() => document.body.innerText)
    if (bodyText.includes('Failed to load dashboard: Unauthorized')) {
      results.push({ test: 'Dashboard Authorization Guard', status: 'FAILED', details: 'Unauthorized banner is present on screen!' })
    } else {
      results.push({ test: 'Dashboard Authorization Guard', status: 'PASSED', details: 'Dashboard loaded with zero unauthorized errors.' })
    }

    const hasDashboardTitle = bodyText.includes('Portfolio & Business Intelligence')
    if (hasDashboardTitle) {
      results.push({ test: 'Dashboard Live Metrics Render', status: 'PASSED', details: 'Executive metrics header and valuations rendered.' })
    } else {
      results.push({ test: 'Dashboard Live Metrics Render', status: 'FAILED', details: 'Title "Portfolio & Business Intelligence" not found.' })
    }

    const dashScreenshotPath = path.join(SCREENSHOT_DIR, '09_corrected_admin_dashboard.png')
    await page.screenshot({ path: dashScreenshotPath, fullPage: false })
    console.log(`Saved screenshot: ${dashScreenshotPath}`)

    // Step 3: Sidebar Navigation Links & Groups Check
    console.log('[3/7] Verifying Sidebar Structure & Groups...')
    const sidebarChecks = [
      { name: 'Brand Emblem & Header', selector: 'aside .font-display' },
      { name: 'Admin Profile Card', selector: 'aside button[title*="Administrator Profile"]' },
      { name: 'Overview Header', text: 'OVERVIEW' },
      { name: 'Dashboard Nav Link', href: '/admin' },
      { name: 'Portfolio Header', text: 'PROPERTY PORTFOLIO' },
      { name: 'Current Projects Nav Link', href: '/admin/properties' },
      { name: 'Add New Project Nav Link', href: '/admin/properties/new' },
      { name: 'Sold Projects Nav Link', href: '/admin/properties?tab=sold' },
      { name: 'Archived / Deleted Projects Nav Link', href: '/admin/properties?tab=archived' },
      { name: 'Curation & Content Header', text: 'CURATION & CONTENT' },
      { name: 'Countries Nav Link', href: '/admin/countries' },
      { name: 'Services Nav Link', href: '/admin/services' },
      { name: 'Latest Launches Nav Link', href: '/admin/launches' },
      { name: 'Spaces in the Round Nav Link', href: '/admin/space-in-round' },
      { name: 'Homepage / CMS Nav Link', href: '/admin/homepage' },
      { name: 'Communications Header', text: 'COMMUNICATIONS' },
      { name: 'Enquiries Nav Link', href: '/admin/enquiries' },
      { name: 'System & Assets Header', text: 'SYSTEM & ASSETS' },
      { name: 'Media Management Nav Link', href: '/admin/media' },
      { name: 'Team & Roles Nav Link', href: '/admin/users' },
      { name: 'Live Website Link', href: '/' },
      { name: 'Sign Out Button', text: 'Sign Out' },
    ]

    for (const check of sidebarChecks) {
      let found = false
      if (check.selector) {
        found = (await page.$(check.selector)) !== null
      } else if (check.href) {
        found = (await page.$(`aside a[href="${check.href}"]`)) !== null
      } else if (check.text) {
        found = bodyText.toUpperCase().includes(check.text.toUpperCase())
      }
      results.push({
        test: `Sidebar Element: ${check.name}`,
        status: found ? 'PASSED' : 'FAILED',
        details: found ? 'Present in sidebar' : 'Missing element in DOM',
      })
    }

    // Step 4: Verify Every Navigation Link Works and Returns 200
    console.log('[4/7] Testing Navigation Routes & Active Page Highlighting...')
    const routesToTest = [
      { name: 'Dashboard', url: '/admin', expectedText: 'Portfolio & Business Intelligence' },
      { name: 'Current Projects', url: '/admin/properties', expectedText: 'Projects Management' },
      { name: 'Add New Project', url: '/admin/properties/new', expectedText: 'New Project Listing' },
      { name: 'Sold Projects', url: '/admin/properties?tab=sold', expectedText: 'Sold Projects' },
      { name: 'Archived Projects', url: '/admin/properties?tab=archived', expectedText: 'Deleted / Archived' },
      { name: 'Countries', url: '/admin/countries', expectedText: 'Countries & Destinations' },
      { name: 'Services', url: '/admin/services', expectedText: 'Services & Sectors' },
      { name: 'Latest Launches', url: '/admin/launches', expectedText: 'Latest Launches' },
      { name: 'Spaces in the Round', url: '/admin/space-in-round', expectedText: 'Spaces in the Round' },
      { name: 'Homepage / CMS', url: '/admin/homepage', expectedText: 'Homepage Content & Media' },
      { name: 'Enquiries', url: '/admin/enquiries', expectedText: 'Enquiries' },
      { name: 'Media Management', url: '/admin/media', expectedText: 'Media Library' },
      { name: 'Team & Roles', url: '/admin/users', expectedText: 'Team & Role-Based Access' },
    ]

    for (const route of routesToTest) {
      const response = await page.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle2' })
      const status = response?.status()
      const content = await page.evaluate(() => document.body.innerText)
      const hasText = content.includes(route.expectedText)
      const passed = status === 200 && hasText

      results.push({
        test: `Route Navigation [${route.name}] (${route.url})`,
        status: passed ? 'PASSED' : 'FAILED',
        details: `HTTP ${status}, Found text "${route.expectedText}": ${hasText}`,
      })
    }

    // Capture Properties List with Sold Tab Selected
    await page.goto(`${BASE_URL}/admin/properties?tab=sold`, { waitUntil: 'networkidle2' })
    const soldScreenshotPath = path.join(SCREENSHOT_DIR, '09_properties_sold_tab.png')
    await page.screenshot({ path: soldScreenshotPath, fullPage: false })
    console.log(`Saved screenshot: ${soldScreenshotPath}`)

    // Step 5: Test Expandable Property Portfolio Group
    console.log('[5/7] Testing Expandable Navigation Groups...')
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' })
    const toggleBtn = await page.$('aside button[aria-label="Toggle Portfolio Submenu"]')
    if (toggleBtn) {
      // Toggle collapse
      await toggleBtn.click()
      await new Promise((r) => setTimeout(r, 200))
      let hasCurrentProjects = (await page.$('aside a[href="/admin/properties"]')) !== null

      // Toggle expand
      await toggleBtn.click()
      await new Promise((r) => setTimeout(r, 200))
      let hasCurrentProjectsAfter = (await page.$('aside a[href="/admin/properties"]')) !== null

      const expandablePassed = !hasCurrentProjects && hasCurrentProjectsAfter
      results.push({
        test: 'Sidebar Expandable Group Toggle',
        status: expandablePassed ? 'PASSED' : 'FAILED',
        details: `Collapsed: ${!hasCurrentProjects}, Re-expanded: ${hasCurrentProjectsAfter}`,
      })
    } else {
      results.push({
        test: 'Sidebar Expandable Group Toggle',
        status: 'FAILED',
        details: 'Toggle button not found',
      })
    }

    // Step 6: Test Administrator Profile Modal
    console.log('[6/7] Testing Administrator Profile Modal...')
    const profileCardBtn = await page.$('aside button[title*="Administrator Profile"]')
    if (profileCardBtn) {
      await profileCardBtn.click()
      await new Promise((r) => setTimeout(r, 300))

      const modalText = await page.evaluate(() => document.body.innerText)
      const hasProfileTitle = modalText.includes('Administrator Profile')
      const hasEmail = modalText.includes('admin@apexpacificholdings.com')
      const hasRole = modalText.includes('SUPER_ADMIN')
      const hasSession = modalText.includes('Active & Verified')

      const modalPassed = hasProfileTitle && hasEmail && hasRole && hasSession
      results.push({
        test: 'Administrator Profile Modal',
        status: modalPassed ? 'PASSED' : 'FAILED',
        details: `Title: ${hasProfileTitle}, Email: ${hasEmail}, Role: ${hasRole}, Session: ${hasSession}`,
      })

      const profileModalScreenshot = path.join(SCREENSHOT_DIR, '09_admin_profile_modal.png')
      await page.screenshot({ path: profileModalScreenshot, fullPage: false })
      console.log(`Saved screenshot: ${profileModalScreenshot}`)

      // Close modal
      const closeBtn = await page.$('button[aria-label="Close"]')
      if (closeBtn) await closeBtn.click()
      await new Promise((r) => setTimeout(r, 200))
    }

    // Step 7: Mobile Viewport & Responsive Drawer
    console.log('[7/7] Testing Mobile Responsive Drawer (375x812)...')
    await page.setViewport({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' })

    const hamburgerBtn = await page.$('header button[aria-label="Toggle Navigation"]')
    if (hamburgerBtn) {
      await hamburgerBtn.click()
      await new Promise((r) => setTimeout(r, 400))

      const mobileDrawerScreenshot = path.join(SCREENSHOT_DIR, '09_mobile_sidebar_drawer.png')
      await page.screenshot({ path: mobileDrawerScreenshot, fullPage: false })
      console.log(`Saved screenshot: ${mobileDrawerScreenshot}`)

      const isDrawerVisible = await page.evaluate(() => {
        const aside = document.querySelector('aside')
        return aside && aside.classList.contains('translate-x-0')
      })

      results.push({
        test: 'Mobile Sidebar Drawer Responsiveness',
        status: isDrawerVisible ? 'PASSED' : 'FAILED',
        details: `Drawer visible on mobile: ${isDrawerVisible}`,
      })
    } else {
      results.push({
        test: 'Mobile Sidebar Drawer Responsiveness',
        status: 'FAILED',
        details: 'Hamburger button not found in mobile header',
      })
    }
  } finally {
    await browser.close()
  }

  console.log('\n--- VERIFICATION SUMMARY ---')
  const passed = results.filter((r) => r.status === 'PASSED').length
  const failed = results.filter((r) => r.status === 'FAILED').length
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)

  fs.writeFileSync(
    path.join(process.cwd(), 'test-evidence', 'admin_sidebar_verification_results.json'),
    JSON.stringify(results, null, 2)
  )

  if (failed > 0) {
    console.error('Failed checks detected!')
    process.exit(1)
  } else {
    console.log('ALL CHECKS PASSED!')
    process.exit(0)
  }
}

runVerification().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
