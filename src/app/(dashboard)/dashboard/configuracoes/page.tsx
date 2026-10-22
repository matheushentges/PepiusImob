'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SiteConfig = {
  hero_title: string
  hero_subtitle: string
  primary_color: string
  accent_color: string
}

const defaults: SiteConfig = {
  hero_title: '',
  hero_subtitle: '',
  primary_color: '#334155',
  accent_color: '#E07A5F',
}

export default function ConfiguracoesPage() {
  const [siteName, setSiteName] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [form, setForm] = useState(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/dashboard/tenant', { cache: 'no-store' })
        if (!response.ok) throw new Error('Não foi possível carregar as configurações')
        const data = await response.json()
        setSiteName(data.nome)
        setCanEdit(data.can_edit === true)
        const saved = data.site_config ?? {}
        setForm({
          hero_title: typeof saved.hero_title === 'string' ? saved.hero_title : defaults.hero_title,
          hero_subtitle: typeof saved.hero_subtitle === 'string' ? saved.hero_subtitle : defaults.hero_subtitle,
          primary_color: typeof saved.primary_color === 'string' ? saved.primary_color : defaults.primary_color,
          accent_color: typeof saved.accent_color === 'string' ? saved.accent_color : defaults.accent_color,
        })
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erro ao carregar as configurações')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const response = await fetch('/api/dashboard/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_config: form }),
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Não foi possível salvar')
      setSuccess(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao salvar as configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-lg bg-muted" />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Configurações da vitrine</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalize a página pública de {siteName}.</p>
      </header>
      <form onSubmit={submit} className="space-y-6 rounded-lg border border-border bg-card p-4 sm:p-6">
        {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {success && <p role="status" className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">Configurações salvas.</p>}
        <div className="space-y-2">
          <Label htmlFor="hero_title">Título principal</Label>
          <Input id="hero_title" disabled={!canEdit} maxLength={100} value={form.hero_title} onChange={(event) => setForm({ ...form, hero_title: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hero_subtitle">Descrição</Label>
          <textarea id="hero_subtitle" disabled={!canEdit} maxLength={300} rows={3} value={form.hero_subtitle} onChange={(event) => setForm({ ...form, hero_subtitle: event.target.value })} className="w-full rounded-md border border-input bg-input px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {(['primary_color', 'accent_color'] as const).map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{key === 'primary_color' ? 'Cor primária' : 'Cor de destaque'}</Label>
              <div className="flex gap-3">
                <input id={key} type="color" disabled={!canEdit} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="h-10 w-14 rounded border border-input bg-input p-1 disabled:cursor-not-allowed" />
                <Input disabled={!canEdit} maxLength={7} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-border pt-5">
          <Button type="submit" disabled={saving || !canEdit} className="h-10 sm:h-9 w-full sm:w-auto gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar configurações
          </Button>
        </div>
      </form>
    </div>
  )
}
