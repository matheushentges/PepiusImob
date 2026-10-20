'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string
  nome: string
}

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    telefone: '',
    role: 'imobiliaria_user',
    tenant_id: '',
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  async function fetchTenants() {
    try {
      const response = await fetch('/api/admin/tenants')
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error('Erro ao buscar imobiliárias:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }

      alert('Usuário criado com sucesso!')
      router.push('/admin/usuarios')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  const needsTenant = formData.role !== 'admin'
  const selectClassName = "flex h-9 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header - Linha de Planta */}
      <div className="flex items-center gap-4">
        <Link href="/admin/usuarios">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-secondary">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Novo Usuário
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo usuário no sistema
          </p>
        </div>
      </div>

      {/* Form Card - Borders-only, bg-card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="h-9 bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-9 bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Senha *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="h-9 bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Função *
              </Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value, tenant_id: e.target.value === 'admin' ? '' : formData.tenant_id })}
                required
                className={selectClassName}
              >
                <option value="admin">Admin</option>
                <option value="imobiliaria_owner">Dono da Imobiliária</option>
                <option value="imobiliaria_user">Usuário da Imobiliária</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="h-9 bg-input"
              />
            </div>

            {needsTenant && (
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
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-6">
            <Button type="submit" disabled={loading} className="h-9 px-5">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
            <Link href="/admin/usuarios">
              <Button type="button" variant="outline" className="h-9">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}