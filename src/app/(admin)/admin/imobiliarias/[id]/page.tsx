'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string
  nome: string
  slug: string
  email: string
  telefone: string | null
  active: boolean
  created_at: string
}

export default function EditarImobiliariaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchTenant()
    }
  }, [id])

  async function fetchTenant() {
    try {
      const response = await fetch(`/api/admin/tenants/${id}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar imobiliária')
      }

      const data = await response.json()
      setTenant(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      nome: formData.get('nome') as string,
      slug: formData.get('slug') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      active: tenant?.active ?? true,
    }

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar imobiliária')
      }

      router.push('/admin/imobiliarias')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja deletar esta imobiliária? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao deletar imobiliária')
      }

      router.push('/admin/imobiliarias')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleActive() {
    if (!tenant) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tenant,
          active: !tenant.active,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar status')
      }

      const updatedTenant = await response.json()
      setTenant(updatedTenant)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
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

  if (!tenant) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Imobiliária não encontrada</p>
          <Button
            className="mt-4 h-9"
            onClick={() => router.push('/admin/imobiliarias')}
          >
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header - Linha de Planta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/imobiliarias">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-secondary">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Editar Imobiliária
            </h1>
            <p className="text-sm text-muted-foreground">
              Atualize as informações da imobiliária
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status:
          </span>
          <Button
            size="sm"
            variant={tenant.active ? 'default' : 'outline'}
            onClick={handleToggleActive}
            disabled={saving}
            className="h-8"
          >
            {tenant.active ? 'Ativa' : 'Inativa'}
          </Button>
        </div>
      </div>

      {/* Form Card - Borders-only, bg-card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nome da Imobiliária *
              </Label>
              <Input
                id="nome"
                name="nome"
                required
                defaultValue={tenant.nome}
                placeholder="Ex: Imobiliária Exemplo"
                className="h-9 bg-input"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="slug" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Slug (URL) *
              </Label>
              <Input
                id="slug"
                name="slug"
                required
                defaultValue={tenant.slug}
                placeholder="imobiliaria-exemplo"
                pattern="[a-z0-9-]+"
                className="h-9 bg-input font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                E-mail *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={tenant.email}
                placeholder="contato@exemplo.com"
                className="h-9 bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Telefone
              </Label>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                defaultValue={tenant.telefone || ''}
                placeholder="(11) 99999-9999"
                className="h-9 bg-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="h-9"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </>
              )}
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving || deleting}
                className="h-9"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || deleting} className="h-9 px-5">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* System Info Card - Linha de Planta: border precisa, dados em mono */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Informações do Sistema</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ID:</dt>
            <dd className="font-mono text-xs text-foreground">{tenant.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Criada em:</dt>
            <dd className="tabular-nums text-foreground">{new Date(tenant.created_at).toLocaleString('pt-BR')}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}