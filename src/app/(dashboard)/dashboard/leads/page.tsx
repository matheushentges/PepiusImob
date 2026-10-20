import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Phone, Mail, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  em_contato: 'Em Contato',
  convertido: 'Convertido',
  perdido: 'Perdido',
}

const statusColors: Record<string, string> = {
  novo: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  em_contato: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  convertido: 'bg-green-50 text-green-700 ring-green-600/20',
  perdido: 'bg-red-50 text-red-700 ring-red-600/20',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*, properties(titulo)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header - Linha de Planta */}
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          Leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe e gerencie os leads da sua imobiliária
        </p>
      </div>

      {/* Stats Row - Linha de Planta: cards compactos com border precisa */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: leads?.length || 0, accent: false },
          { label: 'Novos', value: leads?.filter(l => l.status === 'novo').length || 0, accent: false },
          { label: 'Em Contato', value: leads?.filter(l => l.status === 'em_contato').length || 0, accent: false },
          { label: 'Convertidos', value: leads?.filter(l => l.status === 'convertido').length || 0, accent: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-1 text-xl font-semibold ${stat.accent ? 'text-accent' : 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Bar - Linha de Planta: border precisa, inputs bg-input */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <input
          type="text"
          placeholder="Buscar por nome, email..."
          className="h-9 flex-1 min-w-[200px] rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select className="h-9 rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="em_contato">Em Contato</option>
          <option value="convertido">Convertido</option>
          <option value="perdido">Perdido</option>
        </select>
      </div>

      {/* Table Card - Linha de Planta: border precisa, header separado por linha fina */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lead
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contato
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imóvel Interesse
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Data
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads && leads.length > 0 ? (
              leads.map((lead) => (
                <TableRow key={lead.id} className="border-b border-border last:border-0">
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {lead.nome}
                      </p>
                      {lead.mensagem && (
                        <p className="truncate text-xs text-muted-foreground max-w-[200px]">
                          {lead.mensagem}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.telefone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{lead.telefone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.properties?.titulo || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[lead.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                    >
                      {statusLabels[lead.status] || lead.status}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(lead.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8">
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">Nenhum lead registrado</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Os leads aparecerão aqui quando clientes entrarem em contato
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}