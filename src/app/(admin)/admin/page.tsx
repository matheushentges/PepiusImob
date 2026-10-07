export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Painel de administração do sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Total de Imobiliárias
          </p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Imobiliárias Ativas
          </p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Total de Usuários
          </p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Receita Mensal
          </p>
          <p className="mt-2 text-3xl font-bold">R$ 0</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">Ações Rápidas</h2>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          <a
            href="/admin/imobiliarias/nova"
            className="rounded-md border border-dashed p-6 text-center hover:border-solid hover:bg-accent"
          >
            <p className="font-medium">+ Nova Imobiliária</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastrar nova imobiliária
            </p>
          </a>
          <a
            href="/admin/licencas"
            className="rounded-md border border-dashed p-6 text-center hover:border-solid hover:bg-accent"
          >
            <p className="font-medium">📋 Gerenciar Licenças</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ativar, renovar e desativar
            </p>
          </a>
          <a
            href="/admin/usuarios"
            className="rounded-md border border-dashed p-6 text-center hover:border-solid hover:bg-accent"
          >
            <p className="font-medium">👥 Gerenciar Usuários</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ver todos os usuários
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}
