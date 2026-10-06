'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string
  nome: string
  slug: string
  email: string
  telefone: string
  logo_url?: string
  active: boolean
  license_expires_at?: string
}

export default function EditarImobiliariaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    email: '',
    telefone: '',
    logo_url: '',
    active: true,
  })

  useEffect(() => {
    fetchTenant()
  }, [id])

  async function fetchTenant() {
    try {
      const response = await fetch(`/api/admin/tenants/${id}`)
      if (!response.ok) throw new Error('Erro ao buscar imobiliária')

      const data = await response.json()
      setTenant(data)
      setFormData({
        nome: data.nome || '',
        slug: data.slug || '',
        email: data.email || '',
        telefone: data.telefone || '',
        logo_url: data.logo_url || '',
        active: data.active ?? true,
      })
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao carregar imobiliária')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar')
      }

      alert('Imobiliária atualizada com sucesso!')
      router.push('/admin/imobiliarias')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao atualizar imobiliária')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta imobiliária? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir')
      }

      alert('Imobiliária excluída com sucesso!')
      router.push('/admin/imobiliarias')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao excluir imobiliária')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Imobiliária não encontrada</p>
        <Link href="/admin/imobiliarias">
          <Button variant="link">Voltar para listagem</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/imobiliarias">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Imobiliária</h1>
          <p className="text-muted-foreground">Atualize as informações da imobiliária</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Imobiliária</CardTitle>
          <CardDescription>Preencha os dados abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL amigável) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  required
                  pattern="[a-z0-9-]+"
                  title="Apenas letras minúsculas, números e hífens"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logo_url">URL do Logo (opcional)</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <select
                  id="active"
                  value={formData.active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
              <Link href="/admin/imobiliarias">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="ml-auto"
              >
                Excluir Imobiliária
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
