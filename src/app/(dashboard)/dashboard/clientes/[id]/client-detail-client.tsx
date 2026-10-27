'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Compass,
  Home,
  FileText,
  Wallet,
  Clock,
  Send,
  MessageCircle,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientRoleBadge, ClientStatusBadge, ClientTypeBadge } from '@/components/clients/client-role-badge'
import { ClientWhatsAppButton } from '@/components/clients/client-whatsapp-button'
import { ClientDialog } from '@/components/clients/client-dialog'
import { formatDocument, formatPhoneBR } from '@/lib/clients/validation'
import type { Client, ClientNote, PropertyMatchResult } from '@/lib/clients/types'

interface ClientDetailClientProps {
  initialClient: Client
  ownedProperties: any[]
  initialNotes: ClientNote[]
  radarMatches: PropertyMatchResult[]
  associatedLeads: any[]
  teamMembers: Array<{ id: string; nome: string }>
  canEdit: boolean
}

type TabType = 'ficha' | 'imoveis' | 'radar' | 'timeline'

export function ClientDetailClient({
  initialClient,
  ownedProperties,
  initialNotes,
  radarMatches,
  associatedLeads,
  teamMembers,
  canEdit,
}: ClientDetailClientProps) {
  const router = useRouter()
  const [client, setClient] = useState<Client>(initialClient)
  const [notes, setNotes] = useState<ClientNote[]>(initialNotes)
  const [activeTab, setActiveTab] = useState<TabType>('ficha')

  // Nova nota
  const [newNoteContent, setNewNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)

  // Dialog de Edição
  const [editOpen, setEditOpen] = useState(false)

  const isOwner = client.papeis.includes('proprietario')
  const isBuyerOrTenant = client.papeis.includes('comprador') || client.papeis.includes('locatario')

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newNoteContent.trim()) return

    try {
      setSavingNote(true)
      setNoteError(null)

      const res = await fetch(`/api/dashboard/clients/${client.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: newNoteContent.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar anotação')
      }

      setNotes((prev) => [data.note, ...prev])
      setNewNoteContent('')
    } catch (err: any) {
      setNoteError(err.message || 'Erro inesperado')
    } finally {
      setSavingNote(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.nome}"?`)) return

    try {
      const res = await fetch(`/api/dashboard/clients/${client.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/clientes')
      } else {
        alert('Não foi possível excluir o cliente.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const initial = (client.nome || 'C').charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <div>
        <Link
          href="/dashboard/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para Lista de Clientes</span>
        </Link>
      </div>

      {/* Header do Cliente (Cartão 360º) */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/15 font-serif text-2xl font-bold text-accent shadow-xs">
              {initial}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                  {client.nome}
                </h1>
                <ClientTypeBadge type={client.tipo_pessoa} />
                <ClientStatusBadge status={client.status} />
              </div>

              {client.nome_fantasia && (
                <div className="text-xs font-medium text-muted-foreground">
                  Nome Fantasia: {client.nome_fantasia}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {client.papeis.map((p) => (
                  <ClientRoleBadge key={p} role={p} />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{formatPhoneBR(client.telefone)}</span>
                </div>

                {client.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{client.email}</span>
                  </div>
                )}

                {client.cidade && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{client.cidade}{client.estado ? ` - ${client.estado}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões Rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            <ClientWhatsAppButton
              phone={client.telefone}
              clientName={client.nome}
              label="Abrir WhatsApp"
            />

            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-border bg-card rounded-t-xl px-4 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ficha')}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'ficha'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Ficha Cadastral</span>
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('imoveis')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'imoveis'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Imóveis do Proprietário ({ownedProperties.length})</span>
          </button>
        )}

        {isBuyerOrTenant && (
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'radar'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Radar de Imóveis ({radarMatches.length} compatíveis)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Linha do Tempo & Notas ({notes.length})</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="space-y-6">
        {/* ABA 1: FICHA CADASTRAL */}
        {activeTab === 'ficha' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco 1: Dados Pessoais / Civis */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {client.tipo_pessoa === 'pf' ? 'Dados Civis e Pessoais' : 'Dados Empresariais'}
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    {client.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}
                  </span>
                  <span className="font-medium text-foreground">
                    {client.documento ? formatDocument(client.documento) : 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    {client.tipo_pessoa === 'pf' ? 'RG / Emissor' : 'Inscrição Estadual'}
                  </span>
                  <span className="font-medium text-foreground">{client.rg_ie || 'Não informado'}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    {client.tipo_pessoa === 'pf' ? 'Nascimento' : 'Fundação'}
                  </span>
                  <span className="font-medium text-foreground">{client.data_nascimento || 'Não informada'}</span>
                </div>

                {client.tipo_pessoa === 'pf' && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Profissão</span>
                    <span className="font-medium text-foreground">{client.profissao || 'Não informada'}</span>
                  </div>
                )}

                {client.tipo_pessoa === 'pf' && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Estado Civil</span>
                    <span className="font-medium text-foreground capitalize">
                      {client.estado_civil || 'Não informado'}
                    </span>
                  </div>
                )}

                {client.corretor_nome && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Corretor Responsável</span>
                    <span className="font-medium text-foreground">{client.corretor_nome}</span>
                  </div>
                )}
              </div>

              {client.estado_civil === 'casado' && client.conjuge_nome && (
                <div className="border-t border-border/60 pt-3 space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase">Dados do Cônjuge</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Nome do Cônjuge</span>
                      <span className="font-medium text-foreground">{client.conjuge_nome}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">CPF do Cônjuge</span>
                      <span className="font-medium text-foreground">
                        {client.conjuge_cpf ? formatDocument(client.conjuge_cpf) : 'Não informado'}
                      </span>
                    </div>
                    {client.regime_bens && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block text-[11px]">Regime de Bens</span>
                        <span className="font-medium text-foreground capitalize">{client.regime_bens.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 2: Localização e Endereço */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Endereço Residencial / Comercial
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Logradouro</span>
                  <span className="font-medium text-foreground">
                    {client.logradouro ? `${client.logradouro}, ${client.numero || 'S/N'}` : 'Não informado'}
                    {client.complemento ? ` (${client.complemento})` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Bairro</span>
                  <span className="font-medium text-foreground">{client.bairro || 'Não informado'}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Cidade / UF</span>
                  <span className="font-medium text-foreground">
                    {client.cidade ? `${client.cidade} - ${client.estado || ''}` : 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">CEP</span>
                  <span className="font-medium text-foreground font-mono">{client.cep || 'Não informado'}</span>
                </div>
              </div>

              {client.observacoes && (
                <div className="border-t border-border/60 pt-3">
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase">Observações</span>
                  <p className="mt-1 text-xs text-foreground whitespace-pre-line leading-relaxed">
                    {client.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Bloco 3: Dados Bancários de Repasse (Se Proprietário) */}
            {isOwner && (
              <div className="col-span-1 md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Dados de Repasse Financeiro / Chave Pix
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-amber-800/80 dark:text-amber-300/80 block text-[11px]">Banco</span>
                    <span className="font-medium text-foreground">{client.dados_bancarios?.banco || 'Não informado'}</span>
                  </div>

                  <div>
                    <span className="text-amber-800/80 dark:text-amber-300/80 block text-[11px]">Agência / Conta</span>
                    <span className="font-medium text-foreground">
                      {client.dados_bancarios?.agencia ? `Ag. ${client.dados_bancarios.agencia}` : ''}{' '}
                      {client.dados_bancarios?.conta ? `Cc. ${client.dados_bancarios.conta}` : 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-amber-800/80 dark:text-amber-300/80 block text-[11px]">Tipo de Chave Pix</span>
                    <span className="font-medium text-foreground capitalize">
                      {client.dados_bancarios?.tipo_chave_pix || 'Não informado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-amber-800/80 dark:text-amber-300/80 block text-[11px]">Chave Pix</span>
                    <span className="font-medium text-foreground font-mono">
                      {client.dados_bancarios?.chave_pix || 'Não informada'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: IMÓVEIS DO PROPRIETÁRIO */}
        {activeTab === 'imoveis' && isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Catálogo de Imóveis deste Proprietário</h3>
                <p className="text-xs text-muted-foreground">Imóveis captados e administrados pela imobiliária vinculados a este cliente.</p>
              </div>
              <Link href="/dashboard/imoveis" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                <span>Ver Catálogo Geral</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {ownedProperties.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                <Home className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum imóvel vinculado a este proprietário</p>
                <p className="text-xs mt-1">Ao cadastrar ou editar um imóvel no Catálogo, selecione este cliente como proprietário.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedProperties.map((prop) => {
                  const cover = prop.property_images?.find((i: any) => i.is_cover)?.url || prop.property_images?.[0]?.url

                  return (
                    <div key={prop.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="h-36 w-full bg-secondary relative overflow-hidden">
                        {cover ? (
                          <img src={cover} alt={prop.titulo} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                            Sem foto
                          </div>
                        )}
                        <span className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white uppercase">
                          {prop.status}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1" title={prop.titulo}>
                          {prop.titulo}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {prop.bairro}, {prop.cidade} • {prop.tipo}
                        </p>

                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-medium">
                          {prop.preco_venda && (
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Venda</span>
                              <span className="text-foreground">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.preco_venda)}
                              </span>
                            </div>
                          )}
                          {prop.preco_locacao && (
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Locação</span>
                              <span className="text-foreground">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.preco_locacao)}/mês
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 3: RADAR DE IMÓVEIS (OPORTUNIDADES DE COMPRA/LOCAÇÃO) */}
        {activeTab === 'radar' && isBuyerOrTenant && (
          <div className="space-y-6">
            {/* Resumo do Perfil */}
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Critérios de Busca do Radar de Imóveis
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-card border border-border px-2.5 py-1 text-muted-foreground">
                  Finalidade: <strong className="text-foreground capitalize">{client.perfil_interesse?.finalidade || 'Qualquer'}</strong>
                </span>
                {client.perfil_interesse?.tipos_imovel?.length ? (
                  <span className="rounded-md bg-card border border-border px-2.5 py-1 text-muted-foreground">
                    Tipos: <strong className="text-foreground capitalize">{client.perfil_interesse.tipos_imovel.join(', ')}</strong>
                  </span>
                ) : null}
                {client.perfil_interesse?.valor_maximo ? (
                  <span className="rounded-md bg-card border border-border px-2.5 py-1 text-muted-foreground">
                    Teto Máximo: <strong className="text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.perfil_interesse.valor_maximo)}
                    </strong>
                  </span>
                ) : null}
                {client.perfil_interesse?.quartos_minimo ? (
                  <span className="rounded-md bg-card border border-border px-2.5 py-1 text-muted-foreground">
                    Quartos: <strong className="text-foreground">{client.perfil_interesse.quartos_minimo}+</strong>
                  </span>
                ) : null}
                {client.perfil_interesse?.bairros_interesse?.length ? (
                  <span className="rounded-md bg-card border border-border px-2.5 py-1 text-muted-foreground">
                    Bairros: <strong className="text-foreground">{client.perfil_interesse.bairros_interesse.join(', ')}</strong>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Imóveis Compatíveis */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span>Imóveis Disponíveis com Alta Compatibilidade</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cruzamento automático do catálogo com base nas preferências e orçamento do cliente.
                  </p>
                </div>
              </div>

              {radarMatches.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                  <Compass className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm font-medium">Nenhum imóvel disponível atende a todos os critérios atuais</p>
                  <p className="text-xs mt-1">Tente ajustar a faixa de valor ou os tipos de imóvel na edição do cliente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {radarMatches.map((m) => {
                    const price = m.precoVenda || m.precoLocacao || 0
                    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

                    // Mensagem para WhatsApp
                    const shareText = encodeURIComponent(
                      `Olá ${client.nome.split(' ')[0]}! Encontrei este imóvel que tem tudo a ver com o que você procura: ${m.titulo} (${m.bairro}) por ${formattedPrice}. Podemos marcar uma visita?`
                    )
                    const cleanPhone = client.telefone ? client.telefone.replace(/\D/g, '') : ''
                    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
                    const waShareUrl = `https://wa.me/${fullPhone}?text=${shareText}`

                    return (
                      <div key={m.propertyId} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-accent/50 transition-colors">
                        <div className="h-32 sm:w-36 shrink-0 rounded-lg bg-secondary overflow-hidden relative">
                          {m.coverUrl ? (
                            <img src={m.coverUrl} alt={m.titulo} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                              Sem foto
                            </div>
                          )}
                          <span className="absolute top-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow-xs">
                            {m.matchScore}% Match
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground line-clamp-1" title={m.titulo}>
                              {m.titulo}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {m.bairro}, {m.cidade} • {m.quartos ? `${m.quartos} qts • ` : ''}{m.tipo}
                            </p>
                            <div className="text-sm font-bold text-foreground mt-1">
                              {formattedPrice} {m.finalidade === 'locacao' ? '/mês' : ''}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {m.matchReasons.map((r, idx) => (
                              <span key={idx} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                ✓ {r}
                              </span>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                            <a
                              href={waShareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>Enviar no WhatsApp</span>
                            </a>

                            <Link
                              href={`/dashboard/imoveis/${m.propertyId}`}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <span>Ver Imóvel</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 4: LINHA DO TEMPO & ANOTAÇÕES */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Input de Nova Anotação */}
            {canEdit && (
              <form onSubmit={handleAddNote} className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Registrar Nova Interação / Anotação de Atendimento
                  </h4>
                </div>

                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Ex: Cliente ligou informando que prefere imóveis com varanda gourmet e vaga coberta..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />

                {noteError && (
                  <p className="text-xs text-destructive">{noteError}</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={savingNote || !newNoteContent.trim()} className="cursor-pointer text-xs">
                    {savingNote && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Salvar Nota
                  </Button>
                </div>
              </form>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Histórico de Notas e Acontecimentos
              </h4>

              {notes.length === 0 && associatedLeads.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-xs">
                  Nenhuma anotação registrada ainda para este cliente.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {notes.map((note) => (
                    <div key={note.id} className="relative rounded-xl border border-border bg-card p-4 shadow-2xs space-y-1">
                      <div className="absolute -left-[23px] top-4.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{note.autor_nome || 'Equipe'}</span>
                        <span>{new Date(note.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                        {note.conteudo}
                      </p>
                    </div>
                  ))}

                  {associatedLeads.map((lead) => (
                    <div key={lead.id} className="relative rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-2xs space-y-1">
                      <div className="absolute -left-[23px] top-4.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-blue-500" />
                      <div className="flex items-center justify-between text-[11px] text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">Origem: Contato na Vitrine Pública</span>
                        <span>{new Date(lead.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      {lead.mensagem && (
                        <p className="text-xs text-foreground italic">"{lead.mensagem}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      <ClientDialog
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => {
          setClient(updated)
        }}
        client={client}
        teamMembers={teamMembers}
      />
    </div>
  )
}
