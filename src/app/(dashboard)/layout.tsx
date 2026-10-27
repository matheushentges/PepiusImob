import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { LogOut, ExternalLink } from 'lucide-react'
import { getLocalLicenseAccess } from '@/lib/licensing/local-state'
import { LicenseSuspended } from '@/components/licensing/license-suspended'
import { LicenseModeProvider } from '@/components/licensing/license-mode-provider'
import { MobileNav } from './mobile-nav'
import { DashboardNavLinks } from '@/components/dashboard/dashboard-nav-links'
import { ThemeToggle } from '@/components/theme-toggle'

const baseNavItems = [
  { href: '/dashboard', label: 'Visão Geral', ownerOnly: false },
  { href: '/dashboard/imoveis', label: 'Catálogo de Imóveis', ownerOnly: false },
  { href: '/dashboard/chaves', label: 'Controle de Chaves', ownerOnly: false },
  { href: '/dashboard/leads', label: 'Contatos de Clientes', ownerOnly: false },
  { href: '/dashboard/clientes', label: 'Gestão de Clientes', ownerOnly: false },
  { href: '/dashboard/equipe', label: 'Equipe e Acessos', ownerOnly: true },
  { href: '/dashboard/configuracoes', label: 'Personalização do Site', ownerOnly: false },
  { href: '/dashboard/licenca', label: 'Licença do Sistema', ownerOnly: false },
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Linha de Planta signature: border-r precisa, fundo card */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
              Pepius
            </span>
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
              Imob
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir vitrine pública em nova aba"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <span>Site</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <DashboardNavLinks items={navItems} />

        <div className="border-t border-border p-3 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-semibold text-foreground">{profile?.nome || 'Usuário'}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <ThemeToggle className="h-8 w-8 shrink-0" />
          </div>

          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border/80 bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold text-foreground">Pepius Imob</span>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
            >
              <span>Ver site</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8" />
            <MobileNav
              items={navItems}
              userName={profile?.nome || 'Usuário'}
              userEmail={user.email ?? ''}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {!license.active && <LicenseSuspended />}
            <LicenseModeProvider editable={license.active}>{children}</LicenseModeProvider>
          </div>
        </main>
      </div>
    </div>
  )
}
