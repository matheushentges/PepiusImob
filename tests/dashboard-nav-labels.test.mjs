import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('dashboard navigation defines simplified direct labels', () => {
  const layoutContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/(dashboard)/layout.tsx'),
    'utf-8',
  )

  const expectedLabels = [
    { href: '/dashboard', label: 'Início' },
    { href: '/dashboard/imoveis', label: 'Imóveis' },
    { href: '/dashboard/chaves', label: 'Chaves' },
    { href: '/dashboard/leads', label: 'Leads' },
    { href: '/dashboard/clientes', label: 'Clientes' },
    { href: '/dashboard/equipe', label: 'Equipe' },
    { href: '/dashboard/configuracoes', label: 'Personalização' },
    { href: '/dashboard/licenca', label: 'Licença' },
  ]

  for (const item of expectedLabels) {
    assert.match(
      layoutContent,
      new RegExp(`href:\\s*'${item.href}',\\s*label:\\s*'${item.label}'`),
      `Expected layout.tsx to contain nav item with href ${item.href} and label "${item.label}"`,
    )
  }
})

test('dashboard shell component supports fixed collapsible sidebar with localStorage persistence', () => {
  const shellContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/dashboard/dashboard-shell.tsx'),
    'utf-8',
  )

  assert.match(shellContent, /pepius_sidebar_collapsed/, 'Expected localStorage key for sidebar collapse state')
  assert.match(shellContent, /fixed inset-y-0 left-0/, 'Expected sidebar to be fixed to the viewport')
  assert.match(shellContent, /w-20/, 'Expected collapsed width w-20')
  assert.match(shellContent, /w-64/, 'Expected expanded width w-64')
  assert.match(shellContent, /md:pl-20/, 'Expected main content padding md:pl-20 when collapsed')
  assert.match(shellContent, /md:pl-64/, 'Expected main content padding md:pl-64 when expanded')
  assert.match(shellContent, /PanelLeftClose/, 'Expected collapse toggle icons')
  assert.match(shellContent, /PanelLeftOpen/, 'Expected expand toggle icons')
})

test('dashboard nav links supports collapsed state with floating tooltips', () => {
  const navContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/dashboard/dashboard-nav-links.tsx'),
    'utf-8',
  )

  assert.match(navContent, /collapsed\s*=\s*false/, 'Expected collapsed prop with default false')
  assert.match(navContent, /role="tooltip"/, 'Expected floating tooltip for collapsed mode')
})
