'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, GripVertical, Image as ImageIcon, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadedImage {
  id?: string
  url: string
  file?: File
  is_cover: boolean
  ordem: number
}

interface ImageUploadProps {
  propertyId?: string
  existingImages?: UploadedImage[]
  onImagesChange?: (images: UploadedImage[]) => void
  maxImages?: number
  maxSizeMB?: number
}

export function ImageUpload({
  propertyId,
  existingImages = [],
  onImagesChange,
  maxImages = 20,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateImages = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages)
    onImagesChange?.(newImages)
  }, [onImagesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    )

    if (files.length === 0) {
      setError('Apenas imagens JPEG, PNG e WebP são permitidas')
      return
    }

    await processFiles(files)
  }, [images, propertyId])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      await processFiles(files)
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (inputRef.current) inputRef.current.value = ''
  }, [images, propertyId])

  async function processFiles(files: File[]) {
    const validFiles = files.filter((f) => f.size <= maxSizeMB * 1024 * 1024)
    if (validFiles.length < files.length) {
      setError(`Algumas imagens excedem o limite de ${maxSizeMB}MB`)
    }

    const remainingSlots = maxImages - images.length
    const filesToProcess = validFiles.slice(0, remainingSlots)

    if (propertyId) {
      // Upload direto para o Supabase Storage
      setUploading(true)
      try {
        const newImages: UploadedImage[] = []
        for (const file of filesToProcess) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('property_id', propertyId)

          const response = await fetch('/api/dashboard/properties/upload-image', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || 'Erro ao fazer upload')
          }

          const data = await response.json()
          newImages.push({
            id: data.id,
            url: data.url,
            is_cover: data.is_cover,
            ordem: data.ordem,
          })
        }
        updateImages([...images, ...newImages])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
      } finally {
        setUploading(false)
      }
    } else {
      // Sem propertyId ainda (novo imóvel): preview local, upload após criação
      const newImages: UploadedImage[] = filesToProcess.map((file) => ({
        url: URL.createObjectURL(file),
        file,
        is_cover: false,
        ordem: images.length + newImages.length,
      }))
      // Correção: calcular ordem corretamente
      const correctedImages = filesToProcess.map((file, idx) => ({
        url: URL.createObjectURL(file),
        file,
        is_cover: false,
        ordem: images.length + idx,
      }))
      updateImages([...images, ...correctedImages])
    }
  }

  async function removeImage(index: number) {
    const image = images[index]
    if (image.id && propertyId) {
      try {
        await fetch(`/api/dashboard/properties/upload-image?id=${image.id}`, {
          method: 'DELETE',
        })
      } catch {
        // Ignorar erro de exclusão remota
      }
    }
    // Revogar URL de objeto se for preview local
    if (image.file) {
      URL.revokeObjectURL(image.url)
    }
    const newImages = images.filter((_, i) => i !== index)
    updateImages(newImages)
  }

  async function setAsCover(index: number) {
    const newImages = images.map((img, i) => ({
      ...img,
      is_cover: i === index,
    }))
    updateImages(newImages)

    // Persistir no banco se já tiver ID
    const image = images[index]
    if (image.id) {
      try {
        await fetch('/api/dashboard/properties/upload-image', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: image.id, is_cover: true }),
        })
      } catch {
        // Ignorar erro
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Área de Drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-accent bg-accent/5'
            : 'border-border bg-secondary/50 hover:border-primary/30 hover:bg-secondary'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground">
          {uploading ? 'Enviando imagens...' : 'Arraste imagens ou clique para enviar'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, WebP até {maxSizeMB}MB cada (máx. {maxImages} imagens)
        </p>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Grid de Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={image.id || image.url}
              className={`group relative aspect-square overflow-hidden rounded-lg border ${
                image.is_cover ? 'border-accent ring-1 ring-accent' : 'border-border'
              } bg-secondary`}
            >
              <img
                src={image.url}
                alt={`Imagem ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Badge Cover */}
              {image.is_cover && (
                <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  <Star className="h-2.5 w-2.5" />
                  Capa
                </div>
              )}

              {/* Overlay com ações */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {!image.is_cover && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAsCover(index)
                    }}
                    className="rounded-md bg-white/90 p-1.5 text-xs font-medium text-foreground hover:bg-white"
                    title="Definir como capa"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className="rounded-md bg-red-500/90 p-1.5 text-white hover:bg-red-600"
                  title="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {images.length} de {maxImages} imagens adicionadas
        </p>
      )}
    </div>
  )
}