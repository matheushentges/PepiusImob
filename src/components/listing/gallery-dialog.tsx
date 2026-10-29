'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GalleryDialogProps {
  images: string[]
  title: string
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function GalleryDialog({ images, title, isOpen, onClose, initialIndex = 0 }: GalleryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  // Sincroniza o índice inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setActiveIndex(initialIndex)
      })
    }
  }, [isOpen, initialIndex])

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
      document.body.style.overflow = 'hidden'
    } else {
      if (dialog.open) {
        dialog.close()
      }
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Suporte a teclado: Escape, ArrowLeft e ArrowRight
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext, onClose])

  // Handle native dialog close event (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      onClose()
      document.body.style.overflow = ''
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  if (!isOpen || images.length === 0) return null

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 h-screen w-screen max-h-screen max-w-none bg-black/95 backdrop-blur-md p-0 open:animate-in open:fade-in open:duration-200"
      aria-label={`Galeria de fotos: ${title}`}
    >
      <div className="flex h-full flex-col select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 bg-black/40">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent">
              Galeria de Fotos
            </span>
            <span className="text-white/40">•</span>
            <p className="text-sm font-medium text-white/80">
              {activeIndex + 1} de {images.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar galeria"
            className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main preview com setas de navegação */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
          {images.length > 1 && (
            <>
              {/* Seta Esquerda */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Foto anterior"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>

              {/* Seta Direita */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Próxima foto"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            </>
          )}

          {/* Imagem Central */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={images[activeIndex]}
            src={images[activeIndex]}
            alt={`${title} - foto ${activeIndex + 1}`}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-opacity duration-200 animate-in fade-in"
          />
        </div>

        {/* Thumbnail grid */}
        <div className="border-t border-white/10 bg-black/60 p-3 sm:p-4">
          <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {images.map((src, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  index === activeIndex
                    ? 'border-accent scale-105 shadow-md opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-90'
                }`}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  )
}
