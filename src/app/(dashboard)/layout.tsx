import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Building2, MessageSquare, Users, Settings, LogOut, Menu } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/imoveis', label: 'Imóveis', icon: Building2 },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Admins devem usar o painel /admin, não o dashboard da imobiliária
  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Linha de Planta signature: border-r precisa, fundo card */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center border-b border-border px-5">
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Pepius
          </span>
          <span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
            Imob
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-3">
            <p className="text-xs font-medium text-foreground">{profile?.nome || 'Usuário'}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <span className="font-serif text-base font-semibold text-foreground">Pepius Imob</span>
          <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}