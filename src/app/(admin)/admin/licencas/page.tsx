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

export const dynamic = 'force-dynamic'

export default async function LicencasPage() {
  const supabase = await createClient()

  const { data: licenses, error } = await supabase
    .from('licenses')
    .select('*, tenants(nome, slug)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching licenses:', error)
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  function isExpired(endDate: string) {
    return new Date(endDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Licenças
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as licenças de todas as imobiliárias
          </p>
        </div>
        <Button asChild>
          <a href="/admin/licencas/nova">Nova Licença</a>
        </Button>
      </div>

      {/* Table Card - Linha de Planta: border precisa, header separado por linha fina */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imobiliária
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Plano
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Valor
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Início
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fim
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses && licenses.length > 0 ? (
              licenses.map((license) => (
                <TableRow key={license.id} className="border-b border-border last:border-0">
                  <TableCell className="font-medium text-foreground">
                    {license.tenants?.nome || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-muted-foreground">{license.plano}</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums text-foreground">
                    {formatCurrency(license.valor)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(license.inicio)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(license.fim)}
                  </TableCell>
                  <TableCell>
                    {license.active && !isExpired(license.fim) ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Ativo
                      </span>
                    ) : isExpired(license.fim) ? (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                        Expirado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/admin/licencas/${license.id}`}>Editar</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma licença cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}