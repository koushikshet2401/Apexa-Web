import puppeteer from 'puppeteer-core'

async function check1440Overflow() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 1500))

  const info = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth
    const innerWidth = window.innerWidth
    
    // Find elements wider than window.innerWidth
    const all = Array.from(document.querySelectorAll('*'))
    const wide = all
      .map(el => {
        const rect = el.getBoundingClientRect()
        return { tag: el.tagName, class: (el as HTMLElement).className, right: rect.right, width: rect.width }
      })
      .filter(x => x.right > innerWidth)
      .slice(0, 5)

    return { scrollWidth, innerWidth, wide }
  })

  console.log('1440 check:', info)

  await browser.close()
}

check1440Overflow().catch(console.error)
