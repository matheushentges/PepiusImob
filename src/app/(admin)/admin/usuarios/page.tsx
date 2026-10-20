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

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*, tenants(nome)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'agent':
        return 'Corretor'
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <Button asChild>
          <a href="/admin/usuarios/novo">Novo Usuário</a>
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
                E-mail
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Função
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imobiliária
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Criado em
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className="border-b border-border last:border-0">
                  <TableCell className="font-medium text-foreground">
                    {user.full_name || 'Sem nome'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {getRoleLabel(user.role)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.tenants?.nome || '—'}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/admin/usuarios/${user.id}`}>Editar</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}