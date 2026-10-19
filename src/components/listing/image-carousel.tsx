'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageCarouselProps {
  images: string[]
  title: string
  onOpenGallery?: () => void
}

export function ImageCarousel({ images, title, onOpenGallery }: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (images.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Carousel container */}
      <div className="relative overflow-hidden rounded-lg bg-surface-overlay" ref={emblaRef}>
        <div className="flex">
          {images.map((src, index) => (
            <div key={index} className="min-w-0 flex-[0_0_100%]">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={src}
                  alt={`${title} - foto ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {canScrollPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-base/80 text-text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollNext && (
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-base/80 text-text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Gallery button overlay */}
        {onOpenGallery && images.length > 1 && (
          <button
            type="button"
            onClick={onOpenGallery}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-surface-base/80 px-3 py-1.5 text-xs font-medium text-text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            Ver todas as fotos ({images.length})
          </button>
        )}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Fotos do imóvel">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                index === selectedIndex
                  ? 'w-6 bg-accent'
                  : 'w-2 bg-border-default hover:bg-border-strong'
              }`}
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`Ir para foto ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}