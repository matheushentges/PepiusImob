import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('leads page queries visit fields and passes to AgencyLead', () => {
  const pagePath = resolve(process.cwd(), 'src/app/(dashboard)/dashboard/leads/page.tsx')
  const content = readFileSync(pagePath, 'utf-8')

  assert.ok(content.includes('visit_starts_at'), 'Query must include visit_starts_at')
  assert.ok(content.includes('visit_ends_at'), 'Query must include visit_ends_at')
  assert.ok(content.includes('google_event_id'), 'Query must include google_event_id')
  assert.ok(content.includes('google_event_link'), 'Query must include google_event_link')
})

test('leads client supports visit scheduling badge and google event link', () => {
  const clientPath = resolve(process.cwd(), 'src/app/(dashboard)/dashboard/leads/leads-client.tsx')
  const content = readFileSync(clientPath, 'utf-8')

  assert.ok(content.includes('visitStartsAt'), 'AgencyLead interface must support visitStartsAt')
  assert.ok(content.includes('googleEventLink'), 'AgencyLead interface must support googleEventLink')
  assert.ok(content.includes('Visita'), 'Must render Visita badge/label')
  assert.ok(content.includes('Google Agenda'), 'Must provide link to Google Agenda in details')
})
