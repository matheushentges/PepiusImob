'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { Building2 } from 'lucide-react'

export default function RealtorLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!supabase) {
      setError('A autenticação não está configurada nesta instalação.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-accent">
          <Building2 className="h-5 w-5" aria-hidden="true" />
          Pepius Imob
        </Link>
        <ThemeToggle />
      </header>

      {/* Login form */}
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-subtle text-accent">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Acesso Imobiliária
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Entre no painel de gestão da sua imobiliária
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="realtor-email" className="text-sm font-medium text-text-primary">
                E-mail corporativo
              </label>
              <input
                id="realtor-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@suaimobiliaria.com.br"
                className="w-full rounded-md border border-border-default bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="realtor-password" className="text-sm font-medium text-text-primary">
                Senha
              </label>
              <input
                id="realtor-password"
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
              {loading ? 'Entrando...' : 'Acessar painel'}
            </button>
          </form>

          <div className="border-t border-border-subtle pt-4 text-center">
            <p className="text-xs text-text-tertiary">
              Ainda não é parceiro?{' '}
              <Link href="/contato" className="font-medium text-accent transition-colors hover:text-accent-hover">
                Conheça o Pepius Imob
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
