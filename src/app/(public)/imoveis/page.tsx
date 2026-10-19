'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BedDouble, Bath, Maximize, Car, MapPin, Search, X } from 'lucide-react'
import { MOCK_LISTINGS, formatPrice } from '@/lib/listings-data'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
] as const

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
] as const

export default function ImoveisPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const filteredListings = useMemo(() => {
    return MOCK_LISTINGS.filter((listing) => {
      if (typeFilter && listing.type !== typeFilter) return false
      if (categoryFilter && listing.category !== categoryFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          listing.title.toLowerCase().includes(query) ||
          listing.neighborhood.toLowerCase().includes(query) ||
          listing.city.toLowerCase().includes(query) ||
          listing.address.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      if (minPrice) {
        const min = Number(minPrice)
        if (!isNaN(min) && listing.price < min) return false
      }
      if (maxPrice) {
        const max = Number(maxPrice)
        if (!isNaN(max) && listing.price > max) return false
      }
      return true
    })
  }, [typeFilter, categoryFilter, searchQuery, minPrice, maxPrice])

  const activeFilterCount = [typeFilter, categoryFilter, searchQuery, minPrice, maxPrice].filter(Boolean).length

  function clearFilters() {
    setTypeFilter('')
    setCategoryFilter('')
    setSearchQuery('')
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Imóveis disponíveis
        </h1>
        <p className="mt-3 text-text-secondary max-w-prose mx-auto">
          Explore nossa seleção de imóveis para venda e locação em São Paulo e região.
        </p>
      </div>

      {/* Dynamic filters panel */}
      <section className="mx-auto max-w-5xl rounded-xl border border-border-subtle bg-surface-raised p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* Search input */}
          <div className="flex-1 space-y-1.5">
            <label htmlFor="search-listings" className="text-xs font-medium text-text-secondary">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
              <input
                id="search-listings"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bairro, cidade ou título..."
                className="w-full rounded-lg border border-border-default bg-surface-base py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-text-primary"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Type filter pills */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">Tipo</span>
            <div className="flex gap-1.5">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTypeFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    typeFilter === option.value
                      ? 'bg-accent text-accent-text'
                      : 'border border-border-default bg-surface-base text-text-secondary hover:border-accent hover:text-text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Second row: category + price range */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Category select */}
          <div className="space-y-1.5 sm:w-48">
            <label htmlFor="category-filter" className="text-xs font-medium text-text-secondary">
              Categoria
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border-default bg-surface-base px-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="flex flex-1 items-end gap-2">
            <div className="space-y-1.5 flex-1">
              <label htmlFor="min-price" className="text-xs font-medium text-text-secondary">
                Preço mínimo
              </label>
              <input
                id="min-price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="R$ 0"
                min={0}
                className="flex h-10 w-full rounded-lg border border-border-default bg-surface-base px-3 text-sm tabular-nums text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <span className="mb-3 text-text-tertiary">–</span>
            <div className="space-y-1.5 flex-1">
              <label htmlFor="max-price" className="text-xs font-medium text-text-secondary">
                Preço máximo
              </label>
              <input
                id="max-price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Sem limite"
                min={0}
                className="flex h-10 w-full rounded-lg border border-border-default bg-surface-base px-3 text-sm tabular-nums text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Clear filters button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-default bg-surface-base px-4 text-sm font-medium text-text-secondary transition-colors hover:border-error hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="mt-4 text-xs text-text-tertiary">
          {filteredListings.length} {filteredListings.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
          {activeFilterCount > 0 && ` · ${activeFilterCount} ${activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}`}
        </p>
      </section>

      {/* Listings grid */}
      {filteredListings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/imoveis/${listing.id}`}
              className="group block overflow-hidden rounded-lg border border-border-subtle bg-surface-raised transition-all hover:border-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <article>
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-overlay">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded bg-surface-base/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-text-primary backdrop-blur-sm">
                    {listing.type === 'venda' ? 'Venda' : 'Aluguel'}
                  </span>
                  {listing.featured && (
                    <span className="absolute right-3 top-3 rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-text">
                      Destaque
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xl font-bold tracking-tight text-accent tabular-nums">
                      {formatPrice(listing.price, listing.type)}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-text-primary leading-snug line-clamp-2">
                      {listing.title}
                    </h2>
                    <div className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{listing.neighborhood}, {listing.city}</span>
                    </div>
                  </div>

                  {/* Specs row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-subtle pt-3 text-xs text-text-secondary">
                    {listing.bedrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
                        {listing.bedrooms} {listing.bedrooms === 1 ? 'quarto' : 'quartos'}
                      </span>
                    )}
                    {listing.bathrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" aria-hidden="true" />
                        {listing.bathrooms} {listing.bathrooms === 1 ? 'banheiro' : 'banheiros'}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Maximize className="h-3.5 w-3.5" aria-hidden="true" />
                      {listing.area} m²
                    </span>
                    {listing.parking > 0 && (
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" aria-hidden="true" />
                        {listing.parking} {listing.parking === 1 ? 'vaga' : 'vagas'}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-overlay text-text-tertiary">
            <Search className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Nenhum imóvel encontrado</h2>
          <p className="mt-2 text-sm text-text-secondary max-w-sm">
            Tente ajustar os filtros ou buscar por outro bairro, cidade ou tipo de imóvel.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  )
}