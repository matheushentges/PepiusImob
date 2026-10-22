'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronLeft } from 'lucide-react'
import type { Listing } from '@/lib/listings-data'
import { formatPrice, listingPurposeLabel } from '@/lib/listings-data'
import { ImageCarousel } from '@/components/listing/image-carousel'
import { GalleryDialog } from '@/components/listing/gallery-dialog'
import { ListingSpecs } from '@/components/listing/listing-specs'
import { ContactForm } from '@/components/listing/contact-form'
import { ThemeToggle } from '@/components/theme-toggle'

interface ListingDetailClientProps {
  listing: Listing
  images: string[]
  agencyName: string
}

export function ListingDetailClient({ listing, images, agencyName }: ListingDetailClientProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-base/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link
            href="/imoveis"
            className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Voltar aos imóveis
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight text-accent">{agencyName}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-text-tertiary">
          <Link href="/imoveis" className="hover:text-accent transition-colors">Imóveis</Link>
          <span aria-hidden="true">›</span>
          <span className="capitalize">{listing.category}</span>
          <span aria-hidden="true">›</span>
          <span className="truncate text-text-secondary">{listing.title}</span>
        </nav>

        {/* Title + Price header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {listing.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {listing.offers.map((offer, index) => (
              <p
                key={offer.type}
                className={index === 0
                  ? 'text-3xl font-bold tracking-tight text-accent tabular-nums'
                  : 'text-lg font-semibold tracking-tight text-text-secondary tabular-nums'}
              >
                {listing.offers.length > 1 && (
                  <span className="mr-1.5 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    {offer.type === 'venda' ? 'Venda' : 'Locação'}
                  </span>
                )}
                {formatPrice(offer.price, offer.type)}
              </p>
            ))}
            <div className="flex items-center gap-1 text-sm text-text-secondary">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{listing.neighborhood}, {listing.city}</span>
            </div>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-8">
            <ImageCarousel
              images={images}
              title={listing.title}
              onOpenGallery={() => setGalleryOpen(true)}
            />

            <ListingSpecs listing={listing} />

            {/* Description */}
            {listing.description && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-text-primary">Sobre o imóvel</h2>
                <p className="text-sm leading-relaxed text-text-secondary max-w-prose">
                  {listing.description}
                </p>
              </section>
            )}

            {/* Location */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text-primary">Localização</h2>
              <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-raised p-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{listing.address}</p>
                  <p className="text-sm text-text-secondary">{listing.neighborhood}, {listing.city}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right column — sticky sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <ContactForm listingId={listing.id} listingTitle={listing.title} />

            {/* Quick info card */}
            <div className="rounded-lg border border-border-subtle bg-surface-raised p-5">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Detalhes rápidos</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Finalidade</dt>
                  <dd className="font-medium capitalize text-text-primary">{listingPurposeLabel(listing)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Categoria</dt>
                  <dd className="font-medium capitalize text-text-primary">{listing.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Área</dt>
                  <dd className="font-medium tabular-nums text-text-primary">{listing.area}m²</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Código</dt>
                  <dd className="font-mono text-xs text-text-tertiary">#{listing.id.padStart(4, '0')}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </main>

      <GalleryDialog
        key={galleryOpen ? 'open' : 'closed'}
        images={images}
        title={listing.title}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      {/* Public Footer */}
      <footer className="border-t border-border-subtle bg-surface-raised py-10 mt-20">
        <div className="container mx-auto flex flex-col items-center justify-between gap-5 px-4 text-center md:flex-row md:px-6 md:text-left">
          <div>
            <p className="font-serif text-lg font-semibold tracking-tight text-text-primary">{agencyName}</p>
            <p className="mt-1 text-sm text-text-secondary">Imóveis para venda e locação</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/" className="text-text-secondary transition-colors hover:text-text-primary">
              Início
            </Link>
            <Link href="/imoveis" className="text-text-secondary transition-colors hover:text-text-primary">
              Vitrine de Imóveis
            </Link>
            <Link href="/privacidade" className="text-text-secondary transition-colors hover:text-text-primary">
              Privacidade & Cookies
            </Link>
            <Link
              href="/login"
              className="text-xs text-text-tertiary transition-colors hover:text-text-secondary hover:underline"
              title="Acesso exclusivo para corretores e equipe da imobiliária"
            >
              Imobiliária
            </Link>
          </div>
          <p className="text-xs text-text-tertiary">
            © {new Date().getFullYear()} {agencyName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
