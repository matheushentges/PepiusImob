import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

function required(name, minLength = 1) {
  const value = process.env[name]?.trim()
  if (!value || value.length < minLength) throw new Error(`${name} is required`)
  return value
}

function client() {
  return createClient(
    process.env.SUPABASE_INTERNAL_URL || required('NEXT_PUBLIC_SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const agencyName = required('AGENCY_NAME', 2)
const agencySlug = required('AGENCY_SLUG', 2)
const agencyEmail = required('AGENCY_EMAIL')
const ownerName = required('AGENCY_OWNER_NAME', 2)
const ownerEmail = required('AGENCY_OWNER_EMAIL')
const ownerPassword = required('AGENCY_OWNER_PASSWORD', 12)
const phone = process.env.AGENCY_PHONE?.trim() || null

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(agencySlug)) {
  throw new Error('AGENCY_SLUG must use lowercase letters, numbers and internal hyphens')
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
  throw new Error('A valid agency and owner email are required')
}

const supabase = client()
const tenantId = randomUUID()
const { error: tenantError } = await supabase.from('tenants').insert({
  id: tenantId,
  nome: agencyName,
  slug: agencySlug,
  email: agencyEmail,
  telefone: phone,
  active: true,
  site_config: {},
})
if (tenantError) throw new Error('Could not create the agency record')

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: ownerEmail,
  password: ownerPassword,
  email_confirm: true,
  user_metadata: { nome: ownerName },
})
if (authError || !authData.user) {
  await supabase.from('tenants').delete().eq('id', tenantId)
  throw new Error('Could not create the agency owner account')
}

const { error: profileError } = await supabase.from('profiles').update({
  tenant_id: tenantId,
  role: 'imobiliaria_owner',
  nome: ownerName,
  email: ownerEmail,
}).eq('id', authData.user.id)

if (profileError) {
  await supabase.auth.admin.deleteUser(authData.user.id)
  await supabase.from('tenants').delete().eq('id', tenantId)
  throw new Error('Could not link the owner account to the agency')
}

console.log(JSON.stringify({ tenantId, ownerUserId: authData.user.id, agencySlug }, null, 2))
