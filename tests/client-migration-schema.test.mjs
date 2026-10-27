import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('clients migration SQL contains expected tables, columns, indexes, and RLS policies', () => {
  const filePath = join(process.cwd(), 'supabase/migrations/20261026000002_clients_crm_and_relationships.sql')
  const content = readFileSync(filePath, 'utf-8')

  // Tabelas
  assert.ok(content.includes('CREATE TABLE IF NOT EXISTS public.clients'))
  assert.ok(content.includes('CREATE TABLE IF NOT EXISTS public.client_notes'))

  // Enums
  assert.ok(content.includes('CREATE TYPE client_type AS ENUM'))
  assert.ok(content.includes('CREATE TYPE client_status AS ENUM'))

  // Campos essenciais
  assert.ok(content.includes('papeis TEXT[]'))
  assert.ok(content.includes('tipo_pessoa client_type'))
  assert.ok(content.includes('dados_bancarios JSONB'))
  assert.ok(content.includes('perfil_interesse JSONB'))
  assert.ok(content.includes('corretor_id UUID REFERENCES public.profiles'))

  // Relacionamentos externos
  assert.ok(content.includes('ALTER TABLE public.leads ADD COLUMN client_id'))
  assert.ok(content.includes('ALTER TABLE public.properties ADD COLUMN proprietario_id'))
  assert.ok(content.includes('ALTER TABLE public.key_movements ADD COLUMN client_id'))

  // RLS Policies
  assert.ok(content.includes('ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY'))
  assert.ok(content.includes('clients_tenant_select'))
  assert.ok(content.includes('clients_tenant_insert'))
  assert.ok(content.includes('clients_tenant_update'))
  assert.ok(content.includes('clients_tenant_delete'))

  assert.ok(content.includes('ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY'))
  assert.ok(content.includes('client_notes_tenant_select'))
})
