'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Globe, Palette, Type, Image as ImageIcon } from 'lucide-react'

interface SiteConfig {
  logo_url?: string
  hero_title?: string
  hero_subtitle?: string
  primary_color?: string
  accent_color?: string
  whatsapp_enabled?: boolean
  google_calendar_enabled?: boolean
}

interface Tenant {
  id: string
  nome: string
  subdomain: string | null
  custom_domain: string | null
  domain_verified: boolean
  site_config: SiteConfig
}

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    subdomain: '',
    custom_domain: '',
    hero_title: '',
    hero_subtitle: '',
    primary_color: '#334155',
    accent_color: '#E07A5F',
    whatsapp_enabled: false,
    google_calendar_enabled: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchTenant()
  }, [])

  async function fetchTenant() {
    try {
      const response = await fetch('/api/dashboard/tenant')
      if (!response.ok) throw new Error('Erro ao carregar configurações')
      const data = await response.json()
      setTenant(data)
      setFormData({
        subdomain: data.subdomain || '',
        custom_domain: data.custom_domain || '',
        hero_title: data.site_config?.hero_title || '',
        hero_subtitle: data.site_config?.hero_subtitle || '',
        primary_color: data.site_config?.primary_color || '#334155',
        accent_color: data.site_config?.accent_color || '#E07A5F',
        whatsapp_enabled: data.site_config?.whatsapp_enabled || false,
        google_calendar_enabled: data.site_config?.google_calendar_enabled || false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/dashboard/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: formData.subdomain || null,
          custom_domain: formData.custom_domain || null,
          site_config: {
            hero_title: formData.hero_title,
            hero_subtitle: formData.hero_subtitle,
            primary_color: formData.primary_color,
            accent_color: formData.accent_color,
            whatsapp_enabled: formData.whatsapp_enabled,
            google_calendar_enabled: formData.google_calendar_enabled,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar configurações')
      }

      setSuccess('Configurações salvas com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header - Linha de Planta */}
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          Configurações do Site
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize o site público da sua imobiliária e gerencie integrações
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {/* Seção: Domínio e Acesso */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Domínio e Acesso
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subdomain" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subdomínio
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="minha-imobiliaria"
                  className="h-9 bg-input font-mono text-sm"
                />
                <span className="shrink-0 text-sm text-muted-foreground">.pepius.com</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Seu site ficará acessível em: <strong>{formData.subdomain || '...'}{'.pepius.com'}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_domain" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Domínio Próprio (opcional)
              </Label>
              <Input
                id="custom_domain"
                value={formData.custom_domain}
                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                placeholder="www.minhaimobiliaria.com.br"
                className="h-9 bg-input font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Configure um CNAME apontando para <code className="rounded bg-secondary px-1 text-[10px]">pepius.com</code> no seu DNS
              </p>
            </div>
          </div>
        </div>

        {/* Seção: Aparência do Site */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
            <Palette className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Aparência do Site
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary_color" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cor Primária
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primary_color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-input p-0.5"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="h-9 flex-1 bg-input font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent_color" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cor de Destaque (Accent)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="accent_color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-input p-0.5"
                />
                <Input
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="h-9 flex-1 bg-input font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Textos do Site */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
            <Type className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Textos do Site
            </h2>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="hero_title" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Título Principal (Hero)
              </Label>
              <Input
                id="hero_title"
                value={formData.hero_title}
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                placeholder="Encontre o imóvel dos seus sonhos"
                className="h-9 bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_subtitle" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subtítulo / Descrição
              </Label>
              <textarea
                id="hero_subtitle"
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                placeholder="Milhares de imóveis para venda e locação com atendimento inteligente."
                rows={3}
                className="w-full rounded-md border border-input bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Seção: Integrações */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Integrações
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-md border border-border p-4 transition-colors hover:bg-secondary/50">
              <input
                type="checkbox"
                checked={formData.whatsapp_enabled}
                onChange={(e) => setFormData({ ...formData, whatsapp_enabled: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">WhatsApp Business API</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ative para receber mensagens de clientes diretamente no Inbox. Requer configuração de API Key nas integrações avançadas.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-md border border-border p-4 transition-colors hover:bg-secondary/50">
              <input
                type="checkbox"
                checked={formData.google_calendar_enabled}
                onChange={(e) => setFormData({ ...formData, google_calendar_enabled: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Google Calendar</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sincronize visitas e compromissos com sua agenda do Google. Cada corretor poderá conectar sua própria conta.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={saving} className="h-9 gap-2 px-6">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  )
}