import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('configuracoes page imports and renders calendar settings tab', () => {
  const pagePath = path.resolve(
    process.cwd(),
    'src/app/(dashboard)/dashboard/configuracoes/page.tsx',
  )
  const content = fs.readFileSync(pagePath, 'utf8')
  assert.match(content, /agenda/i)
  assert.match(content, /CalendarSettingsTab/i)
})
