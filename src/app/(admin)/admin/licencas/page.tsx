import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function LicencasPage() {
  const supabase = await createClient()

  // Fetch all licenses with tenant info
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Licenças</h1>
          <p className="text-muted-foreground">
            Gerencie as licenças de todas as imobiliárias
          </p>
        </div>
        <Button asChild>
          <a href="/admin/licencas/nova">+ Nova Licença</a>
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imobiliária</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses && licenses.length > 0 ? (
              licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="font-medium">
                    {license.tenants?.nome || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{license.plano}</span>
                  </TableCell>
                  <TableCell>{formatCurrency(license.valor)}</TableCell>
                  <TableCell>{formatDate(license.inicio)}</TableCell>
                  <TableCell>{formatDate(license.fim)}</TableCell>
                  <TableCell>
                    {license.active && !isExpired(license.fim) ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Ativo
                      </span>
                    ) : isExpired(license.fim) ? (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                        Expirado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
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
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma licença cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
