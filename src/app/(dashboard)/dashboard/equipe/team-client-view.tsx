'use client'

import { useState } from 'react'
import {
  UserPlus,
  Shield,
  UserCheck,
  Trash2,
  Mail,
  Calendar,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react'

export type TeamMember = {
  id: string
  nome: string | null
  email: string | null
  role: 'imobiliaria_owner' | 'imobiliaria_user'
  created_at: string
}

function generateRandomPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  let pass = ''
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

export function TeamClientView({
  initialMembers,
  currentUserId,
  currentUserRole,
}: {
  initialMembers: TeamMember[]
  currentUserId: string
  currentUserRole: 'imobiliaria_owner' | 'imobiliaria_user'
}) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form states
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'imobiliaria_user' | 'imobiliaria_owner'>('imobiliaria_user')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isOwner = currentUserRole === 'imobiliaria_owner'

  function openModal() {
    setNome('')
    setEmail('')
    setPassword(generateRandomPassword())
    setRole('imobiliaria_user')
    setErrorMessage(null)
    setSuccessMessage(null)
    setShowPassword(true)
    setIsModalOpen(true)
  }

  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/dashboard/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Erro ao cadastrar membro da equipe')
        return
      }

      setMembers((prev) => [...prev, data.member])
      setSuccessMessage('Membro da equipe adicionado com sucesso!')
      setTimeout(() => {
        setIsModalOpen(false)
        setSuccessMessage(null)
      }, 1500)
    } catch {
      setErrorMessage('Erro de conexão ao salvar membro')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteMember(memberId: string) {
    if (!confirm('Tem certeza que deseja remover este membro da equipe? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeletingId(memberId)
    try {
      const res = await fetch(`/api/dashboard/team/${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao remover membro')
        return
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch {
      alert('Erro de conexão ao remover membro')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Equipe e Acessos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os corretores e responsáveis autorizados a operar o painel da sua imobiliária.
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Adicionar Membro
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total de Membros</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{members.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Responsáveis (Owners)</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
            {members.filter((m) => m.role === 'imobiliaria_owner').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Corretores (Equipe)</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
            {members.filter((m) => m.role === 'imobiliaria_user').length}
          </p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Membro</th>
                <th className="px-5 py-3.5">E-mail</th>
                <th className="px-5 py-3.5">Perfil</th>
                <th className="px-5 py-3.5">Data de Entrada</th>
                {isOwner && <th className="px-5 py-3.5 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const isCurrentUser = member.id === currentUserId
                return (
                  <tr key={member.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                          {(member.nome || member.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{member.nome || 'Sem nome'}</span>
                            {isCurrentUser && (
                              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                Você
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{member.email}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {member.role === 'imobiliaria_owner' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                          <Shield className="h-3 w-3" />
                          Responsável
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                          <UserCheck className="h-3 w-3 text-muted-foreground" />
                          Corretor
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>
                          {new Date(member.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {isOwner && (
                      <td className="px-5 py-4 text-right">
                        {!isCurrentUser ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={deletingId === member.id}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40 cursor-pointer"
                            aria-label={`Remover ${member.nome || member.email}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remover</span>
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Principal</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="grid gap-3 md:hidden">
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId
          return (
            <div
              key={member.id}
              className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {(member.nome || member.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground text-sm">{member.nome || 'Sem nome'}</span>
                      {isCurrentUser && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                {member.role === 'imobiliaria_owner' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent shrink-0">
                    <Shield className="h-3 w-3" />
                    Responsável
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground shrink-0">
                    <UserCheck className="h-3 w-3 text-muted-foreground" />
                    Corretor
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                  Entrou em {new Date(member.created_at).toLocaleDateString('pt-BR')}
                </span>

                {isOwner && !isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member.id)}
                    disabled={deletingId === member.id}
                    className="inline-flex items-center gap-1 text-destructive hover:underline font-medium text-xs py-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h2 className="font-serif text-lg font-bold text-foreground">Novo Membro da Equipe</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@suaimobiliaria.com.br"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Senha Temporária
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateRandomPassword())}
                    className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Gerar nova senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-3 pr-10 text-sm font-mono text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground/70" />
                  Copie e envie esta senha ao novo membro para o primeiro acesso.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Perfil de Permissão
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex flex-col rounded-lg border p-3 cursor-pointer transition-colors ${
                      role === 'imobiliaria_user'
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-background hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="team_role"
                        value="imobiliaria_user"
                        checked={role === 'imobiliaria_user'}
                        onChange={() => setRole('imobiliaria_user')}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="text-xs font-semibold text-foreground">Corretor / Equipe</span>
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground pl-5">
                      Cadastra imóveis, gerencia fotos e atende leads recebidos.
                    </span>
                  </label>

                  <label
                    className={`flex flex-col rounded-lg border p-3 cursor-pointer transition-colors ${
                      role === 'imobiliaria_owner'
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-background hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="team_role"
                        value="imobiliaria_owner"
                        checked={role === 'imobiliaria_owner'}
                        onChange={() => setRole('imobiliaria_owner')}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="text-xs font-semibold text-foreground">Responsável</span>
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground pl-5">
                      Acesso total, configurações, licença e gestão da equipe.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Confirmar Cadastro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
