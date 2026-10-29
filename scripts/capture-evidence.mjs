import { chromium } from 'playwright'
import { mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const mode = process.argv[2] || 'depois'
const outputDir = resolve(process.cwd(), 'screenshots', 'evidence')
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function dismissCookies(page) {
  try {
    const btn = await page.$('button:has-text("Aceitar todos")')
    if (btn) {
      await btn.click()
      await page.waitForTimeout(400)
    }
  } catch {}
}

async function run() {
  console.log(`[Evidence] Iniciando captura de tela no modo: ${mode} em ${BASE_URL}...`)
  const browser = await chromium.launch({ headless: true })

  // 1. Desktop Viewport (1280 x 800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  })
  const desktopPage = await desktopContext.newPage()

  // 1.1 Home Desktop
  console.log('Capturando Home Desktop...')
  await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await dismissCookies(desktopPage)
  await desktopPage.waitForTimeout(600)
  await desktopPage.screenshot({
    path: resolve(outputDir, `${mode}_01_home_desktop.png`),
    fullPage: false,
  })

  // 1.2 Catálogo Desktop
  console.log('Capturando Catálogo Desktop...')
  await desktopPage.goto(`${BASE_URL}/imoveis`, { waitUntil: 'networkidle' })
  await dismissCookies(desktopPage)
  await desktopPage.waitForTimeout(600)
  await desktopPage.screenshot({
    path: resolve(outputDir, `${mode}_02_catalogo_desktop.png`),
    fullPage: false,
  })

  // 1.3 Detalhe do Imóvel Desktop
  console.log('Capturando Detalhe do Imóvel Desktop...')
  // Pega o primeiro imóvel da listagem
  const firstListing = await desktopPage.$('a[href^="/imoveis/"]')
  let listingUrl = `${BASE_URL}/imoveis`
  if (firstListing) {
    const href = await firstListing.getAttribute('href')
    if (href) listingUrl = `${BASE_URL}${href}`
  }
  await desktopPage.goto(listingUrl, { waitUntil: 'networkidle' })
  await dismissCookies(desktopPage)
  await desktopPage.waitForTimeout(600)
  await desktopPage.screenshot({
    path: resolve(outputDir, `${mode}_03_imovel_desktop.png`),
    fullPage: false,
  })

  await desktopContext.close()

  // 2. Mobile Viewport (iPhone 14 / Pixel: 390 x 844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const mobilePage = await mobileContext.newPage()

  // 2.1 Home Mobile
  console.log('Capturando Home Mobile...')
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await dismissCookies(mobilePage)
  await mobilePage.waitForTimeout(600)
  await mobilePage.screenshot({
    path: resolve(outputDir, `${mode}_04_home_mobile.png`),
    fullPage: false,
  })

  // 2.2 Catálogo Mobile
  console.log('Capturando Catálogo Mobile...')
  await mobilePage.goto(`${BASE_URL}/imoveis`, { waitUntil: 'networkidle' })
  await dismissCookies(mobilePage)
  await mobilePage.waitForTimeout(600)
  await mobilePage.screenshot({
    path: resolve(outputDir, `${mode}_05_catalogo_mobile.png`),
    fullPage: false,
  })

  // 2.3 Detalhe do Imóvel Mobile (Com Sticky Bar)
  console.log('Capturando Detalhe do Imóvel Mobile...')
  await mobilePage.goto(listingUrl, { waitUntil: 'networkidle' })
  await dismissCookies(mobilePage)
  await mobilePage.waitForTimeout(600)
  await mobilePage.screenshot({
    path: resolve(outputDir, `${mode}_06_imovel_mobile.png`),
    fullPage: false,
  })

  await mobileContext.close()
  await browser.close()
  console.log(`[Evidence] Capturas finalizadas com sucesso para o modo: ${mode}`)
}

run().catch((err) => {
  console.error('[Evidence] Erro na captura:', err)
  process.exit(1)
})
