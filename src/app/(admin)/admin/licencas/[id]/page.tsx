'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface License {
  id: string
  tenant_id: string
  plano: string
  valor: number
  inicio: string
  fim: string
  active: boolean
}

interface Tenant {
  id: string
  nome: string
}

export default function EditarLicencaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [license, setLicense] = useState<License | null>(null)
  const [formData, setFormData] = useState({
    tenant_id: '',
    plano: 'basico',
    valor: '',
    inicio: '',
    fim: '',
    active: true,
  })

  useEffect(() => {
    fetchTenants()
    fetchLicense()
  }, [id])

  async function fetchTenants() {
    try {
      const response = await fetch('/api/admin/tenants')
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error('Erro ao buscar imobiliárias:', error)
    }
  }

  async function fetchLicense() {
    try {
      const response = await fetch(`/api/admin/licenses/${id}`)
      if (!response.ok) throw new Error('Erro ao buscar licença')

      const data = await response.json()
      setLicense(data)
      setFormData({
        tenant_id: data.tenant_id || '',
        plano: data.plano || 'basico',
        valor: data.valor?.toString() || '',
        inicio: data.inicio?.split('T')[0] || '',
        fim: data.fim?.split('T')[0] || '',
        active: data.active ?? true,
      })
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao carregar licença')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/licenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar')
      }

      alert('Licença atualizada com sucesso!')
      router.push('/admin/licencas')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao atualizar licença')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta licença? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/licenses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir')
      }

      alert('Licença excluída com sucesso!')
      router.push('/admin/licencas')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao excluir licença')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!license) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Licença não encontrada</p>
          <Link href="/admin/licencas">
            <Button variant="outline" className="mt-4 h-9">Voltar para listagem</Button>
          </Link>
        </div>
      </div>
    )
  }

  const selectClassName = "flex h-9 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header - Linha de Planta */}
      <div className="flex items-center gap-4">
        <Link href="/admin/licencas">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-secondary">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Editar Licença
          </h1>
          <p className="text-sm text-muted-foreground">Atualize as informações da licença</p>
        </div>
      </div>

      {/* Form Card - Borders-only, bg-card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tenant_id" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Imobiliária *
              </Label>
              <select
                id="tenant_id"
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                required
                className={selectClassName}
              >
                <option value="">Selecione...</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Plano *
              </Label>
              <select
                id="plano"
                value={formData.plano}
                onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                required
                className={selectClassName}
              >
                <option value="basico">Básico</option>
                <option value="profissional">Profissional</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Valor (R$) *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
                className="h-9 bg-input font-mono tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inicio" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Data de Início *
              </Label>
              <Input
                id="inicio"
                type="date"
                value={formData.inicio}
                onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                required
                className="h-9 bg-input tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fim" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Data de Fim *
              </Label>
              <Input
                id="fim"
                type="date"
                value={formData.fim}
                onChange={(e) => setFormData({ ...formData, fim: e.target.value })}
                required
                className="h-9 bg-input tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </Label>
              <select
                id="active"
                value={formData.active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                className={selectClassName}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="h-9"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Licença
            </Button>

            <div className="flex gap-3">
              <Link href="/admin/licencas">
                <Button type="button" variant="outline" className="h-9">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="h-9 px-5">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}