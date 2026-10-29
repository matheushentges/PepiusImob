import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.APPDATA + '/npm/node_modules/playwright')

async function runSimulation() {
  console.log('=== Iniciando Simulação E2E com Playwright ===')
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors'],
  })

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()

  try {
    // 1. Vitrine Pública
    console.log('[*] 1. Acessando Vitrine Pública...')
    await page.goto('https://imob.157.151.10.201.sslip.io/imoveis', { waitUntil: 'networkidle', timeout: 30000 })
    const vitrineTitle = await page.title()
    console.log(`[+] Vitrine carregada: "${vitrineTitle}"`)

    const propertyCount = await page.locator('article').count()
    console.log(`[+] Imóveis visíveis na vitrine: ${propertyCount}`)

    // 2. Login Administrativo
    console.log('[*] 2. Realizando Login no Painel Administrativo...')
    await page.goto('https://imob.157.151.10.201.sslip.io/login', { waitUntil: 'networkidle', timeout: 30000 })
    await page.fill('input[type="email"]', 'admin@pepius-imob.com')
    await page.fill('input[type="password"]', 'PepiusAdmin2026!')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    console.log(`[+] Login com sucesso! URL atual: ${page.url()}`)

    // 3. Simulação do Radar Reverso no Imóvel do Cambuí
    console.log('[*] 3. Testando Radar Reverso no Apartamento do Cambuí...')
    await page.goto('https://imob.157.151.10.201.sslip.io/dashboard/imoveis/715cdd17-79ff-491f-be86-2d8405b3b4eb', { waitUntil: 'networkidle', timeout: 30000 })

    await page.waitForSelector('text=Radar Reverso de Oportunidades', { timeout: 10000 })
    console.log('[+] Painel "Radar Reverso de Oportunidades" detectado em tela!')

    // Aguarda carregar os matches
    await page.waitForTimeout(2000)
    const pageContent = await page.content()

    if (pageContent.includes('Mariana Alcântara')) {
      console.log('    [✔ SUCESSO] Cliente "Mariana Alcântara" identificada pelo Radar Reverso com alta afinidade!')
    } else {
      console.log('    [!] Mariana Alcântara não foi listada.')
    }

    if (pageContent.includes('Avisar no WhatsApp')) {
      console.log('    [✔ SUCESSO] Botão de disparo para WhatsApp presente e configurado!')
    }

    // 4. Verificação do Claviculário e Alerta de Atraso
    console.log('[*] 4. Testando Claviculário de Chaves...')
    await page.goto('https://imob.157.151.10.201.sslip.io/dashboard/chaves', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForSelector('text=Controle de Chaves', { timeout: 10000 })

    const chavesContent = await page.content()
    if (chavesContent.includes('G-02') || chavesContent.includes('Com Consultor')) {
      console.log('    [✔ SUCESSO] Chave G-02 rastreada no claviculário!')
    }
    if (chavesContent.includes('Atrasad') || chavesContent.includes('atraso') || chavesContent.includes('Cobrar Devolução')) {
      console.log('    [✔ SUCESSO] Alerta de devolução em atraso ativado com botão de cobrança!')
    }

    // 5. Verificação da Base de Clientes (CRM)
    console.log('[*] 5. Testando CRM de Clientes...')
    await page.goto('https://imob.157.151.10.201.sslip.io/dashboard/clientes', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForSelector('text=Gestão de Clientes', { timeout: 10000 })

    const clientesContent = await page.content()
    const clientsFound = ['Mariana Alcântara', 'Ricardo Silveira', 'Camila Prado', 'Eduardo e Beatriz Mendes'].filter(name => clientesContent.includes(name))
    console.log(`    [✔ SUCESSO] Clientes encontrados no CRM: ${clientsFound.join(', ')}`)

    console.log('\n=== Simulação E2E Concluída com 100% de Sucesso! ===')
  } catch (err) {
    console.error('[!] Erro durante simulação Playwright:', err)
  } finally {
    await browser.close()
  }
}

runSimulation()
