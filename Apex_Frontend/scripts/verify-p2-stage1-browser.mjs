import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3005'
const SHOT_DIR =
  'C:\\Users\\ACER\\.gemini\\antigravity\\brain\\cf71a7dc-772d-448b-9555-5ea15a93c512\\scratch'

function assert(cond, msg) {
  if (!cond) throw new Error(`BROWSER ASSERTION FAILED: ${msg}`)
}

async function main() {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  try {
    const page = await browser.newPage()
    const consoleErrors = []
    const pageErrors = []
    const badResponses = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })
    page.on('response', (res) => {
      if (res.status() >= 500) {
        badResponses.push(`${res.status()} ${res.url()}`)
      }
    })

    // 1. Desktop 1440x900 dark mode check
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 45000 })
    await new Promise((r) => setTimeout(r, 1500))

    await page.screenshot({ path: path.join(SHOT_DIR, 'stage1-home-top.png') })

    const domSummary = await page.evaluate(() => {
      const text = document.body.innerText
      const imgs = Array.from(document.querySelectorAll('img')).map((img) => ({
        src: img.getAttribute('src') || '',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        alt: img.alt || '',
      }))
      const videos = Array.from(document.querySelectorAll('video')).map((v) => ({
        src: v.getAttribute('src') || v.querySelector('source')?.getAttribute('src') || '',
        poster: v.getAttribute('poster') || '',
      }))
      return {
        hasUnveil: text.includes('NEW LAUNCHES'),
        hasCollection: text.includes('The collection') && text.includes('SIGNATURE RESIDENCES'),
        hasOneTeam:
          text.includes('WHAT WE DO') &&
          text.includes('One team') &&
          text.includes('Development, design and advice from a single studio'),
        hasSpaces: text.includes('Spaces in the round'),
        hasAdvisory:
          text.includes('PRIVATE ADVISORY') &&
          text.includes('Begin your conversation') &&
          text.includes('SPEAK WITH US'),
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
        scrollHeight: document.body.scrollHeight,
        imgCount: imgs.length,
        brokenImgs: imgs.filter((i) => !i.complete || i.naturalWidth === 0),
        oneTeamR2Imgs: imgs.filter((i) => i.src.includes('r2.dev')).length,
        videoCount: videos.length,
        r2Videos: videos.filter((v) => v.src.includes('r2.dev')).length,
      }
    })

    assert(domSummary.hasUnveil, 'Missing Layer 1 NEW LAUNCHES heading copy')
    assert(domSummary.hasCollection, 'Missing Layer 7 Collection heading copy')
    assert(domSummary.hasOneTeam, 'Missing Layer 6 One Team DB-driven copy')
    assert(domSummary.hasSpaces, 'Missing Layer 8 Spaces in the round copy')
    assert(domSummary.hasAdvisory, 'Missing Layer 9 Private Advisory copy')
    assert(!domSummary.overflowX, 'Horizontal overflow detected on desktop 1440px')
    assert(domSummary.brokenImgs.length === 0, `Broken images found: ${JSON.stringify(domSummary.brokenImgs)}`)
    assert(domSummary.oneTeamR2Imgs >= 4, `Expected >= 4 R2 images, got ${domSummary.oneTeamR2Imgs}`)
    assert(domSummary.r2Videos >= 3, `Expected >= 3 R2 videos, got ${domSummary.r2Videos}`)

    // Scroll deep to One Team stage & verify theme toggle works cleanly
    const targetY = Math.round(domSummary.scrollHeight * 0.62)
    await page.evaluate((y) => window.scrollTo(0, y), targetY)
    await new Promise((r) => setTimeout(r, 1200))
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage1-home-scroll.png') })

    // Test Light mode toggle button in navbar if present
    const themeButton = await page.$('button[aria-label*="theme" i], button[aria-label*="mode" i], button[title*="mode" i]')
    let toggledLight = false
    if (themeButton) {
      await themeButton.click()
      await new Promise((r) => setTimeout(r, 600))
      toggledLight = await page.evaluate(() => document.documentElement.classList.contains('light') || !document.documentElement.classList.contains('dark'))
      await page.screenshot({ path: path.join(SHOT_DIR, 'stage1-home-light.png') })
    }

    // 2. Mobile 390x844 check
    await page.setViewport({ width: 390, height: 844 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await new Promise((r) => setTimeout(r, 800))
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    assert(!mobileOverflow, 'Horizontal overflow detected on mobile 390px')
    await page.screenshot({ path: path.join(SHOT_DIR, 'stage1-home-mobile.png') })

    assert(consoleErrors.length === 0, `Console errors: ${JSON.stringify(consoleErrors)}`)
    assert(pageErrors.length === 0, `Uncaught page errors: ${JSON.stringify(pageErrors)}`)
    assert(badResponses.length === 0, `HTTP 5xx responses: ${JSON.stringify(badResponses)}`)

    console.log(
      JSON.stringify(
        {
          ok: true,
          domSummary,
          toggledLight,
          mobileOverflow,
          consoleErrorsCount: consoleErrors.length,
          pageErrorsCount: pageErrors.length,
          badResponsesCount: badResponses.length,
        },
        null,
        2
      )
    )
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
