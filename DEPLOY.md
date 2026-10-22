# Deploy do Pepius Imob

Este repositório entrega uma aplicação on-premise: uma imobiliária por instalação, rodando com Supabase self-hosted e PostgreSQL local na VM do cliente. Vercel não é o ambiente de produção comercial.

## Produção (on-premise)

O guia canônico é [`supabase/SETUP.md`](supabase/SETUP.md). Resumo:

1. Instale o stack oficial do Supabase self-hosted na VM da imobiliária com versões fixadas.
2. Aplique as migrations em `supabase/migrations/` com `npx supabase db push --dry-run` antes do push real.
3. Copie `.env.onprem.example` para `.env.onprem` e configure domínio, chaves locais, `PEPIUS_TENANT_ID`, pepper de rate limit e chave pública de licença.
4. Suba o app, Caddy e o agente com `deployment/docker-compose.yml`.
5. Provisione o tenant e o responsável com `scripts/agency-provision.mjs`.
6. Ative a instalação com um código de uso único emitido pelo control plane Pepius.
7. Faça backup criptografado de PostgreSQL e Storage e teste o restore numa VM isolada antes de liberar o cliente.


## Preview na Vercel

A Vercel é usada apenas para demonstração e revisão visual:

- Configure `LICENSE_DEV_BYPASS=true` e um projeto Supabase de desenvolvimento isolado. Nunca use dados ou credenciais de clientes.
- `VERCEL_ENV=production` ignora o bypass; produção exige lease assinada.
- Sem credenciais Supabase, a vitrine renderiza catálogo vazio e o login informa que a autenticação não está configurada.

## O que não faz parte deste produto

Painel administrativo Pepius, cobrança, gateway financeiro, Inbox omnichannel e IA são escopos separados. Não configure webhooks da Meta nem variáveis de IA nesta aplicação.

## Verificação antes de publicar

```bash
npm run type-check
npm run lint
npm test
npm run build
docker compose --env-file .env.onprem -f deployment/docker-compose.yml config
```

Migrations destrutivas exigem revisão e backup. Nunca aplique migrations em uma instalação com dados reais sem dry-run e exportação prévia.
