import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from './nav'

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

  return (
    <div className="flex min-h-screen">
      <DashboardNav userName={profile?.nome || user.email} />

      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle bg-surface-base/80 px-6 backdrop-blur-sm">
          <div className="lg:hidden">
            {/* Mobile menu trigger handled inside DashboardNav via Sheet */}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-text-tertiary">Bem-vindo de volta</p>
            <p className="text-sm font-semibold text-text-primary">{profile?.nome || user.email}</p>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}