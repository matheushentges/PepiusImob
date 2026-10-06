import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/50">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Pepius Imob</h1>
        </div>
        <nav className="space-y-1 p-4">
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Dashboard
          </a>
          <a
            href="/dashboard/imoveis"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Imóveis
          </a>
          <a
            href="/dashboard/inbox"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Inbox
          </a>
          <a
            href="/dashboard/leads"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Leads
          </a>
          <a
            href="/dashboard/configuracoes"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Configurações
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
            <p className="font-medium">{profile?.nome || user.email}</p>
          </div>
          <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
            Sair
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
