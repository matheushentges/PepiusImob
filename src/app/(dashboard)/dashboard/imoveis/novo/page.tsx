'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/shared/image-upload'
import { useLicenseEditable } from '@/components/licensing/license-mode-provider'
import { formatCep, fetchAddressByCep } from '@/lib/cep/viacep'

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

interface PendingImage {
  url: string
  file?: File
  is_cover: boolean
  ordem: number
}

export default function NovoImovelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const editable = useLicenseEditable()

  // Estados controlados para preenchimento automático por CEP
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepFeedback, setCepFeedback] = useState<string | null>(null)

  async function handleCepChange(value: string) {
    const formatted = formatCep(value)
    setCep(formatted)
    setCepFeedback(null)

    const raw = formatted.replace(/\D/g, '')
    if (raw.length === 8) {
      setCepLoading(true)
      try {
        const address = await fetchAddressByCep(raw)
        if (address) {
          if (address.endereco) setEndereco(address.endereco)
          if (address.bairro) setBairro(address.bairro)
          if (address.cidade) setCidade(address.cidade)
          if (address.estado) setEstado(address.estado)
          setCepFeedback('Endereço preenchido automaticamente pelo CEP.')
        } else {
          setCepFeedback('CEP não encontrado. Preencha o endereço manualmente.')
        }
      } catch {
        setCepFeedback('Não foi possível consultar o CEP. Preencha manualmente.')
      } finally {
        setCepLoading(false)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
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
      const response = await fetch('/api/dashboard/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar imóvel')
      }

      const createdProperty = await response.json()

      // Upload das imagens pendentes (preview local) após criação do imóvel
      let failedUploads = 0
      for (const img of pendingImages) {
        if (!img.file) continue
        const uploadData = new FormData()
        uploadData.append('file', img.file)
        uploadData.append('property_id', createdProperty.id)
        try {
          const uploadRes = await fetch('/api/dashboard/properties/upload-image', {
            method: 'POST',
            body: uploadData,
          })
          if (!uploadRes.ok) {
            failedUploads += 1
            continue
          }
          if (img.is_cover) {
            const uploaded = await uploadRes.json()
            const coverRes = await fetch('/api/dashboard/properties/upload-image', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: uploaded.id, is_cover: true }),
            })
            if (!coverRes.ok) failedUploads += 1
          }
        } catch {
          failedUploads += 1
        }
      }

      if (failedUploads > 0) {
        sessionStorage.setItem('pepius:upload-warning', String(failedUploads))
        router.push(`/dashboard/imoveis/${createdProperty.id}`)
        router.refresh()
        return
      }

      router.push('/dashboard/imoveis')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header - Linha de Planta */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/imoveis">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-secondary">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Novo Imóvel
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo imóvel no portfólio
          </p>
        </div>
      </div>

      {/* Form Card - Borders-only, bg-card */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <fieldset disabled={!editable} className="w-full space-y-8 border-0 p-0">
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
                <Input
                  id="titulo"
                  name="titulo"
                  required
                  placeholder="Ex: Casa moderna com piscina"
                  className="h-9 bg-input"
                />
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
                  placeholder="Descreva o imóvel em detalhes..."
                  className="w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tipo *
                </Label>
                <select id="tipo" name="tipo" required className={selectClassName}>
                  <option value="">Selecione...</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                  <option value="rural">Rural</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalidade" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Finalidade *
                </Label>
                <select id="finalidade" name="finalidade" required className={selectClassName}>
                  <option value="">Selecione...</option>
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status *
                </Label>
                <select id="status" name="status" required className={selectClassName}>
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
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Preço
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preco_venda" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preço de Venda (R$)
                </Label>
                <Input
                  id="preco_venda"
                  name="preco_venda"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="h-9 bg-input font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco_locacao" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preço de Locação (R$/mês)
                </Label>
                <Input
                  id="preco_locacao"
                  name="preco_locacao"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="h-9 bg-input font-mono tabular-nums"
                />
              </div>
            </div>
          </section>

          {/* Seção: Localização */}
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Localização
              </h2>
              {cepFeedback && (
                <span className="text-xs font-medium text-accent">
                  {cepFeedback}
                </span>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cep" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    CEP *
                  </Label>
                  {cepLoading && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      Consultando CEP...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="cep"
                    name="cep"
                    required
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="h-9 bg-input font-mono max-w-xs"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Digite os 8 números do CEP para autopreencher rua, bairro, cidade e estado.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Endereço *
                </Label>
                <Input
                  id="endereco"
                  name="endereco"
                  required
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua Exemplo, 123"
                  className="h-9 bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Bairro *
                </Label>
                <Input
                  id="bairro"
                  name="bairro"
                  required
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Centro"
                  className="h-9 bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cidade *
                </Label>
                <Input
                  id="cidade"
                  name="cidade"
                  required
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="São Paulo"
                  className="h-9 bg-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Estado *
                </Label>
                <select
                  id="estado"
                  name="estado"
                  required
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">UF...</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="RS">RS</option>
                  <option value="PR">PR</option>
                  <option value="SC">SC</option>
                  <option value="BA">BA</option>
                  <option value="GO">GO</option>
                  <option value="DF">DF</option>
                  <option value="PE">PE</option>
                  <option value="CE">CE</option>
                  <option value="PA">PA</option>
                  <option value="AM">AM</option>
                  <option value="ES">ES</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MA">MA</option>
                  <option value="RN">RN</option>
                  <option value="PB">PB</option>
                  <option value="AL">AL</option>
                  <option value="SE">SE</option>
                  <option value="PI">PI</option>
                  <option value="TO">TO</option>
                  <option value="RO">RO</option>
                  <option value="AC">AC</option>
                  <option value="AP">AP</option>
                  <option value="RR">RR</option>
                </select>
              </div>
            </div>
          </section>

          {/* Seção: Características */}
          <section className="space-y-5">
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Características
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="area_total" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Área Total (m²)
                </Label>
                <Input
                  id="area_total"
                  name="area_total"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="h-9 bg-input font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_construida" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Área Construída (m²)
                </Label>
                <Input
                  id="area_construida"
                  name="area_construida"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="h-9 bg-input font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quartos" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quartos
                </Label>
                <Input
                  id="quartos"
                  name="quartos"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-9 bg-input font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banheiros" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Banheiros
                </Label>
                <Input
                  id="banheiros"
                  name="banheiros"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-9 bg-input font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vagas_garagem" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Vagas Garagem
                </Label>
                <Input
                  id="vagas_garagem"
                  name="vagas_garagem"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-9 bg-input font-mono tabular-nums"
                />
              </div>
            </div>
          </section>

          {/* Seção: Imagens */}
          <section className="space-y-5">
            <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Imagens
            </h2>
            <ImageUpload
              propertyId={undefined}
              existingImages={pendingImages}
              onImagesChange={setPendingImages}
              maxImages={20}
              maxSizeMB={5}
            />
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              className="h-10 sm:h-9 w-full sm:w-auto"
              onClick={() => router.back()}
              disabled={!editable}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!editable || loading} className="h-10 sm:h-9 px-5 w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Imóvel
            </Button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  )
}
