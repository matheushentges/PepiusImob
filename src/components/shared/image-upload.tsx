'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Loader2, Star, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLicenseEditable } from '@/components/licensing/license-mode-provider'

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
  maxSizeMB = 15,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editable = useLicenseEditable()

  // Sincroniza quando existingImages for carregado de forma assíncrona
  useEffect(() => {
    if (existingImages) {
      queueMicrotask(() => {
        setImages(existingImages)
      })
    }
  }, [existingImages])

  const updateImages = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages)
    onImagesChange?.(newImages)
  }, [onImagesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [editable])

  const processFiles = useCallback(async (files: File[]) => {
    if (!editable) return
    const validFiles = files.filter((f) => f.size <= maxSizeMB * 1024 * 1024)
    if (validFiles.length < files.length) {
      const oversized = files.find((f) => f.size > maxSizeMB * 1024 * 1024)
      const sizeFormatted = oversized ? `${(oversized.size / (1024 * 1024)).toFixed(1)} MB` : ''
      setError(`O arquivo selecionado ${sizeFormatted ? `(${sizeFormatted})` : ''} excede o limite máximo de ${maxSizeMB} MB.`)
    }
    if (validFiles.length === 0) return

    const remainingSlots = maxImages - images.length
    const filesToProcess = validFiles.slice(0, remainingSlots)

    if (propertyId) {
      // Upload direto para o Supabase Storage
      setUploading(true)
      setError(null)
      const newImages: UploadedImage[] = []
      let failures = 0
      let lastErrorMessage: string | null = null

      try {
        for (const file of filesToProcess) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('property_id', propertyId)

          const response = await fetch('/api/dashboard/properties/upload-image', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errData = await response.json().catch(() => null)
            failures += 1
            if (errData?.error) {
              lastErrorMessage = errData.error
            }
            continue
          }

          const data = await response.json()
          newImages.push({
            id: data.id,
            url: data.url,
            is_cover: data.is_cover,
            ordem: data.ordem,
          })
        }
        if (newImages.length > 0) updateImages([...images, ...newImages])
        if (failures > 0) {
          setError(lastErrorMessage || `${failures} ${failures === 1 ? 'imagem não foi enviada' : 'imagens não foram enviadas'}. Tente novamente.`)
        }
      } catch (err) {
        if (newImages.length > 0) updateImages([...images, ...newImages])
        setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
      } finally {
        setUploading(false)
      }
    } else {
      // Sem propertyId ainda (novo imóvel): preview local, upload após criação
      const correctedImages = filesToProcess.map((file, idx) => ({
        url: URL.createObjectURL(file),
        file,
        is_cover: false,
        ordem: images.length + idx,
      }))
      updateImages([...images, ...correctedImages])
    }
  }, [editable, images, maxImages, maxSizeMB, propertyId, updateImages])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    const isImageFile = (f: File) => {
      const mime = (f.type || '').toLowerCase()
      const name = (f.name || '').toLowerCase()
      return (
        ['image/jpeg', 'image/png', 'image/webp', 'image/x-png', 'image/pjpeg', 'image/jpg'].includes(mime) ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp')
      )
    }

    const files = Array.from(e.dataTransfer.files).filter(isImageFile)

    if (files.length === 0) {
      setError('Apenas imagens JPEG, PNG e WebP são permitidas')
      return
    }
    await processFiles(files)
  }, [editable, processFiles])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = Array.from(e.target.files || [])
    if (files.length > 0) await processFiles(files)
    if (inputRef.current) inputRef.current.value = ''
  }, [processFiles])

  async function removeImage(index: number) {
    if (!editable) return
    const image = images[index]
    setError(null)
    const deleteKey = image.id || String(index)
    setDeletingId(deleteKey)

    if (image.id && propertyId) {
      try {
        const response = await fetch(`/api/dashboard/properties/upload-image?id=${image.id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          setError('Não foi possível remover a imagem. Tente novamente.')
          setDeletingId(null)
          return
        }
      } catch {
        setError('Não foi possível remover a imagem. Tente novamente.')
        setDeletingId(null)
        return
      }
    }
    // Revogar URL de objeto se for preview local
    if (image.file) {
      URL.revokeObjectURL(image.url)
    }
    const newImages = images.filter((_, i) => i !== index)
    updateImages(newImages)
    setDeletingId(null)
  }

  async function setAsCover(index: number) {
    if (!editable) return
    const previous = images
    const newImages = images.map((img, i) => ({
      ...img,
      is_cover: i === index,
    }))
    setError(null)
    updateImages(newImages)

    // Persistir no banco se já tiver ID
    const image = images[index]
    if (image.id) {
      try {
        const response = await fetch('/api/dashboard/properties/upload-image', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: image.id, is_cover: true }),
        })
        if (!response.ok) {
          updateImages(previous)
          setError('Não foi possível definir a capa. Tente novamente.')
        }
      } catch {
        updateImages(previous)
        setError('Não foi possível definir a capa. Tente novamente.')
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
        onClick={() => editable && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          !editable ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${
          dragActive && editable
          ? 'border-accent bg-accent/5'
            : 'border-border bg-secondary/50 hover:border-primary/30 hover:bg-secondary'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/x-png,image/pjpeg,.png,.jpg,.jpeg,.webp"
          onChange={handleFileSelect}
          disabled={!editable}
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
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 text-red-600 hover:text-red-900 cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grid de Previews / Galeria do Imóvel */}
      {images.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Galeria de Fotos do Imóvel ({images.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Passe o cursor sobre a foto para definir como capa, visualizar em tela cheia ou excluir.
              </p>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {images.length} de {maxImages} fotos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((image, index) => {
              const isDeleting = deletingId === (image.id || String(index))
              return (
                <div
                  key={image.id || image.url}
                  className={`group relative aspect-square overflow-hidden rounded-lg border shadow-2xs transition-all ${
                    image.is_cover ? 'border-accent ring-2 ring-accent shadow-sm' : 'border-border hover:border-accent/40'
                  } bg-secondary`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  {/* Badge Capa */}
                  {image.is_cover && (
                    <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-xs">
                      <Star className="h-3 w-3 fill-current" />
                      Capa
                    </div>
                  )}

                  {/* Overlay com ações */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 transition-opacity ${
                      isDeleting ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                    }`}
                  >
                    {isDeleting ? (
                      <div className="flex flex-col items-center gap-1 text-white">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                        <span className="text-[10px] font-medium">Excluindo...</span>
                      </div>
                    ) : (
                      <>
                        {/* Botão Visualizar em tela cheia / zoom */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewIndex(index)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-white/95 text-xs font-medium text-foreground hover:bg-white shadow-xs transition-colors cursor-pointer"
                          title="Visualizar em tela cheia"
                          aria-label="Visualizar em tela cheia"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Botão Definir como Capa */}
                        {!image.is_cover && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAsCover(index)
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-black hover:bg-amber-300 shadow-xs transition-colors cursor-pointer"
                            title="Definir como capa principal"
                            aria-label="Definir como capa principal"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}

                        {/* Botão Remover/Excluir Imagem */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Deseja realmente excluir esta imagem do imóvel?')) {
                              removeImage(index)
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600/90 text-white hover:bg-red-600 shadow-xs transition-colors cursor-pointer"
                          title="Excluir imagem"
                          aria-label="Excluir imagem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal de visualização ampliada no Painel */}
      {previewIndex !== null && images[previewIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md select-none animate-in fade-in duration-200"
          onClick={() => setPreviewIndex(null)}
        >
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-xs text-white/70">
              {previewIndex + 1} de {images.length}
            </span>
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              aria-label="Fechar visualização"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1))
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0))
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[previewIndex].url}
              alt={`Foto ${previewIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            />
            {images[previewIndex].is_cover && (
              <span className="absolute bottom-3 left-3 rounded bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-md">
                Capa Principal
              </span>
            )}
          </div>
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
