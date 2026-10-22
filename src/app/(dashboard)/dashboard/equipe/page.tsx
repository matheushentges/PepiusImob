import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAgencyContext } from '@/lib/auth/agency'
import { TeamClientView, type TeamMember } from './team-client-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Equipe e Acessos | Painel Gerencial',
  description: 'Gerenciamento de corretores e responsáveis autorizados no painel da imobiliária.',
}

export default async function TeamPage() {
  const result = await getAgencyContext()
  if (result.response) {
    redirect('/login')
  }
  const { context } = result

  const { data: profiles, error } = await context.supabase
    .from('profiles')
    .select('id, nome, email, role, created_at')
    .eq('tenant_id', context.tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error('Falha ao carregar a lista de membros da equipe')
  }

  const initialMembers: TeamMember[] = (profiles || []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    role: p.role as 'imobiliaria_owner' | 'imobiliaria_user',
    created_at: p.created_at,
  }))

  return (
    <TeamClientView
      initialMembers={initialMembers}
      currentUserId={context.userId}
      currentUserRole={context.role}
    />
  )
}
