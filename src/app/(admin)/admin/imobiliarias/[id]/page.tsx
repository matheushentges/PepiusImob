'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

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
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        </Card>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Imobiliária não encontrada</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/imobiliarias')}
          >
            Voltar
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Editar Imobiliária</h1>
          <p className="text-muted-foreground">
            Atualize as informações da imobiliária
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Status:
          </span>
          <Button
            size="sm"
            variant={tenant.active ? 'default' : 'outline'}
            onClick={handleToggleActive}
            disabled={saving}
          >
            {tenant.active ? 'Ativa' : 'Inativa'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Imobiliária *</Label>
            <Input
              id="nome"
              name="nome"
              required
              defaultValue={tenant.nome}
              placeholder="Ex: Imobiliária Exemplo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <Input
              id="slug"
              name="slug"
              required
              defaultValue={tenant.slug}
              placeholder="imobiliaria-exemplo"
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-muted-foreground">
              Apenas letras minúsculas, números e hífens
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={tenant.email}
              placeholder="contato@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              defaultValue={tenant.telefone || ''}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? 'Deletando...' : 'Deletar Imobiliária'}
            </Button>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving || deleting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Informações do Sistema</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ID:</dt>
            <dd className="font-mono">{tenant.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Criada em:</dt>
            <dd>{new Date(tenant.created_at).toLocaleString('pt-BR')}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
