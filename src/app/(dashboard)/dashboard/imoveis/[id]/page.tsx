'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/shared/image-upload'
import { useLicenseEditable } from '@/components/licensing/license-mode-provider'

interface Property {
  id: string
  titulo: string
  descricao: string
  tipo: string
  finalidade: string
  status: string
  featured: boolean
  preco_venda: number | null
  preco_locacao: number | null
  endereco: string
  cidade: string
  estado: string
  cep: string
  bairro: string
  area_total: number | null
  area_construida: number | null
  quartos: number | null
  banheiros: number | null
  vagas_garagem: number | null
  created_at: string
}

interface ExistingImage {
  id?: string
  url: string
  file?: File
  is_cover: boolean
  ordem: number
}

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function EditarImovelPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadWarning, setUploadWarning] = useState<number | null>(null)
  const editable = useLicenseEditable()

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/properties/${id}/images`)
      if (response.ok) {
        const data = await response.json()
        setExistingImages(data)
      }
    } catch {
      // Imagens são opcionais, não bloquear carregamento
    }
  }, [id])

  const fetchProperty = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/properties/${id}`)
      if (!response.ok) throw new Error('Erro ao carregar imóvel')
      const data = await response.json()
      setProperty(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const frame = requestAnimationFrame(() => {
      const warning = sessionStorage.getItem('pepius:upload-warning')
      if (warning) {
        sessionStorage.removeItem('pepius:upload-warning')
        setUploadWarning(Number(warning))
      }
      void fetchProperty()
      void fetchImages()
    })
    return () => cancelAnimationFrame(frame)
  }, [fetchImages, fetchProperty, id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data = {
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
      tipo: formData.get('tipo') as string,
      finalidade: formData.get('finalidade') as string,
      status: formData.get('status') as string,
      featured: formData.get('featured') === 'on',
      preco_venda: formData.get('preco_venda') ? parseFloat(formData.get('preco_venda') as string) : null,
      preco_locacao: formData.get('preco_locacao') ? parseFloat(formData.get('preco_locacao') as string) : null,
      endereco: formData.get('endereco') as string,
      cidade: formData.get('cidade') as string,
      estado: formData.get('estado') as string,
      cep: formData.get('cep') as string,
      bairro: formData.get('bairro') as string,
      area_total: formData.get('area_total') ? parseFloat(formData.get('area_total') as string) : null,
      area_construida: formData.get('area_construida') ? parseFloat(formData.get('area_construida') as string) : null,
      quartos: formData.get('quartos') ? parseInt(formData.get('quartos') as string) : null,
      banheiros: formData.get('banheiros') ? parseInt(formData.get('banheiros') as string) : null,
      vagas_garagem: formData.get('vagas_garagem') ? parseInt(formData.get('vagas_garagem') as string) : null,
    }

    try {
      const response = await fetch(`/api/dashboard/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar imóvel')
      }

      router.push('/dashboard/imoveis')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.')) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/properties/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir imóvel')
      }
      router.push('/dashboard/imoveis')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Imóvel não encontrado</p>
          <Link href="/dashboard/imoveis">
            <Button variant="outline" className="mt-4 h-9">Voltar para listagem</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header - Linha de Planta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/imoveis">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-secondary">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Editar Imóvel
            </h1>
            <p className="text-sm text-muted-foreground">
              Atualize as informações do imóvel
            </p>
          </div>
        </div>
      </div>

      {/* Form Card - Borders-only, bg-card */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <fieldset disabled={!editable} className="w-full space-y-8 border-0 p-0">
          {uploadWarning !== null && uploadWarning > 0 && (
            <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              O imóvel foi criado, mas {uploadWarning} {uploadWarning === 1 ? 'foto ficou pendente' : 'fotos ficaram pendentes'} de envio ou definição de capa. Revise as fotos abaixo para concluir o cadastro.
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Seção: Informações Básicas */}
          <section className="space-y-5">
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Informações Básicas
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="titulo" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Título *
                </Label>
                <Input id="titulo" name="titulo" required defaultValue={property.titulo} className="h-9 bg-input" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Descrição *
                </Label>
                <textarea
                  id="descricao"
                  name="descricao"
                  required
                  rows={3}
                  defaultValue={property.descricao}
                  className="w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo *</Label>
                <select id="tipo" name="tipo" required defaultValue={property.tipo} className={selectClassName}>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                  <option value="rural">Rural</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalidade" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Finalidade *</Label>
                <select id="finalidade" name="finalidade" required defaultValue={property.finalidade} className={selectClassName}>
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status *</Label>
                <select id="status" name="status" required defaultValue={property.status} className={selectClassName}>
                  <option value="disponivel">Disponível</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                  <option value="alugado">Alugado</option>
                </select>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  defaultChecked={property.featured}
                  className="mt-0.5 h-4 w-4 rounded border-input accent-[var(--accent)]"
                />
                <div>
                  <Label htmlFor="featured" className="text-sm font-medium text-foreground">
                    Destacar na vitrine
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Aparece primeiro na página inicial e recebe o selo de destaque.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção: Preço */}
          <section className="space-y-5">
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Preço</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preco_venda" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preço de Venda (R$)</Label>
                <Input id="preco_venda" name="preco_venda" type="number" step="0.01" min="0" defaultValue={property.preco_venda ?? ''} className="h-9 bg-input font-mono tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_locacao" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preço de Locação (R$/mês)</Label>
                <Input id="preco_locacao" name="preco_locacao" type="number" step="0.01" min="0" defaultValue={property.preco_locacao ?? ''} className="h-9 bg-input font-mono tabular-nums" />
              </div>
            </div>
          </section>

          {/* Seção: Localização */}
          <section className="space-y-5">
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Localização</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Endereço *</Label>
                <Input id="endereco" name="endereco" required defaultValue={property.endereco} className="h-9 bg-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bairro *</Label>
                <Input id="bairro" name="bairro" required defaultValue={property.bairro} className="h-9 bg-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cidade *</Label>
                <Input id="cidade" name="cidade" required defaultValue={property.cidade} className="h-9 bg-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado *</Label>
                <select id="estado" name="estado" required defaultValue={property.estado} className={selectClassName}>
                  <option value="SP">SP</option><option value="RJ">RJ</option><option value="MG">MG</option>
                  <option value="RS">RS</option><option value="PR">PR</option><option value="SC">SC</option>
                  <option value="BA">BA</option><option value="GO">GO</option><option value="DF">DF</option>
                  <option value="PE">PE</option><option value="CE">CE</option><option value="PA">PA</option>
                  <option value="AM">AM</option><option value="ES">ES</option><option value="MT">MT</option>
                  <option value="MS">MS</option><option value="MA">MA</option><option value="RN">RN</option>
                  <option value="PB">PB</option><option value="AL">AL</option><option value="SE">SE</option>
                  <option value="PI">PI</option><option value="TO">TO</option><option value="RO">RO</option>
                  <option value="AC">AC</option><option value="AP">AP</option><option value="RR">RR</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">CEP *</Label>
                <Input id="cep" name="cep" required defaultValue={property.cep} pattern="[0-9]{5}-[0-9]{3}" className="h-9 bg-input font-mono" />
              </div>
            </div>
          </section>

          {/* Seção: Características */}
          <section className="space-y-5">
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Características</h2>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="area_total" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Área Total (m²)</Label>
                <Input id="area_total" name="area_total" type="number" step="0.01" min="0" defaultValue={property.area_total ?? ''} className="h-9 bg-input font-mono tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_construida" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Área Construída (m²)</Label>
                <Input id="area_construida" name="area_construida" type="number" step="0.01" min="0" defaultValue={property.area_construida ?? ''} className="h-9 bg-input font-mono tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quartos" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quartos</Label>
                <Input id="quartos" name="quartos" type="number" min="0" defaultValue={property.quartos ?? ''} className="h-9 bg-input font-mono tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banheiros" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Banheiros</Label>
                <Input id="banheiros" name="banheiros" type="number" min="0" defaultValue={property.banheiros ?? ''} className="h-9 bg-input font-mono tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vagas_garagem" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vagas Garagem</Label>
                <Input id="vagas_garagem" name="vagas_garagem" type="number" min="0" defaultValue={property.vagas_garagem ?? ''} className="h-9 bg-input font-mono tabular-nums" />
              </div>
            </div>
          </section>

          {/* Seção: Imagens */}
          <section className="space-y-5">
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Imagens</h2>
            <ImageUpload
              propertyId={id}
              existingImages={existingImages}
              onImagesChange={setExistingImages}
              maxImages={20}
              maxSizeMB={5}
            />
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!editable || deleting || saving}
              className="h-10 sm:h-9 w-full sm:w-auto"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir
            </Button>
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="h-10 sm:h-9 w-full sm:w-auto"
                onClick={() => router.back()}
                disabled={saving || deleting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || deleting}
                className="h-10 sm:h-9 px-5 w-full sm:w-auto"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
          </fieldset>
        </form>
      </div>

      {/* System Info */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Informações do Sistema</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ID:</dt>
            <dd className="font-mono text-xs text-foreground">{property.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Criado em:</dt>
            <dd className="tabular-nums text-foreground">{new Date(property.created_at).toLocaleString('pt-BR')}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
