import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('migration 20261026000001 contains property_keys, key_movements, enums and RLS policies', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261026000001_property_keys_and_movements.sql',
  )
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist')
  const content = fs.readFileSync(migrationPath, 'utf8')

  assert.match(content, /CREATE TYPE key_status AS ENUM/i)
  assert.match(content, /CREATE TYPE key_holder_type AS ENUM/i)
  assert.match(content, /CREATE TABLE IF NOT EXISTS public\.property_keys/i)
  assert.match(content, /CREATE TABLE IF NOT EXISTS public\.key_movements/i)
  assert.match(content, /uq_property_keys_property UNIQUE \(property_id\)/i)
  assert.match(content, /ALTER TABLE public\.property_keys ENABLE ROW LEVEL SECURITY/i)
  assert.match(content, /ALTER TABLE public\.key_movements ENABLE ROW LEVEL SECURITY/i)
  assert.match(content, /REVOKE ALL ON public\.property_keys FROM anon, PUBLIC/i)
  assert.match(content, /REVOKE ALL ON public\.key_movements FROM anon, PUBLIC/i)
  assert.match(content, /idx_key_movements_open/i)
})
