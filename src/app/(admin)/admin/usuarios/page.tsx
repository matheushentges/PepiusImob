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

export default async function UsuariosPage() {
  const supabase = await createClient()

  // Fetch all profiles with tenant info
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, tenants(nome, slug)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profiles:', error)
  }

  function getRoleBadge(role: string) {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      imobiliaria_owner: 'bg-blue-100 text-blue-800',
      imobiliaria_user: 'bg-green-100 text-green-800',
      cliente: 'bg-gray-100 text-gray-800',
    }

    const labels: Record<string, string> = {
      admin: 'Admin',
      imobiliaria_owner: 'Dono',
      imobiliaria_user: 'Usuário',
      cliente: 'Cliente',
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role]}`}>
        {labels[role] || role}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <Button asChild>
          <a href="/admin/usuarios/novo">+ Novo Usuário</a>
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Imobiliária</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles && profiles.length > 0 ? (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.nome}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>{profile.telefone || '-'}</TableCell>
                  <TableCell>{getRoleBadge(profile.role)}</TableCell>
                  <TableCell>
                    {profile.tenants?.nome || (profile.role === 'admin' ? 'Sistema' : '-')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/admin/usuarios/${profile.id}`}>Editar</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum usuário cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
