'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  tenant_id: string | null
  role: string
  nome: string
  email: string
  telefone: string | null
}

interface Tenant {
  id: string
  nome: string
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'imobiliaria_user',
    tenant_id: '',
  })

  useEffect(() => {
    fetchTenants()
    fetchProfile()
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

  async function fetchProfile() {
    try {
      const response = await fetch(`/api/admin/users/${id}`)
      if (!response.ok) throw new Error('Erro ao buscar usuário')

      const data = await response.json()
      setProfile(data)
      setFormData({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        role: data.role || 'imobiliaria_user',
        tenant_id: data.tenant_id || '',
      })
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao carregar usuário')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar')
      }

      alert('Usuário atualizado com sucesso!')
      router.push('/admin/usuarios')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao atualizar usuário')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir')
      }

      alert('Usuário excluído com sucesso!')
      router.push('/admin/usuarios')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao excluir usuário')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Usuário não encontrado</p>
        <Link href="/admin/usuarios">
          <Button variant="link">Voltar para listagem</Button>
        </Link>
      </div>
    )
  }

  const needsTenant = formData.role !== 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/usuarios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Usuário</h1>
          <p className="text-muted-foreground">Atualize as informações do usuário</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>Preencha os dados abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, tenant_id: e.target.value === 'admin' ? '' : formData.tenant_id })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="admin">Admin</option>
                  <option value="imobiliaria_owner">Dono da Imobiliária</option>
                  <option value="imobiliaria_user">Usuário da Imobiliária</option>
                  <option value="cliente">Cliente</option>
                </select>
              </div>

              {needsTenant && (
                <div className="space-y-2">
                  <Label htmlFor="tenant_id">Imobiliária *</Label>
                  <select
                    id="tenant_id"
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
              <Link href="/admin/usuarios">
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
                Excluir Usuário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
