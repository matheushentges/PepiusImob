import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('VisitSchedulerWidget component exists and includes required tabs and scheduling logic', () => {
  const filePath = resolve(process.cwd(), 'src/components/listing/visit-scheduler-widget.tsx')
  const content = readFileSync(filePath, 'utf-8')

  assert.ok(content.includes('export function VisitSchedulerWidget'), 'Must export VisitSchedulerWidget')
  assert.ok(content.includes('Agendar Visita'), 'Must include Agendar Visita tab')
  assert.ok(content.includes('Enviar Mensagem'), 'Must include Enviar Mensagem tab')
  assert.ok(content.includes('/api/public/calendar/slots'), 'Must call slots API')
  assert.ok(content.includes('/api/public/calendar/book'), 'Must call book API')
  assert.ok(content.includes('googleEventLink'), 'Must support Google Calendar event link on confirmation')
})
