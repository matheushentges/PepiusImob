# Progresso

Atualizado em 2026-10-21.

## Implementado

- Escopo do app imobiliário revisado para on-premise: vitrine e painel gerencial apenas.
- Vitrine passou de dados de demonstração para consulta server-side ao banco, com allowlist de campos públicos e Storage privado.
- Endpoint de lead, CRUD de imóveis/imagens, status de leads, personalização segura e exportação autenticada.
- RLS e migration local de lease, throttling de leads, remoção de policy pública permissiva, controle de perfil e remoção dos dados/admin/demo legados.
- Serviço/API de licença e migration central separados; CLI de operador, instalação e provisionamento.
- Comportamento de suspensão: bloquear vitrine/gravações, conservar painel em leitura/exportação e reativar pelo heartbeat.
- App/agent em Docker Compose, Caddy e guias de ambiente/backup.
- Vercel Preview aceita bypass de licença explícito para desenvolvimento; Vercel Production continua exigindo uma lease assinada.
- Plano on-premise, segurança, futuro control plane, glossário, resumo e ADR escritos em UTF-8.

## Validação concluída e pendente

- Passaram `npm test` (7 testes), `npm run lint` (cinco avisos de imagens, zero erros), `npm run type-check`, `npm run build` e `docker compose config` com valores de exemplo.
- `npm audit --omit=dev` reporta zero vulnerabilidades de runtime. O audit completo aponta cinco ocorrências high de `braces` em dependências de lint; correção forçada implicaria downgrade incompatível do Next.
- O Docker CLI está instalado, mas o daemon não responde; Supabase CLI também não está instalado. Migrations, pgTAP/RLS, instalação self-hosted e restore permanecem para validação numa VM/stack Docker ativa.
- O 404 atual do Vercel Production vem do bloqueio intencional quando a licença não pode ser validada; a chave Supabase server-side configurada em Production também retorna `Invalid API key`. Para abrir o Preview, basta `LICENSE_DEV_BYPASS=true` no escopo Preview; sem variáveis Supabase/tenant ele exibe catálogo vazio. Para dados reais de desenvolvimento, configure nesse escopo URL, anon key, service-role key server-side, `PEPIUS_TENANT_ID` e `LEAD_RATE_LIMIT_PEPPER` de um projeto isolado.
- Nesta correção passaram `npm run type-check`, `npm run lint` (cinco avisos preexistentes de `<img>`, zero erros) e `npm run build`. O primeiro type-check rodou em paralelo com o build e encontrou tipos temporários `.next` sendo removidos; repetido após o build, passou.
- Nenhuma migration foi aplicada ao Supabase Cloud. A migration on-premise remove estruturas/dados comerciais legados; exportar dados reais antes da primeira execução.

## Riscos/decisões a acompanhar

- Root do cliente pode adulterar software e relógio; licença não é DRM anti-root.
- Backup separado para Postgres e Storage é obrigação operacional do cliente.
- O release só deve ser liberado após ensaio de restore, dados e RLS entre tenants em VM isolada.
