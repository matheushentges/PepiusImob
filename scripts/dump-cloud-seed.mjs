import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Supabase URL or key missing in env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function dump() {
  const { data: tenants, error: tErr } = await supabase.from('tenants').select('*')
  if (tErr) throw tErr

  const { data: properties, error: pErr } = await supabase.from('properties').select('*')
  if (pErr) throw pErr

  let sql = '-- Seed exportado do Supabase Cloud\n\n'

  for (const t of tenants) {
    const siteConfigStr = JSON.stringify(t.site_config || {}).replace(/'/g, "''")
    const phoneVal = t.telefone ? `'${t.telefone.replace(/'/g, "''")}'` : 'NULL'
    sql += `INSERT INTO public.tenants (id, nome, slug, email, telefone, active, site_config)
VALUES ('${t.id}', '${t.nome}', '${t.slug}', '${t.email}', ${phoneVal}, ${t.active}, '${siteConfigStr}')
ON CONFLICT (id) DO UPDATE SET site_config = EXCLUDED.site_config, nome = EXCLUDED.nome;\n\n`
  }

  for (const p of properties) {
    const title = (p.title || '').replace(/'/g, "''")
    const desc = (p.description || '').replace(/'/g, "''")
    const addr = (p.address || '').replace(/'/g, "''")
    const neigh = (p.neighborhood || '').replace(/'/g, "''")
    const city = (p.city || '').replace(/'/g, "''")
    const state = (p.state || '').replace(/'/g, "''")
    const cep = (p.postal_code || '').replace(/'/g, "''")
    const sale = p.sale_price !== null && p.sale_price !== undefined ? p.sale_price : 'NULL'
    const rent = p.rent_price !== null && p.rent_price !== undefined ? p.rent_price : 'NULL'

    sql += `INSERT INTO public.properties (id, tenant_id, title, description, category, purpose, sale_price, rent_price, status, bedrooms, bathrooms, suites, parking_spots, total_area, private_area, address, neighborhood, city, state, postal_code, featured)
VALUES ('${p.id}', '${p.tenant_id}', '${title}', '${desc}', '${p.category}', '${p.purpose}', ${sale}, ${rent}, '${p.status}', ${p.bedrooms || 0}, ${p.bathrooms || 0}, ${p.suites || 0}, ${p.parking_spots || 0}, ${p.total_area || 0}, ${p.private_area || 0}, '${addr}', '${neigh}', '${city}', '${state}', '${cep}', ${p.featured ? 'true' : 'false'})
ON CONFLICT (id) DO NOTHING;\n\n`
  }

  writeFileSync('supabase/seed-cloud-data.sql', sql, 'utf-8')
  console.log(`Generated supabase/seed-cloud-data.sql with ${tenants.length} tenants and ${properties.length} properties!`)
}

dump().catch(console.error)
