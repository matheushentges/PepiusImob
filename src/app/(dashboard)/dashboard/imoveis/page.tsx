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
import { Plus, Home, Building, MapPin } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  disponivel: 'Disponível',
  vendido: 'Vendido',
  alugado: 'Alugado',
  reservado: 'Reservado',
}

const statusColors: Record<string, string> = {
  disponivel: 'bg-green-50 text-green-700 ring-green-600/20',
  vendido: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  alugado: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  reservado: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

const tipoLabels: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Comercial',
  rural: 'Rural',
}

const finalidadeLabels: Record<string, string> = {
  venda: 'Venda',
  locacao: 'Locação',
  ambos: 'Ambos',
}

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function ImoveisPage() {
  const supabase = await createClient()

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header - Linha de Planta */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Imóveis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o portfólio de imóveis da sua imobiliária
          </p>
        </div>
        <Button asChild className="h-9 gap-2">
          <Link href="/dashboard/imoveis/novo">
            <Plus className="h-4 w-4" />
            Novo Imóvel
          </Link>
        </Button>
      </div>

      {/* Filters Bar - Linha de Planta: border precisa, inputs bg-input */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative flex-1 min-w-[200px]">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cidade, bairro..."
            className="h-9 w-full rounded-md border border-input bg-input pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select className="h-9 rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="">Todos os tipos</option>
          <option value="casa">Casa</option>
          <option value="apartamento">Apartamento</option>
          <option value="terreno">Terreno</option>
          <option value="comercial">Comercial</option>
        </select>
        <select className="h-9 rounded-md border border-input bg-input px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="vendido">Vendido</option>
          <option value="alugado">Alugado</option>
        </select>
      </div>

      {/* Table Card - Linha de Planta: border precisa, header separado por linha fina */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imóvel
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tipo
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Finalidade
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preço
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
            {properties && properties.length > 0 ? (
              properties.map((property) => (
                <TableRow key={property.id} className="border-b border-border last:border-0">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        {property.tipo === 'apartamento' ? (
                          <Building className="h-5 w-5" />
                        ) : (
                          <Home className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {property.titulo}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {property.bairro}, {property.cidade}/{property.estado}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tipoLabels[property.tipo] || property.tipo}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {finalidadeLabels[property.finalidade] || property.finalidade}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums text-foreground">
                    {property.finalidade === 'locacao' || property.finalidade === 'ambos'
                      ? formatCurrency(property.preco_locacao)
                      : formatCurrency(property.preco_venda)}
                    {property.finalidade === 'ambos' && property.preco_locacao && (
                      <span className="ml-1 text-xs text-muted-foreground">/mês</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[property.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                    >
                      {statusLabels[property.status] || property.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild className="h-8">
                      <Link href={`/dashboard/imoveis/${property.id}`}>Editar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Home className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">Nenhum imóvel cadastrado</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Comece adicionando seu primeiro imóvel ao portfólio
                  </p>
                  <Button asChild className="mt-4 h-9">
                    <Link href="/dashboard/imoveis/novo">Adicionar Imóvel</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}