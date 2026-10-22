import type { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getPublicSiteConfig } from '@/lib/public-listings'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como os dados enviados pelo formulário de contato são utilizados.',
}

export default async function PrivacyPage() {
  const siteConfig = await getPublicSiteConfig()

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ '--primary': siteConfig.primaryColor, '--accent': siteConfig.accentColor } as CSSProperties}
    >
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
            {siteConfig.agencyName}
          </Link>
          <Link href="/imoveis" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Ver imóveis
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Privacidade</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Esta política explica como {siteConfig.agencyName} trata os dados enviados pelo formulário de contato da vitrine.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Dados coletados</h2>
            <p className="mt-2">
              Ao enviar o formulário, coletamos nome, telefone, e-mail (opcional), mensagem (opcional), preferência de horário
              e o imóvel de interesse. O endereço IP não é gravado no contato: ele é convertido em um hash com chave local
              apenas para limitar envios abusivos.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Como usamos os dados</h2>
            <p className="mt-2">
              Os dados são usados exclusivamente para responder à sua solicitação, tirar dúvidas sobre o imóvel e, se você
              pedir, agendar uma visita. Não vendemos nem compartilhamos seus dados para publicidade.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Onde os dados ficam</h2>
            <p className="mt-2">
              Os contatos ficam no sistema da imobiliária, hospedado na infraestrutura local da própria agência. A Pepius não
              recebe nem armazena os dados dos seus contatos na API central de licença.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Retenção e exclusão</h2>
            <p className="mt-2">
              Mantemos os contatos pelo tempo necessário ao atendimento e ao cumprimento de obrigações legais. Você pode
              solicitar acesso, correção ou exclusão dos seus dados falando com a equipe da imobiliária pelos canais de
              atendimento usados na conversa.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Segurança</h2>
            <p className="mt-2">
              O acesso ao painel é restrito à equipe autorizada da imobiliária. As fotos são servidas por links temporários e
              os dados de contato não são exibidos na vitrine pública.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Cookies</h2>
            <p className="mt-2">
              A vitrine pública não usa cookies de marketing. Cookies de sessão existem apenas na área da imobiliária, para
              manter o login da equipe.
            </p>
          </section>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          Última atualização: outubro de 2026. Em caso de dúvida, fale com a equipe de {siteConfig.agencyName}.
        </p>

        <Link href="/" className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Voltar ao início
        </Link>
      </main>
    </div>
  )
}
