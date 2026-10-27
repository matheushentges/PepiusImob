'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Search, Check, Building, User, Wallet, Compass, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCep, fetchAddressByCep } from '@/lib/cep/viacep'
import { formatDocument, formatPhoneBR, sanitizeDocument } from '@/lib/clients/validation'
import type { Client, ClientRole, ClientType, ClientStatus } from '@/lib/clients/types'

interface TeamMember {
  id: string
  nome: string
}

interface ClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (client: Client) => void
  client?: Client | null
  initialLead?: {
    nome?: string
    email?: string
    telefone?: string
    mensagem?: string
    finalidade?: string
  } | null
  teamMembers?: TeamMember[]
}

type TabType = 'identificacao' | 'contato_endereco' | 'papeis_interesse' | 'bancario'

export function ClientDialog({
  isOpen,
  onClose,
  onSuccess,
  client,
  initialLead,
  teamMembers = [],
}: ClientDialogProps) {
  const isEditing = Boolean(client)
  const [activeTab, setActiveTab] = useState<TabType>('identificacao')

  // Identificação
  const [tipoPessoa, setTipoPessoa] = useState<ClientType>('pf')
  const [papeis, setPapeis] = useState<ClientRole[]>(['comprador'])
  const [status, setStatus] = useState<ClientStatus>('ativo')
  const [nome, setNome] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [documento, setDocumento] = useState('')
  const [rgIe, setRgIe] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [profissao, setProfissao] = useState('')
  const [estadoCivil, setEstadoCivil] = useState('solteiro')
  const [regimeBens, setRegimeBens] = useState('')
  const [conjugeNome, setConjugeNome] = useState('')
  const [conjugeCpf, setConjugeCpf] = useState('')

  // Contato & Endereço
  const [telefone, setTelefone] = useState('')
  const [telefoneSecundario, setTelefoneSecundario] = useState('')
  const [email, setEmail] = useState('')
  const [emailSecundario, setEmailSecundario] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cepLoading, setCepLoading] = useState(false)

  // Corretor & Observações
  const [corretorId, setCorretorId] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Dados Bancários (Proprietário)
  const [banco, setBanco] = useState('')
  const [agencia, setAgencia] = useState('')
  const [conta, setConta] = useState('')
  const [tipoConta, setTipoConta] = useState<'corrente' | 'poupanca'>('corrente')
  const [tipoChavePix, setTipoChavePix] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf')
  const [chavePix, setChavePix] = useState('')
  const [titularPix, setTitularPix] = useState('')

  // Perfil de Interesse (Comprador/Locatário)
  const [interesseTipos, setInteresseTipos] = useState<string[]>(['apartamento', 'casa'])
  const [interesseFinalidade, setInteresseFinalidade] = useState<'venda' | 'locacao' | 'ambos'>('ambos')
  const [valorMinimo, setValorMinimo] = useState<string>('')
  const [valorMaximo, setValorMaximo] = useState<string>('')
  const [quartosMinimo, setQuartosMinimo] = useState<string>('')
  const [vagasMinimo, setVagasMinimo] = useState<string>('')
  const [bairrosInteresse, setBairrosInteresse] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preenche dados quando abre para edição ou a partir de lead
  useEffect(() => {
    if (!isOpen) return

    if (client) {
      setTipoPessoa(client.tipo_pessoa || 'pf')
      setPapeis(client.papeis || ['comprador'])
      setStatus(client.status || 'ativo')
      setNome(client.nome || '')
      setNomeFantasia(client.nome_fantasia || '')
      setDocumento(client.documento ? formatDocument(client.documento) : '')
      setRgIe(client.rg_ie || '')
      setDataNascimento(client.data_nascimento || '')
      setProfissao(client.profissao || '')
      setEstadoCivil(client.estado_civil || 'solteiro')
      setRegimeBens(client.regime_bens || '')
      setConjugeNome(client.conjuge_nome || '')
      setConjugeCpf(client.conjuge_cpf ? formatDocument(client.conjuge_cpf) : '')
      setTelefone(client.telefone ? formatPhoneBR(client.telefone) : '')
      setTelefoneSecundario(client.telefone_secundario ? formatPhoneBR(client.telefone_secundario) : '')
      setEmail(client.email || '')
      setEmailSecundario(client.email_secundario || '')
      setCep(client.cep ? formatCep(client.cep) : '')
      setLogradouro(client.logradouro || '')
      setNumero(client.numero || '')
      setComplemento(client.complemento || '')
      setBairro(client.bairro || '')
      setCidade(client.cidade || '')
      setEstado(client.estado || '')
      setCorretorId(client.corretor_id || '')
      setObservacoes(client.observacoes || '')

      const bank = client.dados_bancarios || {}
      setBanco(bank.banco || '')
      setAgencia(bank.agencia || '')
      setConta(bank.conta || '')
      setTipoConta(bank.tipo_conta || 'corrente')
      setTipoChavePix(bank.tipo_chave_pix || 'cpf')
      setChavePix(bank.chave_pix || '')
      setTitularPix(bank.titular || '')

      const prof = client.perfil_interesse || {}
      setInteresseTipos(prof.tipos_imovel || ['apartamento', 'casa'])
      setInteresseFinalidade(prof.finalidade || 'ambos')
      setValorMinimo(prof.valor_minimo ? String(prof.valor_minimo) : '')
      setValorMaximo(prof.valor_maximo ? String(prof.valor_maximo) : '')
      setQuartosMinimo(prof.quartos_minimo ? String(prof.quartos_minimo) : '')
      setVagasMinimo(prof.vagas_minimo ? String(prof.vagas_minimo) : '')
      setBairrosInteresse((prof.bairros_interesse || []).join(', '))
    } else if (initialLead) {
      setNome(initialLead.nome || '')
      setEmail(initialLead.email || '')
      setTelefone(initialLead.telefone ? formatPhoneBR(initialLead.telefone) : '')
      setObservacoes(initialLead.mensagem ? `Origem Lead: ${initialLead.mensagem}` : '')
      setPapeis([initialLead.finalidade === 'locacao' ? 'locatario' : 'comprador'])
      setTipoPessoa('pf')
      setStatus('ativo')
    } else {
      // Reset para novo cliente
      setTipoPessoa('pf')
      setPapeis(['comprador'])
      setStatus('ativo')
      setNome('')
      setNomeFantasia('')
      setDocumento('')
      setRgIe('')
      setDataNascimento('')
      setProfissao('')
      setEstadoCivil('solteiro')
      setRegimeBens('')
      setConjugeNome('')
      setConjugeCpf('')
      setTelefone('')
      setTelefoneSecundario('')
      setEmail('')
      setEmailSecundario('')
      setCep('')
      setLogradouro('')
      setNumero('')
      setComplemento('')
      setBairro('')
      setCidade('')
      setEstado('')
      setCorretorId('')
      setObservacoes('')
      setBanco('')
      setAgencia('')
      setConta('')
      setTipoConta('corrente')
      setTipoChavePix('cpf')
      setChavePix('')
      setTitularPix('')
      setInteresseTipos(['apartamento', 'casa'])
      setInteresseFinalidade('ambos')
      setValorMinimo('')
      setValorMaximo('')
      setQuartosMinimo('')
      setVagasMinimo('')
      setBairrosInteresse('')
    }

    setActiveTab('identificacao')
    setError(null)
  }, [isOpen, client, initialLead])

  // Busca endereço por CEP
  async function handleCepSearch(targetCep: string) {
    const formatted = formatCep(targetCep)
    setCep(formatted)
    if (formatted.replace(/\D/g, '').length === 8) {
      try {
        setCepLoading(true)
        const addr = await fetchAddressByCep(formatted)
        if (addr) {
          setLogradouro(addr.endereco)
          setBairro(addr.bairro)
          setCidade(addr.cidade)
          setEstado(addr.estado)
        }
      } finally {
        setCepLoading(false)
      }
    }
  }

  function toggleRole(role: ClientRole) {
    setPapeis((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev // manter pelo menos 1
        return prev.filter((r) => r !== role)
      }
      return [...prev, role]
    })
  }

  function togglePropertyType(type: string) {
    setInteresseTipos((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type)
      }
      return [...prev, type]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Informe o Nome ou Razão Social do cliente')
      setActiveTab('identificacao')
      return
    }
    if (!telefone.trim() || sanitizeDocument(telefone).length < 8) {
      setError('Informe um telefone válido para contato')
      setActiveTab('contato_endereco')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload = {
        tipo_pessoa: tipoPessoa,
        papeis,
        status,
        nome: nome.trim(),
        nome_fantasia: tipoPessoa === 'pj' ? nomeFantasia.trim() || null : null,
        documento: documento ? sanitizeDocument(documento) : null,
        rg_ie: rgIe.trim() || null,
        data_nascimento: dataNascimento || null,
        profissao: profissao.trim() || null,
        estado_civil: estadoCivil || null,
        regime_bens: estadoCivil === 'casado' ? regimeBens.trim() || null : null,
        conjuge_nome: estadoCivil === 'casado' ? conjugeNome.trim() || null : null,
        conjuge_cpf: estadoCivil === 'casado' && conjugeCpf ? sanitizeDocument(conjugeCpf) : null,
        telefone: sanitizeDocument(telefone),
        telefone_secundario: telefoneSecundario ? sanitizeDocument(telefoneSecundario) : null,
        email: email.trim() || null,
        email_secundario: emailSecundario.trim() || null,
        cep: cep ? sanitizeDocument(cep) : null,
        logradouro: logradouro.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        corretor_id: corretorId || null,
        observacoes: observacoes.trim() || null,
        dados_bancarios: papeis.includes('proprietario')
          ? {
              banco: banco.trim() || undefined,
              agencia: agencia.trim() || undefined,
              conta: conta.trim() || undefined,
              tipo_conta: tipoConta,
              tipo_chave_pix: tipoChavePix,
              chave_pix: chavePix.trim() || undefined,
              titular: titularPix.trim() || undefined,
            }
          : {},
        perfil_interesse: papeis.includes('comprador') || papeis.includes('locatario')
          ? {
              tipos_imovel: interesseTipos,
              finalidade: interesseFinalidade,
              valor_minimo: valorMinimo ? Number(valorMinimo) : null,
              valor_maximo: valorMaximo ? Number(valorMaximo) : null,
              quartos_minimo: quartosMinimo ? Number(quartosMinimo) : null,
              vagas_minimo: vagasMinimo ? Number(vagasMinimo) : null,
              bairros_interesse: bairrosInteresse
                .split(',')
                .map((b) => b.trim())
                .filter(Boolean),
            }
          : {},
      }

      const url = isEditing ? `/api/dashboard/clients/${client!.id}` : '/api/dashboard/clients'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar cliente')
      }

      onSuccess(data.client)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isOwner = papeis.includes('proprietario')
  const isBuyerOrTenant = papeis.includes('comprador') || papeis.includes('locatario')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-3xl max-h-[90vh] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {isEditing ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEditing ? 'Atualize as informações completas do cadastro' : 'Preencha os dados civis, contatos e preferências'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-border bg-secondary/30 px-6 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('identificacao')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'identificacao'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Identificação</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contato_endereco')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'contato_endereco'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Contato & Endereço</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('papeis_interesse')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'papeis_interesse'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Papéis & Perfil de Interesse</span>
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab('bancario')}
              className={`flex items-center gap-1.5 border-b-2 py-3 px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'bancario'
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Dados de Repasse (Pix)</span>
            </button>
          )}
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* ABA 1: IDENTIFICAÇÃO */}
            {activeTab === 'identificacao' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Tipo de Pessoa</Label>
                  <div className="flex rounded-lg border border-border bg-secondary p-0.5">
                    <button
                      type="button"
                      onClick={() => setTipoPessoa('pf')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                        tipoPessoa === 'pf' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      <User className="h-3 w-3" />
                      Pessoa Física
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoPessoa('pj')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                        tipoPessoa === 'pj' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      <Building className="h-3 w-3" />
                      Pessoa Jurídica
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome" className="text-xs font-medium">
                      {tipoPessoa === 'pf' ? 'Nome Completo *' : 'Razão Social *'}
                    </Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder={tipoPessoa === 'pf' ? 'Ex: Mariana Silva' : 'Ex: Silva Empreendimentos LTDA'}
                      required
                    />
                  </div>

                  {tipoPessoa === 'pj' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="nomeFantasia" className="text-xs font-medium">Nome Fantasia</Label>
                      <Input
                        id="nomeFantasia"
                        value={nomeFantasia}
                        onChange={(e) => setNomeFantasia(e.target.value)}
                        placeholder="Ex: Imobiliária Silva"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="documento" className="text-xs font-medium">
                      {tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'}
                    </Label>
                    <Input
                      id="documento"
                      value={documento}
                      onChange={(e) => setDocumento(formatDocument(e.target.value))}
                      placeholder={tipoPessoa === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rgIe" className="text-xs font-medium">
                      {tipoPessoa === 'pf' ? 'RG / Órgão Emissor' : 'Inscrição Estadual'}
                    </Label>
                    <Input
                      id="rgIe"
                      value={rgIe}
                      onChange={(e) => setRgIe(e.target.value)}
                      placeholder={tipoPessoa === 'pf' ? 'Ex: 12.345.678-9 SSP/SP' : 'Ex: 123.456.789.111'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dataNasc" className="text-xs font-medium">
                      {tipoPessoa === 'pf' ? 'Data de Nascimento' : 'Data de Fundação'}
                    </Label>
                    <Input
                      id="dataNasc"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                    />
                  </div>

                  {tipoPessoa === 'pf' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="profissao" className="text-xs font-medium">Profissão</Label>
                      <Input
                        id="profissao"
                        value={profissao}
                        onChange={(e) => setProfissao(e.target.value)}
                        placeholder="Ex: Engenheira Civil, Médico, etc."
                      />
                    </div>
                  )}
                </div>

                {tipoPessoa === 'pf' && (
                  <div className="border-t border-border/60 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="estadoCivil" className="text-xs font-medium">Estado Civil</Label>
                        <select
                          id="estadoCivil"
                          value={estadoCivil}
                          onChange={(e) => setEstadoCivil(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="solteiro">Solteiro(a)</option>
                          <option value="casado">Casado(a)</option>
                          <option value="uniao_estavel">União Estável</option>
                          <option value="divorciado">Divorciado(a)</option>
                          <option value="viuvo">Viúvo(a)</option>
                        </select>
                      </div>

                      {estadoCivil === 'casado' && (
                        <div className="space-y-1.5">
                          <Label htmlFor="regimeBens" className="text-xs font-medium">Regime de Bens</Label>
                          <select
                            id="regimeBens"
                            value={regimeBens}
                            onChange={(e) => setRegimeBens(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="">Selecione o regime...</option>
                            <option value="comunhao_parcial">Comunhão Parcial de Bens</option>
                            <option value="comunhao_universal">Comunhão Universal de Bens</option>
                            <option value="separacao_total">Separação Total de Bens</option>
                            <option value="participacao_final">Participação Final nos Aquestos</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {estadoCivil === 'casado' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/30 p-3 rounded-lg border border-border/60">
                        <div className="space-y-1.5">
                          <Label htmlFor="conjugeNome" className="text-xs font-medium">Nome do Cônjuge</Label>
                          <Input
                            id="conjugeNome"
                            value={conjugeNome}
                            onChange={(e) => setConjugeNome(e.target.value)}
                            placeholder="Nome completo do cônjuge"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="conjugeCpf" className="text-xs font-medium">CPF do Cônjuge</Label>
                          <Input
                            id="conjugeCpf"
                            value={conjugeCpf}
                            onChange={(e) => setConjugeCpf(formatDocument(e.target.value))}
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: CONTATO & ENDEREÇO */}
            {activeTab === 'contato_endereco' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone" className="text-xs font-medium">WhatsApp / Telefone Principal *</Label>
                    <Input
                      id="telefone"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                      placeholder="(11) 98765-4321"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telefoneSec" className="text-xs font-medium">Telefone Secundário / Fixo</Label>
                    <Input
                      id="telefoneSec"
                      value={telefoneSecundario}
                      onChange={(e) => setTelefoneSecundario(formatPhoneBR(e.target.value))}
                      placeholder="(11) 3333-4444"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">E-mail Principal</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@exemplo.com.br"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emailSec" className="text-xs font-medium">E-mail Secundário</Label>
                    <Input
                      id="emailSec"
                      type="email"
                      value={emailSecundario}
                      onChange={(e) => setEmailSecundario(e.target.value)}
                      placeholder="financeiro@exemplo.com.br"
                    />
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Endereço Completo (ViaCEP)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cep" className="text-xs font-medium">CEP</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          value={cep}
                          onChange={(e) => handleCepSearch(e.target.value)}
                          placeholder="00000-000"
                        />
                        {cepLoading && (
                          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <Label htmlFor="logradouro" className="text-xs font-medium">Logradouro / Rua</Label>
                      <Input
                        id="logradouro"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        placeholder="Rua das Palmeiras"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="numero" className="text-xs font-medium">Número</Label>
                      <Input
                        id="numero"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="complemento" className="text-xs font-medium">Complemento</Label>
                      <Input
                        id="complemento"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        placeholder="Apto 42"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bairro" className="text-xs font-medium">Bairro</Label>
                      <Input
                        id="bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Centro"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cidade" className="text-xs font-medium">Cidade / UF</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cidade"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          placeholder="São Paulo"
                          className="flex-1"
                        />
                        <Input
                          value={estado}
                          onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                          placeholder="SP"
                          className="w-14 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: PAPÉIS & PERFIL DE INTERESSE */}
            {activeTab === 'papeis_interesse' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Papéis do Cliente (Selecione todos que se aplicam)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['comprador', 'locatario', 'proprietario', 'fiador'] as ClientRole[]).map((r) => {
                      const isSelected = papeis.includes(r)
                      const labels: Record<ClientRole, string> = {
                        comprador: 'Comprador',
                        locatario: 'Locatário',
                        proprietario: 'Proprietário',
                        fiador: 'Fiador',
                      }
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRole(r)}
                          className={`flex items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-accent bg-accent/10 text-accent font-semibold shadow-xs'
                              : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          <span>{labels[r]}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-xs font-medium">Status do Relacionamento</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ClientStatus)}
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="ativo">Ativo (Em negociação / Operacional)</option>
                      <option value="potencial">Potencial (Lead qualificado / Em prospecção)</option>
                      <option value="inativo">Inativo (Sem negociações recentes)</option>
                      <option value="arquivado">Arquivado</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="corretorId" className="text-xs font-medium">Corretor Responsável</Label>
                    <select
                      id="corretorId"
                      value={corretorId}
                      onChange={(e) => setCorretorId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Não atribuído (Geral)</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Perfil de Interesse (Comprador/Locatário) */}
                {isBuyerOrTenant && (
                  <div className="border-t border-border/60 pt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-accent" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        Perfil de Busca para o Radar de Imóveis
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Tipos de Imóvel Desejados</Label>
                      <div className="flex flex-wrap gap-2">
                        {['apartamento', 'casa', 'terreno', 'comercial', 'rural'].map((t) => {
                          const isSel = interesseTipos.includes(t)
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => togglePropertyType(t)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                                isSel
                                  ? 'border-accent bg-accent/15 text-accent font-semibold'
                                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                              }`}
                            >
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="finalidade" className="text-xs font-medium">Finalidade Pretendida</Label>
                        <select
                          id="finalidade"
                          value={interesseFinalidade}
                          onChange={(e) => setInteresseFinalidade(e.target.value as any)}
                          className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="ambos">Qualquer uma (Venda ou Locação)</option>
                          <option value="venda">Compra (Venda)</option>
                          <option value="locacao">Locação (Aluguel)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="valorMin" className="text-xs font-medium">Valor Mínimo (R$)</Label>
                        <Input
                          id="valorMin"
                          type="number"
                          value={valorMinimo}
                          onChange={(e) => setValorMinimo(e.target.value)}
                          placeholder="Ex: 300000"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="valorMax" className="text-xs font-medium">Valor Máximo (R$)</Label>
                        <Input
                          id="valorMax"
                          type="number"
                          value={valorMaximo}
                          onChange={(e) => setValorMaximo(e.target.value)}
                          placeholder="Ex: 750000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="quartosMin" className="text-xs font-medium">Mínimo de Quartos</Label>
                        <Input
                          id="quartosMin"
                          type="number"
                          value={quartosMinimo}
                          onChange={(e) => setQuartosMinimo(e.target.value)}
                          placeholder="Ex: 2"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="vagasMin" className="text-xs font-medium">Mínimo de Vagas</Label>
                        <Input
                          id="vagasMin"
                          type="number"
                          value={vagasMinimo}
                          onChange={(e) => setVagasMinimo(e.target.value)}
                          placeholder="Ex: 1"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bairros" className="text-xs font-medium">Bairros de Interesse (Separados por vírgula)</Label>
                        <Input
                          id="bairros"
                          value={bairrosInteresse}
                          onChange={(e) => setBairrosInteresse(e.target.value)}
                          placeholder="Ex: Centro, Jardins, Bela Vista"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="observacoes" className="text-xs font-medium">Observações Gerais</Label>
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                    placeholder="Anotações internas sobre o perfil, exigências específicas ou contexto do cliente..."
                    className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}

            {/* ABA 4: DADOS DE REPASSE BANCÁRIO / PIX (SE PROPRIETÁRIO) */}
            {activeTab === 'bancario' && isOwner && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-amber-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Dados Bancários e Chave Pix para Repasse de Aluguéis e Vendas
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="banco" className="text-xs font-medium">Banco / Instituição</Label>
                    <Input
                      id="banco"
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                      placeholder="Ex: 001 - Banco do Brasil ou Nubank"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="titularPix" className="text-xs font-medium">Nome do Titular da Conta</Label>
                    <Input
                      id="titularPix"
                      value={titularPix}
                      onChange={(e) => setTitularPix(e.target.value)}
                      placeholder="Nome completo conforme cadastro bancário"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="agencia" className="text-xs font-medium">Agência (com dígito se houver)</Label>
                    <Input
                      id="agencia"
                      value={agencia}
                      onChange={(e) => setAgencia(e.target.value)}
                      placeholder="Ex: 1234-5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="conta" className="text-xs font-medium">Número da Conta com Dígito</Label>
                    <Input
                      id="conta"
                      value={conta}
                      onChange={(e) => setConta(e.target.value)}
                      placeholder="Ex: 56789-0"
                    />
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4 space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground">Chave Pix para Repasses Imediatos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tipoChavePix" className="text-xs font-medium">Tipo de Chave Pix</Label>
                      <select
                        id="tipoChavePix"
                        value={tipoChavePix}
                        onChange={(e) => setTipoChavePix(e.target.value as any)}
                        className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="telefone">Telefone (com DDD)</option>
                        <option value="aleatoria">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="chavePix" className="text-xs font-medium">Chave Pix</Label>
                      <Input
                        id="chavePix"
                        value={chavePix}
                        onChange={(e) => setChavePix(e.target.value)}
                        placeholder="Informe a chave Pix correspondente"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer com Ações */}
          <div className="flex items-center justify-between border-t border-border bg-secondary/20 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Concluir Cadastro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
