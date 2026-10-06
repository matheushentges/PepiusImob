import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
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

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/50">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-primary">Admin</h1>
        </div>
        <nav className="space-y-1 p-4">
          <a
            href="/admin"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Dashboard
          </a>
          <a
            href="/admin/imobiliarias"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Imobiliárias
          </a>
          <a
            href="/admin/licencas"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Licenças
          </a>
          <a
            href="/admin/usuarios"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Usuários
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div>
            <p className="text-sm font-medium text-primary">Admin Panel</p>
          </div>
          <a
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:underline"
          >
            Ir para Dashboard
          </a>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
