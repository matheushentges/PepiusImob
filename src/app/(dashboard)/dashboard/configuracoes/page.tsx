'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  Save,
  Building2,
  Palette,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CalendarDays,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPresets } from '@/components/dashboard/branding/color-presets'
import { BrandAssetUploader } from '@/components/dashboard/branding/brand-asset-uploader'
import { FeaturedPropertiesManager } from '@/components/dashboard/branding/featured-properties-manager'
import { CalendarSettingsTab } from '@/components/dashboard/branding/calendar-settings-tab'
import type { SiteConfigInput } from '@/lib/tenant/validation'

type TabKey = 'marca' | 'cores' | 'contato' | 'vitrine' | 'agenda'

const defaultSiteConfig: SiteConfigInput = {
  creci: '',
  slogan: '',
  logo_url: null,
  favicon_url: null,
  primary_color: '#334155',
  accent_color: '#E07A5F',
  hero_title: 'Encontre seu próximo imóvel',
  hero_subtitle: 'Explore imóveis para venda e locação e encontre um lugar que combina com seus planos.',
  whatsapp: '',
  telefone: '',
  email_contato: '',
  endereco_completo: '',
  redes_sociais: {
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
  },
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('marca')
  const [siteName, setSiteName] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [siteConfig, setSiteConfig] = useState<SiteConfigInput>(defaultSiteConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab')
      if (tabParam === 'agenda') {
        setActiveTab('agenda')
      }
    }
    void (async () => {
      try {
        const response = await fetch('/api/dashboard/tenant', { cache: 'no-store' })
        if (!response.ok) throw new Error('Não foi possível carregar as configurações')
        const data = await response.json()
        setSiteName(data.nome || '')
        setCanEdit(data.can_edit === true)

        const saved = data.site_config ?? {}
        setSiteConfig({
          creci: typeof saved.creci === 'string' ? saved.creci : defaultSiteConfig.creci,
          slogan: typeof saved.slogan === 'string' ? saved.slogan : defaultSiteConfig.slogan,
          logo_url: typeof saved.logo_url === 'string' ? saved.logo_url : defaultSiteConfig.logo_url,
          favicon_url: typeof saved.favicon_url === 'string' ? saved.favicon_url : defaultSiteConfig.favicon_url,
          primary_color: typeof saved.primary_color === 'string' ? saved.primary_color : defaultSiteConfig.primary_color,
          accent_color: typeof saved.accent_color === 'string' ? saved.accent_color : defaultSiteConfig.accent_color,
          hero_title: typeof saved.hero_title === 'string' ? saved.hero_title : defaultSiteConfig.hero_title,
          hero_subtitle: typeof saved.hero_subtitle === 'string' ? saved.hero_subtitle : defaultSiteConfig.hero_subtitle,
          whatsapp: typeof saved.whatsapp === 'string' ? saved.whatsapp : defaultSiteConfig.whatsapp,
          telefone: typeof saved.telefone === 'string' ? saved.telefone : defaultSiteConfig.telefone,
          email_contato: typeof saved.email_contato === 'string' ? saved.email_contato : defaultSiteConfig.email_contato,
          endereco_completo: typeof saved.endereco_completo === 'string' ? saved.endereco_completo : defaultSiteConfig.endereco_completo,
          redes_sociais: {
            instagram: typeof saved.redes_sociais?.instagram === 'string' ? saved.redes_sociais.instagram : '',
            facebook: typeof saved.redes_sociais?.facebook === 'string' ? saved.redes_sociais.facebook : '',
            linkedin: typeof saved.redes_sociais?.linkedin === 'string' ? saved.redes_sociais.linkedin : '',
            youtube: typeof saved.redes_sociais?.youtube === 'string' ? saved.redes_sociais.youtube : '',
          },
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
    if (!canEdit || saving) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/dashboard/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: siteName.trim(),
          site_config: siteConfig,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar as configurações')

      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao salvar as configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Central de Marca & Vitrine
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gerencie a identidade visual, contatos comerciais e curadoria da vitrine pública.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          <span>Ver Vitrine Pública</span>
          <ExternalLink className="h-3.5 w-3.5 text-accent" />
        </Link>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-1.5 border-b border-border/80 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('marca')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'marca'
              ? 'border-accent text-accent bg-accent/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Marca & Logotipo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cores')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'cores'
              ? 'border-accent text-accent bg-accent/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Cores & Estilo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contato')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'contato'
              ? 'border-accent text-accent bg-accent/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          <span>Contatos & Redes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vitrine')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'vitrine'
              ? 'border-accent text-accent bg-accent/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Home & Destaques</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'agenda'
              ? 'border-accent text-accent bg-accent/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Agendamento & Google</span>
        </button>
      </div>

      {activeTab === 'agenda' ? (
        <CalendarSettingsTab />
      ) : (
        <form onSubmit={submit} className="space-y-6">
        {/* Alertas de Feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 p-3.5 text-xs font-medium text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Configurações salvas e aplicadas à vitrine pública com sucesso!</span>
          </div>
        )}

        {!canEdit && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
            Apenas o responsável da imobiliária (proprietário) pode alterar as configurações da empresa.
          </div>
        )}

        {/* Conteúdo da Aba 1: Marca & Logotipo */}
        {activeTab === 'marca' && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-7 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-foreground">Identidade Institucional</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Defina o nome oficial, CRECI profissional e os arquivos de imagem da sua marca.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs font-semibold">
                  Nome da Imobiliária <span className="text-accent">*</span>
                </Label>
                <Input
                  id="nome"
                  disabled={!canEdit}
                  maxLength={120}
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Ex: Morada Nobre Imóveis"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creci" className="text-xs font-semibold">
                  Registro Profissional (CRECI PJ / PF)
                </Label>
                <Input
                  id="creci"
                  disabled={!canEdit}
                  maxLength={40}
                  value={siteConfig.creci ?? ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, creci: e.target.value })}
                  placeholder="Ex: CRECI 12.345-J"
                />
                <p className="text-[11px] text-muted-foreground">
                  Obrigatório para conformidade legal com o COFECI/CRECI.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slogan" className="text-xs font-semibold">
                Slogan ou Frase Institucional
              </Label>
              <Input
                id="slogan"
                disabled={!canEdit}
                maxLength={160}
                value={siteConfig.slogan ?? ''}
                onChange={(e) => setSiteConfig({ ...siteConfig, slogan: e.target.value })}
                placeholder="Ex: Especialistas em encontrar o imóvel ideal para a sua história."
              />
            </div>

            <div className="pt-4 border-t border-border/70 space-y-5">
              <BrandAssetUploader
                type="logo"
                title="Logotipo Principal da Imobiliária"
                description="Exibido com destaque no cabeçalho e rodapé da vitrine pública."
                currentUrl={siteConfig.logo_url}
                disabled={!canEdit}
                onUploaded={(path) => setSiteConfig({ ...siteConfig, logo_url: path })}
                onRemoved={() => setSiteConfig({ ...siteConfig, logo_url: null })}
              />

              <BrandAssetUploader
                type="favicon"
                title="Favicon (Ícone da Aba do Navegador)"
                description="Exibido na aba do navegador ao lado do título da página (formato quadrado 64×64)."
                currentUrl={siteConfig.favicon_url}
                disabled={!canEdit}
                onUploaded={(path) => setSiteConfig({ ...siteConfig, favicon_url: path })}
                onRemoved={() => setSiteConfig({ ...siteConfig, favicon_url: null })}
              />
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 2: Cores & Estilo */}
        {activeTab === 'cores' && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-7 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-foreground">Identidade Visual & Cores</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Escolha uma paleta refinada Linha de Planta ou personalize os tons da sua marca.
              </p>
            </div>

            <ColorPresets
              primaryColor={siteConfig.primary_color}
              accentColor={siteConfig.accent_color}
              disabled={!canEdit}
              onChange={({ primaryColor, accentColor }) =>
                setSiteConfig({
                  ...siteConfig,
                  primary_color: primaryColor,
                  accent_color: accentColor,
                })
              }
            />
          </div>
        )}

        {/* Conteúdo da Aba 3: Contatos & Redes */}
        {activeTab === 'contato' && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-7 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-foreground">Canais de Atendimento & Contato</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Facilite o contato de clientes e compradores através dos canais oficiais da imobiliária.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-xs font-semibold">
                  WhatsApp de Atendimento (com DDD)
                </Label>
                <Input
                  id="whatsapp"
                  disabled={!canEdit}
                  maxLength={30}
                  value={siteConfig.whatsapp ?? ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, whatsapp: e.target.value })}
                  placeholder="Ex: 11999998888 ou (11) 99999-8888"
                />
                <p className="text-[11px] text-muted-foreground">
                  Alimenta o botão flutuante e atalhos de conversa imediata.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-xs font-semibold">
                  Telefone Comercial
                </Label>
                <Input
                  id="telefone"
                  disabled={!canEdit}
                  maxLength={30}
                  value={siteConfig.telefone ?? ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, telefone: e.target.value })}
                  placeholder="Ex: (11) 3456-7890"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email_contato" className="text-xs font-semibold">
                  E-mail Comercial de Atendimento
                </Label>
                <Input
                  id="email_contato"
                  type="email"
                  disabled={!canEdit}
                  maxLength={120}
                  value={siteConfig.email_contato ?? ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, email_contato: e.target.value })}
                  placeholder="Ex: contato@minhaimobiliaria.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_completo" className="text-xs font-semibold">
                  Endereço da Sede Física
                </Label>
                <Input
                  id="endereco_completo"
                  disabled={!canEdit}
                  maxLength={250}
                  value={siteConfig.endereco_completo ?? ''}
                  onChange={(e) => setSiteConfig({ ...siteConfig, endereco_completo: e.target.value })}
                  placeholder="Ex: Av. Paulista, 1000, Sala 52 - São Paulo, SP"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/70">
              <h3 className="text-sm font-semibold text-foreground mb-3">Redes Sociais Oficiais</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="instagram" className="text-xs font-medium">Instagram</Label>
                  <Input
                    id="instagram"
                    disabled={!canEdit}
                    maxLength={150}
                    value={siteConfig.redes_sociais?.instagram ?? ''}
                    onChange={(e) =>
                      setSiteConfig({
                        ...siteConfig,
                        redes_sociais: {
                          ...siteConfig.redes_sociais,
                          instagram: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: @minhaimobiliaria ou https://instagram.com/..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="facebook" className="text-xs font-medium">Facebook</Label>
                  <Input
                    id="facebook"
                    disabled={!canEdit}
                    maxLength={150}
                    value={siteConfig.redes_sociais?.facebook ?? ''}
                    onChange={(e) =>
                      setSiteConfig({
                        ...siteConfig,
                        redes_sociais: {
                          ...siteConfig.redes_sociais,
                          facebook: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: https://facebook.com/minhaimobiliaria"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="text-xs font-medium">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    disabled={!canEdit}
                    maxLength={150}
                    value={siteConfig.redes_sociais?.linkedin ?? ''}
                    onChange={(e) =>
                      setSiteConfig({
                        ...siteConfig,
                        redes_sociais: {
                          ...siteConfig.redes_sociais,
                          linkedin: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: https://linkedin.com/company/minhaimobiliaria"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="youtube" className="text-xs font-medium">YouTube</Label>
                  <Input
                    id="youtube"
                    disabled={!canEdit}
                    maxLength={150}
                    value={siteConfig.redes_sociais?.youtube ?? ''}
                    onChange={(e) =>
                      setSiteConfig({
                        ...siteConfig,
                        redes_sociais: {
                          ...siteConfig.redes_sociais,
                          youtube: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: @minhaimobiliaria ou canal"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 4: Home & Destaques */}
        {activeTab === 'vitrine' && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-7 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-foreground">Apresentação da Vitrine & Destaques</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize os textos do Hero e selecione quais imóveis têm destaque na página inicial.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_title" className="text-xs font-semibold">
                  Título de Destaque da Home (Hero)
                </Label>
                <Input
                  id="hero_title"
                  disabled={!canEdit}
                  maxLength={120}
                  value={siteConfig.hero_title}
                  onChange={(e) => setSiteConfig({ ...siteConfig, hero_title: e.target.value })}
                  placeholder="Ex: Encontre o imóvel perfeito para você"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subtitle" className="text-xs font-semibold">
                  Descrição / Subtítulo da Home
                </Label>
                <textarea
                  id="hero_subtitle"
                  disabled={!canEdit}
                  maxLength={350}
                  rows={3}
                  value={siteConfig.hero_subtitle}
                  onChange={(e) => setSiteConfig({ ...siteConfig, hero_subtitle: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ex: Casas, apartamentos e coberturas selecionadas nas melhores localizações da cidade."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/70">
              <FeaturedPropertiesManager disabled={!canEdit} />
            </div>
          </div>
        )}

        {/* Barra de Ações (Salvar) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            As alterações salvas são refletidas em tempo real para os visitantes da vitrine.
          </p>
          <Button
            type="submit"
            disabled={saving || !canEdit}
            className="w-full sm:w-auto h-10 px-6 gap-2 text-xs font-semibold shadow-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </form>
      )}
    </div>
  )
}
