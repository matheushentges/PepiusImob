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

export default async function ImobiliariasPage() {
  const supabase = await createClient()

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*, licenses(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenants:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Imobiliárias
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie todas as imobiliárias cadastradas
          </p>
        </div>
        <Button asChild>
          <a href="/admin/imobiliarias/nova">Nova Imobiliária</a>
        </Button>
      </div>

      {/* Table Card - Linha de Planta: border precisa, header separado por linha fina */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nome
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Slug
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                E-mail
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Licença
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants && tenants.length > 0 ? (
              tenants.map((tenant) => (
                <TableRow key={tenant.id} className="border-b border-border last:border-0">
                  <TableCell className="font-medium text-foreground">{tenant.nome}</TableCell>
                  <TableCell>
                    <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                      {tenant.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tenant.email}</TableCell>
                  <TableCell>
                    {tenant.active ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tenant.license_expires_at
                      ? new Date(tenant.license_expires_at).toLocaleDateString('pt-BR')
                      : 'Sem licença'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/admin/imobiliarias/${tenant.id}`}>Editar</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma imobiliária cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}