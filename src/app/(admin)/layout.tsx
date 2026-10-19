import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from './nav'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav userName={profile?.nome || user.email} />

      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle bg-surface-base/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent">
              Admin
            </span>
            <p className="text-sm font-semibold text-text-primary">Painel Administrativo</p>
          </div>
          <a
            href="/dashboard"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-accent"
          >
            Ir para Dashboard
          </a>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}