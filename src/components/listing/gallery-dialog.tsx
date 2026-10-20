'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
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

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      setActiveIndex(initialIndex)
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
  }, [isOpen, initialIndex])

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

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 h-screen w-screen max-h-screen max-w-none bg-surface-base/95 backdrop-blur-sm p-0 open:animate-in open:fade-in open:duration-200"
      aria-label={`Galeria de fotos: ${title}`}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6">
          <p className="text-sm font-medium text-text-secondary">
            {activeIndex + 1} de {images.length}
          </p>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar galeria">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main preview */}
        <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
          <img
            src={images[activeIndex]}
            alt={`${title} - foto ${activeIndex + 1}`}
            className="max-h-full max-w-full object-contain rounded-md"
          />
        </div>

        {/* Thumbnail grid */}
        <div className="border-t border-border-subtle bg-surface-overlay/30 p-3 sm:p-4">
          <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {images.map((src, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  index === activeIndex
                    ? 'border-accent'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              >
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