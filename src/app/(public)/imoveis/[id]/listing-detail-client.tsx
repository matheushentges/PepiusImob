'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ChevronLeft, Share2, Copy, Check, MessageCircle } from 'lucide-react'
import type { Listing } from '@/lib/listings-data'
import { formatPrice, listingPurposeLabel } from '@/lib/listings-data'
import { ImageCarousel } from '@/components/listing/image-carousel'
import { GalleryDialog } from '@/components/listing/gallery-dialog'
import { ListingSpecs } from '@/components/listing/listing-specs'
import { VisitSchedulerWidget } from '@/components/listing/visit-scheduler-widget'

interface ListingDetailClientProps {
  listing: Listing
  images: string[]
  agencyName: string
  agencyPhone?: string
}

export function ListingDetailClient({
  listing,
  images,
  agencyName,
  agencyPhone,
}: ListingDetailClientProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const digits = (agencyPhone || '').replace(/\D/g, '')
  const cleanPhone = digits.length >= 10 ? (digits.length === 10 || digits.length === 11 ? `55${digits}` : digits) : null

  const priceSummary = listing.offers
    .map((offer) => formatPrice(offer.price, offer.type))
    .join(' ou ')

  const shareText = `*${listing.title}*\n📍 ${listing.neighborhood}, ${listing.city}\n💰 ${priceSummary}\n📐 ${listing.area}m² • ${listing.bedrooms} quartos\n\nConfira as fotos e detalhes:`

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `${shareText}\n`,
          url,
        })
        return
      } catch {
        // Usuário cancelou ou navegador não completou o share nativo
      }
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${url}`)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 pb-24 lg:pb-8 lg:px-8">
      <div className="mb-4">
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao catálogo de imóveis
        </Link>
      </div>
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-text-tertiary">
          <Link href="/imoveis" className="hover:text-accent transition-colors">Imóveis</Link>
          <span aria-hidden="true">›</span>
          <span className="capitalize">{listing.category}</span>
          <span aria-hidden="true">›</span>
          <span className="truncate text-text-secondary">{listing.title}</span>
        </nav>

        {/* Title + Price + Share header */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
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
          </div>

          {/* Social Share actions */}
          <div className="flex items-center gap-2 self-start shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3.5 py-2 text-xs font-semibold text-text-primary shadow-xs transition hover:bg-surface-inset hover:border-accent"
              title="Compartilhar no WhatsApp ou redes"
            >
              <Share2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Compartilhar</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-xs font-medium text-text-secondary shadow-xs transition hover:bg-surface-inset"
              title="Copiar link do anúncio"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
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
          <aside id="agendamento" className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <VisitSchedulerWidget
              listingId={listing.id}
              listingTitle={listing.title}
              listingCode={listing.id}
              agencyPhone={agencyPhone}
              agencyName={agencyName}
            />

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
                {agencyName && (
                  <div className="flex justify-between border-t border-border-subtle pt-2">
                    <dt className="text-text-secondary">Anunciante</dt>
                    <dd className="font-medium text-text-primary truncate max-w-[180px]">{agencyName}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>

        {/* Sticky Mobile Conversion Bar */}
        <aside
          aria-label="Ações rápidas de contato do imóvel"
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-md lg:hidden"
        >
          <div className="min-w-0 pr-2">
            <p className="text-[10px] uppercase font-semibold text-text-tertiary">Valor</p>
            <p className="text-base font-bold text-accent truncate tabular-nums">
              {formatPrice(listing.offers[0]?.price || 0, listing.offers[0]?.type || 'venda')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Olá! Acessei o site da ${agencyName} e gostaria de informações sobre o imóvel: ${listing.title} (Cód: #${listing.id}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                aria-label="Falar no WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('agendamento')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 cursor-pointer"
            >
              Agendar Visita
            </button>
          </div>
        </aside>

        <GalleryDialog
        key={galleryOpen ? 'open' : 'closed'}
        images={images}
        title={listing.title}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </main>
  )
}
