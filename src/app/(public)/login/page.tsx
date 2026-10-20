'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Buscar perfil via API server-side para evitar problemas de RLS no cliente
    const profileRes = await fetch('/api/auth/profile')

    if (!profileRes.ok) {
      const errData = await profileRes.json().catch(() => ({}))
      console.error('Erro ao buscar perfil:', errData)
      setError(errData.error || 'Perfil não encontrado. Contate o suporte.')
      setLoading(false)
      return
    }

    const profile = await profileRes.json()

    setLoading(false)
    if (profile.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <a href="/" className="text-lg font-bold tracking-tight text-accent">
          Pepius Imob
        </a>
        <ThemeToggle />
      </header>

      {/* Login form */}
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Entrar na sua conta
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Acesse o painel da sua imobiliária
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-text-primary"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-md border border-border-default bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text-primary"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border-default bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {error && (
              <div className="rounded-md bg-error-subtle px-3 py-2 text-sm text-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-text shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-text-tertiary">
            Não tem conta?{' '}
            <a
              href="/contato"
              className="font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Fale conosco
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}