'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BrandAssetUploaderProps {
  type: 'logo' | 'favicon'
  title: string
  description: string
  currentUrl?: string | null
  disabled?: boolean
  onUploaded: (path: string) => void
  onRemoved: () => void
}

export function BrandAssetUploader({
  type,
  title,
  description,
  currentUrl,
  disabled = false,
  onUploaded,
  onRemoved,
}: BrandAssetUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/dashboard/tenant/upload-brand-asset', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar a imagem')
      }

      onUploaded(data.path)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no envio')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Arquivo atualizado com sucesso! Lembre-se de salvar as configurações.</span>
        </div>
      )}

      {currentUrl ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-border/80 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-24 items-center justify-center rounded-md border border-border bg-background p-1.5 shadow-2xs overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt={title}
                className={type === 'favicon' ? 'h-8 w-8 object-contain' : 'h-full w-full object-contain'}
              />
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground">Arquivo ativo</span>
              <p className="text-[11px] text-muted-foreground">Exibido na vitrine da imobiliária</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs gap-1.5 flex-1 sm:flex-initial"
            >
              <Upload className="h-3.5 w-3.5" />
              Substituir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || uploading}
              onClick={onRemoved}
              className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-secondary/20 p-6 text-center transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-secondary/40 hover:border-accent/50'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-2">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <ImageIcon className="h-5 w-5" />}
          </div>
          <p className="text-xs font-semibold text-foreground">
            {uploading ? 'Processando e enviando...' : 'Clique para selecionar o arquivo'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {type === 'logo'
              ? 'Formatos aceitos: PNG, WebP ou JPEG (Recomendado: 800×400px com fundo transparente)'
              : 'Formatos aceitos: PNG ou WebP (Recomendado: 64×64px quadrado)'}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={type === 'logo' ? 'image/png,image/jpeg,image/webp' : 'image/png,image/webp'}
        disabled={disabled || uploading}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
