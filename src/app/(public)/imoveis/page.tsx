import { BedDouble, Bath, Maximize, Car, MapPin } from 'lucide-react'
import { MOCK_LISTINGS, formatPrice } from '@/lib/listings-data'

export default function ImoveisPage() {
  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Imóveis disponíveis
        </h1>
        <p className="mt-3 text-text-secondary max-w-prose mx-auto">
          Explore nossa seleção de imóveis para venda e locação em São Paulo e região.
        </p>
      </div>

      {/* Filters placeholder — visual structure for future implementation */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {['Todos', 'Venda', 'Aluguel', 'Apartamento', 'Casa', 'Comercial'].map((filter, i) => (
          <button
            key={filter}
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              i === 0
                ? 'bg-accent text-accent-text'
                : 'border border-border-default bg-surface-raised text-text-secondary hover:border-accent hover:text-text-primary'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOCK_LISTINGS.map((listing) => (
          <article
            key={listing.id}
            className="group overflow-hidden rounded-lg border border-border-subtle bg-surface-raised transition-all hover:border-accent/40 hover:shadow-md"
          >
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
        ))}
      </div>
    </div>
  )
}