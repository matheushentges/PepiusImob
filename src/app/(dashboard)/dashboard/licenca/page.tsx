import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLicenseStatusDetails } from '@/lib/licensing/service'
import { LicenseClientView } from './license-client-view'

export const metadata: Metadata = {
  title: 'Licença do Sistema | Painel da Imobiliária',
  description: 'Gerenciamento do licenciamento, validade e ativação da instalação on-premise.',
}

export default async function LicenseDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (
    !profile?.tenant_id ||
    (profile.role !== 'imobiliaria_owner' && profile.role !== 'imobiliaria_user')
  ) {
    redirect('/login?error=acesso')
  }

  const details = await getLicenseStatusDetails()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Licença do Sistema
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o estado de conformidade, vigência e ativação da instalação do Pepius Imob.
        </p>
      </div>

      <LicenseClientView initialDetails={details} userRole={profile.role} />
    </div>
  )
}
