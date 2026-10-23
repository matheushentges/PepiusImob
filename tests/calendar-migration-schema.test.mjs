import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('migration 20261023000001 contains calendar_settings and leads alterations', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261023000001_calendar_settings_and_visit_leads.sql',
  )
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist')
  const content = fs.readFileSync(migrationPath, 'utf8')

  assert.match(content, /CREATE TABLE IF NOT EXISTS public\.calendar_settings/i)
  assert.match(content, /ENABLE ROW LEVEL SECURITY/i)
  assert.match(content, /visit_duration_minutes INTEGER/i)
  assert.match(content, /buffer_minutes INTEGER/i)
  assert.match(content, /operating_hours JSONB/i)
  assert.match(content, /ADD COLUMN IF NOT EXISTS visit_starts_at TIMESTAMPTZ/i)
  assert.match(content, /ADD COLUMN IF NOT EXISTS google_event_id TEXT/i)
  assert.match(content, /REVOKE ALL ON public\.calendar_settings FROM anon, PUBLIC/i)
})
