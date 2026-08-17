/* Temporary verification script: screenshot Playground tab (delete after validation) */
import { chromium } from 'playwright'

const base = process.env.SHOT_URL ?? 'http://localhost:5175/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.home-sequential-reveal', { timeout: 30000 })
await page.waitForTimeout(2500)

await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('button[role="tab"]')]
  tabs.find((b) => b.textContent?.includes('Playground'))?.click()
})
await page.waitForTimeout(1500)

await page.screenshot({ path: 'scripts/shots/pg-bento.png', fullPage: true })

// turntable: scroll inner scroller to verify rotation scrub
await page.locator('.pg-turn-stage').scrollIntoViewIfNeeded()
await page.waitForTimeout(800)
await page.locator('.pg-tile-full').screenshot({ path: 'scripts/shots/pg-turn-0.png' })
await page.evaluate(() => {
  const sc = document.querySelector('.pg-turn-stage .pg-scroller')
  sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * 0.4
})
await page.waitForTimeout(800)
await page.locator('.pg-tile-full').screenshot({ path: 'scripts/shots/pg-turn-40.png' })

await browser.close()
console.log('done')
