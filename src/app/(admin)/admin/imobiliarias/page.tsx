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

export default async function ImobiliariasPage() {
  const supabase = await createClient()

  // Fetch all tenants
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*, licenses(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenants:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Imobiliárias</h1>
          <p className="text-muted-foreground">
            Gerencie todas as imobiliárias cadastradas
          </p>
        </div>
        <Button asChild>
          <a href="/admin/imobiliarias/nova">+ Nova Imobiliária</a>
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Licença</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants && tenants.length > 0 ? (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.nome}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      {tenant.slug}
                    </code>
                  </TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>
                    {tenant.active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.license_expires_at
                      ? new Date(tenant.license_expires_at).toLocaleDateString(
                          'pt-BR'
                        )
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
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma imobiliária cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
