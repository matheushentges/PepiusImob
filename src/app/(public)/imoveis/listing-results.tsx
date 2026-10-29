'use client'

import { useState, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BedDouble, Bath, Maximize, Car, MapPin, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatPrice,
  listingMatchesPrice,
  listingPurposeLabel,
  getPaginationPages,
  paginateItems,
  type Listing,
} from '@/lib/listings-data'
import type { PublicSiteConfig } from '@/lib/public-listings'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
] as const

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
  { value: 'terreno', label: 'Terreno' },
] as const

const BEDROOM_OPTIONS = [
  { value: 0, label: 'Quartos' },
  { value: 1, label: '1+ quarto' },
  { value: 2, label: '2+ quartos' },
  { value: 3, label: '3+ quartos' },
  { value: 4, label: '4+ quartos' },
] as const

const PARKING_OPTIONS = [
  { value: 0, label: 'Vagas' },
  { value: 1, label: '1+ vaga' },
  { value: 2, label: '2+ vagas' },
] as const

const DEFAULT_PAGE_SIZE = 12

export function ListingResults({
  listings,
  siteConfig,
  initialSearch = '',
  initialType = '',
}: {
  listings: Listing[]
  siteConfig: PublicSiteConfig
  initialSearch?: string
  initialType?: string
}) {
  const [typeFilter, setTypeFilter] = useState(initialType)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minBedrooms, setMinBedrooms] = useState<number>(0)
  const [minParking, setMinParking] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const resultsRef = useRef<HTMLDivElement>(null)

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (typeFilter && !listing.offers.some((offer) => offer.type === typeFilter)) return false
      if (categoryFilter && listing.category !== categoryFilter) return false
      if (minBedrooms > 0 && listing.bedrooms < minBedrooms) return false
      if (minParking > 0 && listing.parking < minParking) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          listing.title.toLowerCase().includes(query) ||
          listing.neighborhood.toLowerCase().includes(query) ||
          listing.city.toLowerCase().includes(query) ||
          listing.address.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      const min = minPrice ? Number(minPrice) : null
      const max = maxPrice ? Number(maxPrice) : null
      const safeMin = min !== null && Number.isFinite(min) ? min : null
      const safeMax = max !== null && Number.isFinite(max) ? max : null
      if (!listingMatchesPrice(listing, safeMin, safeMax)) return false
      return true
    })
  }, [listings, typeFilter, categoryFilter, minBedrooms, minParking, searchQuery, minPrice, maxPrice])

  const pagination = useMemo(() => {
    return paginateItems(filteredListings, currentPage, pageSize)
  }, [filteredListings, currentPage, pageSize])

  const {
    items: paginatedListings,
    totalItems,
    totalPages,
    currentPage: safeCurrentPage,
    startIndex,
    endIndex,
  } = pagination

  const activeFilterCount = [
    typeFilter,
    categoryFilter,
    minBedrooms > 0 ? String(minBedrooms) : '',
    minParking > 0 ? String(minParking) : '',
    searchQuery,
    minPrice,
    maxPrice,
  ].filter(Boolean).length

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    if (resultsRef.current) {
      const topOffset = resultsRef.current.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' })
    }
  }

  function handleFilterReset() {
    setTypeFilter('')
    setCategoryFilter('')
    setMinBedrooms(0)
    setMinParking(0)
    setSearchQuery('')
    setMinPrice('')
    setMaxPrice('')
    setCurrentPage(1)
  }

  let pageHeading = 'Catálogo de Imóveis'
  if (typeFilter === 'venda') pageHeading = 'Imóveis à Venda'
  else if (typeFilter === 'aluguel') pageHeading = 'Imóveis para Locação'
  if (searchQuery) pageHeading += ` — "${searchQuery}"`
  if (categoryFilter) {
    const catLabel = CATEGORY_OPTIONS.find((c) => c.value === categoryFilter)?.label
    if (catLabel) pageHeading += ` (${catLabel})`
  }

  return (
    <div
      ref={resultsRef}
      className="space-y-8"
      style={{ '--primary': siteConfig.primaryColor, '--accent': siteConfig.accentColor } as CSSProperties}
    >
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {pageHeading}
        </h1>
        <p className="mt-3 text-text-secondary max-w-prose mx-auto">
          {siteConfig.heroSubtitle || `Explore os imóveis disponíveis na ${siteConfig.agencyName}.`}
        </p>
      </div>

      {/* Dynamic filters panel */}
      <section className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-5 shadow-xs">
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
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Bairro, cidade ou título..."
                className="w-full rounded-lg border border-border-default bg-card py-2.5 pl-10 pr-4 text-sm text-text-primary shadow-2xs placeholder:text-text-tertiary transition-all hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setCurrentPage(1)
                  }}
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
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setTypeFilter(option.value)
                    setCurrentPage(1)
                  }}
                  className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${
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

        {/* Second row: category + bedrooms + parking + price range */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {/* Category select */}
          <div className="space-y-1.5 sm:w-44">
            <label htmlFor="category-filter" className="text-xs font-medium text-text-secondary">
              Categoria
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="flex h-10 w-full rounded-lg border border-border-default bg-card px-3 text-sm text-text-primary shadow-2xs transition-all hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms select */}
          <div className="space-y-1.5 sm:w-32">
            <label htmlFor="bedrooms-filter" className="text-xs font-medium text-text-secondary">
              Quartos
            </label>
            <select
              id="bedrooms-filter"
              value={minBedrooms}
              onChange={(e) => {
                setMinBedrooms(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="flex h-10 w-full rounded-lg border border-border-default bg-card px-3 text-sm text-text-primary shadow-2xs transition-all hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {BEDROOM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Parking select */}
          <div className="space-y-1.5 sm:w-28">
            <label htmlFor="parking-filter" className="text-xs font-medium text-text-secondary">
              Vagas
            </label>
            <select
              id="parking-filter"
              value={minParking}
              onChange={(e) => {
                setMinParking(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="flex h-10 w-full rounded-lg border border-border-default bg-card px-3 text-sm text-text-primary shadow-2xs transition-all hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {PARKING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="flex flex-1 items-end gap-2 min-w-[200px]">
            <div className="space-y-1.5 flex-1">
              <label htmlFor="min-price" className="text-xs font-medium text-text-secondary">
                Preço mín.
              </label>
              <input
                id="min-price"
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="R$ 0"
                min={0}
                className="flex h-10 w-full rounded-lg border border-border-default bg-card px-3 text-sm tabular-nums text-text-primary shadow-2xs placeholder:text-text-tertiary transition-all hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <span className="mb-3 text-text-tertiary">–</span>
            <div className="space-y-1.5 flex-1">
              <label htmlFor="max-price" className="text-xs font-medium text-text-secondary">
                Preço máx.
              </label>
              <input
                id="max-price"
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Sem limite"
                min={0}
                className="flex h-10 w-full rounded-lg border border-border-default bg-card px-3 text-sm tabular-nums text-text-primary shadow-2xs placeholder:text-text-tertiary transition-all hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Clear filters button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleFilterReset}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-base px-4 text-sm font-medium text-text-secondary transition-colors hover:border-error hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar filtros
            </button>
          )}
        </div>

        {/* Results count & page size info */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-border-subtle pt-3 text-xs text-text-tertiary">
          <p>
            {totalItems > 0 ? (
              <>
                Exibindo <span className="font-semibold text-text-primary">{startIndex + 1}–{endIndex}</span> de{' '}
                <span className="font-semibold text-text-primary">{totalItems}</span> {totalItems === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
              </>
            ) : (
              'Nenhum imóvel encontrado'
            )}
            {activeFilterCount > 0 && ` · ${activeFilterCount} ${activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}`}
          </p>

          {totalItems > DEFAULT_PAGE_SIZE && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label htmlFor="items-per-page" className="text-text-secondary">
                Por página:
              </label>
              <select
                id="items-per-page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 rounded-md border border-border-default bg-surface-base px-2 text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Listings grid */}
      {paginatedListings.length > 0 ? (
        <div className="space-y-10">
          <h2 className="sr-only">Resultados dos imóveis encontrados</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/imoveis/${listing.id}`}
                className="group block overflow-hidden rounded-lg border border-border-subtle bg-surface-raised transition-all hover:border-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <article>
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-overlay">
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded bg-surface-base/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-text-primary backdrop-blur-sm">
                      {listingPurposeLabel(listing)}
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
                      <div className="space-y-0.5">
                        {listing.offers.map((offer, index) => (
                          <p
                            key={offer.type}
                            className={index === 0
                              ? 'text-xl font-bold tracking-tight text-accent tabular-nums'
                              : 'text-sm font-semibold tracking-tight text-text-secondary tabular-nums'}
                          >
                            {listing.offers.length > 1 && (
                              <span className="mr-1 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                                {offer.type === 'venda' ? 'Venda' : 'Locação'}
                              </span>
                            )}
                            {formatPrice(offer.price, offer.type)}
                          </p>
                        ))}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-text-primary leading-snug line-clamp-2">
                        {listing.title}
                      </h3>
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

          {/* Pagination controls */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginação do catálogo de imóveis"
              className="flex flex-col items-center justify-between gap-4 sm:flex-row border-t border-border-subtle pt-6"
            >
              <p className="text-xs text-text-secondary order-2 sm:order-1">
                Página <span className="font-semibold text-text-primary">{safeCurrentPage}</span> de{' '}
                <span className="font-semibold text-text-primary">{totalPages}</span>
              </p>

              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                {/* Previous page button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-border-default bg-surface-base px-3 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  aria-label="Ir para a página anterior"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {getPaginationPages(safeCurrentPage, totalPages).map((pageNum, idx) => {
                    if (pageNum === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-text-tertiary select-none">
                          …
                        </span>
                      )
                    }
                    const isCurrent = pageNum === safeCurrentPage
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-accent text-accent-text shadow-xs'
                            : 'border border-border-default bg-surface-base text-text-secondary hover:border-accent hover:text-text-primary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Next page button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-border-default bg-surface-base px-3 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  aria-label="Ir para a próxima página"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
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
            onClick={handleFilterReset}
            className="mt-6 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  )
}
