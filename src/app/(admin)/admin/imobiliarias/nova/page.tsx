'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NovaImobiliariaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      nome: formData.get('nome') as string,
      slug: formData.get('slug') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
    }

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar imobiliária')
      }

      router.push('/admin/imobiliarias')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header - Linha de Planta */}
      <div className="flex items-center gap-4">
        <Link href="/admin/imobiliarias">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-secondary">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Nova Imobiliária
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre uma nova imobiliária no sistema
          </p>
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
                placeholder="(11) 99999-9999"
                className="h-9 bg-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-6">
            <Button type="submit" disabled={loading} className="h-9 px-5">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Imobiliária
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}