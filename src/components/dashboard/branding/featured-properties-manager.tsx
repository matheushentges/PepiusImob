'use client'

import { useEffect, useState } from 'react'
import { Star, Search, Loader2, Building2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PropertySummary {
  id: string
  titulo: string
  tipo: string
  finalidade: string
  status: string
  featured: boolean
  bairro?: string
  cidade?: string
  preco_venda?: number | null
  preco_locacao?: number | null
  cover_url?: string | null
}

function formatPrice(value?: number | null): string {
  if (!value) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function FeaturedPropertiesManager({ disabled = false }: { disabled?: boolean }) {
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/dashboard/properties', { cache: 'no-store' })
        if (!response.ok) throw new Error('Não foi possível carregar os imóveis')
        const data = await response.json()
        setProperties(Array.isArray(data) ? data : data.properties || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar lista de imóveis')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function toggleFeatured(property: PropertySummary) {
    if (disabled || updatingId) return
    setUpdatingId(property.id)
    setError(null)

    const nextFeatured = !property.featured

    try {
      const response = await fetch(`/api/dashboard/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: nextFeatured }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Não foi possível atualizar o destaque')
      }

      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, featured: nextFeatured } : p)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar destaque')
    } finally {
      setUpdatingId(null)
    }
  }

  const featuredCount = properties.filter((p) => p.featured).length

  const filteredProperties = properties.filter((p) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      p.titulo.toLowerCase().includes(term) ||
      p.bairro?.toLowerCase().includes(term) ||
      p.cidade?.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      {/* Header com Contador e Orientação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h4 className="text-sm font-semibold text-foreground">Curadoria de Imóveis em Destaque</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Os imóveis marcados aparecerão com destaque prioritário no carrossel da página inicial.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-background px-3 py-1 border border-border text-xs font-semibold">
          <span className="text-accent">{featuredCount}</span>
          <span className="text-muted-foreground">de</span>
          <span className="text-foreground">{properties.length}</span>
          <span className="text-muted-foreground">destacados</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Busca Rápida */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, bairro ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {/* Lista de Imóveis */}
      {loading ? (
        <div className="flex items-center justify-center p-8 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span>Carregando catálogo de imóveis...</span>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
          Nenhum imóvel encontrado {search ? 'para a busca informada' : 'cadastrado no sistema'}.
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-border/60 rounded-xl border border-border bg-card overflow-hidden">
          {filteredProperties.map((property) => {
            const isUpdating = updatingId === property.id
            const priceLabel =
              property.finalidade === 'venda'
                ? formatPrice(property.preco_venda)
                : property.finalidade === 'locacao'
                  ? `${formatPrice(property.preco_locacao)}/mês`
                  : `${formatPrice(property.preco_venda)} | ${formatPrice(property.preco_locacao)}/mês`

            return (
              <div
                key={property.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-muted-foreground shrink-0 overflow-hidden border border-border/80">
                    {property.cover_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={property.cover_url}
                        alt={property.titulo}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{property.titulo}</p>
                      {property.featured && (
                        <span className="shrink-0 flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Star className="h-2.5 w-2.5 fill-amber-500" /> Destaque
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {property.bairro ? `${property.bairro}, ` : ''}{property.cidade ?? ''}
                      {priceLabel ? ` • ${priceLabel}` : ''}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={property.featured ? 'default' : 'outline'}
                  size="sm"
                  disabled={disabled || isUpdating}
                  onClick={() => toggleFeatured(property)}
                  className={`h-8 text-xs gap-1.5 w-full sm:w-auto shrink-0 ${
                    property.featured
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'hover:border-accent hover:text-accent'
                  }`}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Star
                      className={`h-3.5 w-3.5 ${
                        property.featured ? 'fill-white' : 'text-muted-foreground'
                      }`}
                    />
                  )}
                  <span>{property.featured ? 'Remover Destaque' : 'Destacar na Home'}</span>
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
