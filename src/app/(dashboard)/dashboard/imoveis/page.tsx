import { Building2, Plus, Search, MoreHorizontal, MapPin, BedDouble, Bath, Maximize } from 'lucide-react'
import { MOCK_LISTINGS, formatPrice } from '@/lib/listings-data'

export default function DashboardImoveisPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Imóveis
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gerencie os anúncios da sua imobiliária
          </p>
        </div>
        <a
          href="/dashboard/imoveis/novo"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-text shadow-xs transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo Imóvel
        </a>
      </div>

      {/* Search and filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por título, bairro ou cidade..."
            className="w-full rounded-md border border-border-default bg-surface-raised py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex gap-2">
          {['Todos', 'Venda', 'Aluguel'].map((filter, i) => (
            <button
              key={filter}
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                i === 0
                  ? 'bg-accent-subtle text-accent'
                  : 'border border-border-default bg-surface-raised text-text-secondary hover:border-accent hover:text-text-primary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Listings table */}
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-overlay/50">
                <th className="px-4 py-3 font-medium text-text-secondary">Imóvel</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Tipo</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Preço</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Detalhes</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 font-medium text-text-secondary text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {MOCK_LISTINGS.map((listing) => (
                <tr key={listing.id} className="transition-colors hover:bg-surface-overlay/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-surface-overlay">
                        <img
                          src={listing.image}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text-primary">{listing.title}</p>
                        <div className="flex items-center gap-1 text-xs text-text-tertiary">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{listing.neighborhood}, {listing.city}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      listing.type === 'venda'
                        ? 'bg-accent-subtle text-accent'
                        : 'bg-surface-overlay text-text-secondary'
                    }`}>
                      {listing.type === 'venda' ? 'Venda' : 'Aluguel'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums text-text-primary">
                    {formatPrice(listing.price, listing.type)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                      {listing.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" aria-hidden="true" />
                          {listing.bedrooms}
                        </span>
                      )}
                      {listing.bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-3 w-3" aria-hidden="true" />
                          {listing.bathrooms}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3 w-3" aria-hidden="true" />
                        {listing.area}m²
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                      Ativo
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-primary"
                      aria-label="Mais ações"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary footer */}
      <p className="text-xs text-text-tertiary">
        Exibindo {MOCK_LISTINGS.length} de {MOCK_LISTINGS.length} imóveis
      </p>
    </div>
  )
}