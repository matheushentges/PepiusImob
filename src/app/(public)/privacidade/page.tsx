import type { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ShieldCheck, Lock, Eye, Database, FileText, ChevronLeft, Cookie, UserCheck } from 'lucide-react'
import { getPublicSiteConfig } from '@/lib/public-listings'
import { ThemeToggle } from '@/components/theme-toggle'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Política de Privacidade & Proteção de Dados (LGPD)',
  description: 'Transparência sobre como tratamos e protegemos seus dados pessoais em conformidade com a LGPD.',
}

export default async function PrivacyPage() {
  const siteConfig = await getPublicSiteConfig()

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ '--primary': siteConfig.primaryColor, '--accent': siteConfig.accentColor } as CSSProperties}
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label={`${siteConfig.agencyName} — página inicial`}>
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              {siteConfig.agencyName}
            </span>
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
              Privacidade
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/imoveis"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver imóveis
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar à página inicial
          </Link>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <ShieldCheck className="h-4 w-4" /> Conformidade com a LGPD (Lei nº 13.709/2018)
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Política de Privacidade & Cookies
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A <strong>{siteConfig.agencyName}</strong> tem o compromisso de proteger a sua privacidade e tratar os seus dados com total transparência, segurança e respeito à legislação vigente.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-foreground">1. Controlador dos Dados Pessoais</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              O controlador dos seus dados pessoais é a <strong>{siteConfig.agencyName}</strong>. As decisões sobre o tratamento e a finalidade dos dados fornecidos por meio deste website são de responsabilidade exclusiva desta imobiliária.
            </p>
          </section>

          {/* Section 2 */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Eye className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-foreground">2. Dados Coletados e Finalidades</h2>
            </div>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Coletamos apenas os dados fornecidos voluntariamente por você ao preencher o formulário de contato sobre algum imóvel:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Nome e Sobrenome:</strong> Para identificação e tratamento personalizado no atendimento.</li>
                <li><strong>Telefone / WhatsApp:</strong> Para contato sobre o imóvel solicitado ou agendamento de visitas.</li>
                <li><strong>E-mail (opcional):</strong> Para envio de propostas, fichas técnicas ou esclarecimento de dúvidas.</li>
                <li><strong>Mensagem e Preferência de Horário:</strong> Para adequar o contato à sua conveniência.</li>
                <li><strong>Imóvel de Interesse:</strong> Código e detalhes do anúncio ao qual você solicitou informações.</li>
              </ul>
              <p className="pt-2 text-xs text-muted-foreground">
                <em>Nota de segurança:</em> Seu endereço IP não é vinculado ao seu cadastro de cliente; ele é processado de forma criptográfica e efêmera exclusivamente para prevenção contra envios automatizados (anti-spam).
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Cookie className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-foreground">3. Política de Cookies</h2>
            </div>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Nosso website prioriza a privacidade. Por essa razão:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Cookies Estritamente Necessários:</strong> Usados para manter a navegação íntegra, segurança de formulários e salvar sua preferência de modo claro/escuro.</li>
                <li><strong>Sem Rastreamento de Terceiros:</strong> Não instalamos pixels invasivos de publicidade nem vendemos seus hábitos de navegação para anunciantes.</li>
                <li><strong>Área Restrita da Equipe:</strong> Cookies de sessão autenticada existem unicamente no painel gerencial dos corretores e operadores.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-foreground">4. Onde os Dados Ficam Armazenados</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Este sistema opera sob a arquitetura <strong>on-premise</strong>. Isso significa que os dados de contatos e imóveis residem de forma isolada no servidor sob governança da <strong>{siteConfig.agencyName}</strong>. A plataforma Pepius não armazena nem centraliza os dados dos seus leads imobiliários em bancos externos.
            </p>
          </section>

          {/* Section 5 */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <UserCheck className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-foreground">5. Direitos do Titular (Art. 18 da LGPD)</h2>
            </div>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                A qualquer momento e sem custos, você pode solicitar à imobiliária:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Confirmação da existência de tratamento dos seus dados.</li>
                <li>Acesso aos dados pessoais arquivados em seu histórico de contato.</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
                <li>Eliminação dos dados pessoais tratados mediante consentimento.</li>
                <li>Revogação do consentimento para novas comunicações.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-foreground">6. Segurança e Retenção</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Adotamos protocolos rígidos de segurança, controle estrito de autenticação e criptografia para evitar vazamento ou acesso indevido. Mantemos seus dados apenas pelo período necessário para atender sua solicitação imobiliária e cumprir eventuais prazos prescricionais legais.
            </p>
          </section>
        </div>

        {/* Footer contact info */}
        <div className="mt-12 rounded-xl border border-border/70 bg-secondary/50 p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground">Dúvidas ou solicitações sobre seus dados?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Entre em contato direto com a equipe de atendimento da {siteConfig.agencyName}.
            </p>
          </div>
          <Link
            href="/"
            className="mt-4 sm:mt-0 inline-flex h-10 items-center justify-center rounded-md bg-accent px-5 text-xs font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
          >
            Falar com a imobiliária
          </Link>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border bg-card py-10 mt-16">
        <div className="container mx-auto flex flex-col items-center justify-between gap-5 px-4 text-center md:flex-row md:px-6 md:text-left">
          <div>
            <p className="font-serif text-lg font-semibold tracking-tight text-foreground">{siteConfig.agencyName}</p>
            <p className="mt-1 text-sm text-muted-foreground">Imóveis para venda e locação</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
              Início
            </Link>
            <Link href="/imoveis" className="text-muted-foreground transition-colors hover:text-foreground">
              Vitrine de Imóveis
            </Link>
            <Link href="/privacidade" className="font-medium text-foreground">
              Privacidade
            </Link>
            <Link href="/login" className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground">
              Imobiliária
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.agencyName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
