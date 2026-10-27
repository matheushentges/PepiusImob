import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { LicenseSuspended } from '@/components/licensing/license-suspended'
import { LicenseModeProvider } from '@/components/licensing/license-mode-provider'
import { MobileNav } from './mobile-nav'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

const baseNavItems = [
  { href: '/dashboard', label: 'Início', ownerOnly: false },
  { href: '/dashboard/imoveis', label: 'Imóveis', ownerOnly: false },
  { href: '/dashboard/chaves', label: 'Chaves', ownerOnly: false },
  { href: '/dashboard/leads', label: 'Leads', ownerOnly: false },
  { href: '/dashboard/clientes', label: 'Clientes', ownerOnly: false },
  { href: '/dashboard/equipe', label: 'Equipe', ownerOnly: true },
  { href: '/dashboard/configuracoes', label: 'Personalização', ownerOnly: false },
  { href: '/dashboard/licenca', label: 'Licença', ownerOnly: false },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (
    !profile?.tenant_id ||
    (profile.role !== 'imobiliaria_owner' && profile.role !== 'imobiliaria_user')
  ) {
    redirect('/login?error=acesso')
  }

  const isOwner = profile.role === 'imobiliaria_owner'
  const license = await getLocalLicenseAccess()
  const navItems = baseNavItems
    .filter((item) => !item.ownerOnly || isOwner)
    .filter((item) =>
      !license.active ||
      item.href === '/dashboard' ||
      item.href === '/dashboard/equipe' ||
      item.href === '/dashboard/configuracoes' ||
      item.href === '/dashboard/licenca' ||
      license.features.includes(item.href === '/dashboard/leads' ? 'leads' : 'properties'),
    )

  return (
    <DashboardShell
      navItems={navItems}
      profileNome={profile?.nome || 'Usuário'}
      userEmail={user.email ?? ''}
      mobileNav={
        <MobileNav
          items={navItems}
          userName={profile?.nome || 'Usuário'}
          userEmail={user.email ?? ''}
        />
      }
    >
      {!license.active && <LicenseSuspended />}
      <LicenseModeProvider editable={license.active}>{children}</LicenseModeProvider>
    </DashboardShell>
  )
}
