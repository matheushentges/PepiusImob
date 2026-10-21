# Estado atual do Pepius Imob

Atualizado em 2026-10-21.

## Produto vigente

Aplicação on-premise de uma imobiliária por instalação: vitrine pública e painel gerencial com imóveis, fotos e leads. Desenvolvimento continua em Supabase Cloud; produção de cliente usa Supabase self-hosted com PostgreSQL local na VM. Não inclui painel administrativo Pepius, Inbox, IA ou MySQL.

## Implementado no código

- Vitrine dinâmica usa banco, filtros e detalhe; a saída pública omite endereço completo/CEP e mídia usa URLs assinadas.
- Contato público valida imóvel/tenant/licença, limita submissões, impede logs com PII e grava lead localmente.
- CRUD de imóveis e imagens, consulta/status de leads, personalização básica whitelisted e exportação de dados autenticada.
- Auth server-side/RLS, perfis de imobiliária e provisionamento inicial via CLI local.
- Lease Ed25519, código de ativação de uso único, heartbeat, validação local, CLI de operador, API central separada e auditada.
- Em lease suspensa/expirada, vitrine/gravações bloqueadas e painel em leitura com exportação; dados locais não são removidos.
- Admin global e Inbox removidos do app imobiliário. Feature flag da API central permanece desabilitada para o cliente.
- Docker standalone, Compose do app/agente, Caddy/TLS e documentação de setup/segurança/roadmap/ADR.
- O bypass de licença é permitido localmente e em Vercel Preview explicitamente configurado; Vercel Production continua exigindo lease assinada.
- Para abrir um Preview sem banco, basta configurar `LICENSE_DEV_BYPASS=true` no ambiente Preview; com Supabase de desenvolvimento, configurar URL, anon key, service-role key server-side e tenant isolado.
- Sem credenciais Supabase, a vitrine renderiza catálogo vazio e o login informa que autenticação não está configurada; nenhuma sessão ou acesso gerencial é concedido.

## Verificações automatizadas

`npm run type-check`, `npm run lint`, `npm test` (7 testes) e `npm run build` passaram na revisao anterior. Nesta correção também passaram type-check, lint e build; o lint mantém cinco avisos de `<img>` e zero erros. `docker compose config` passou com valores de exemplo. `npm audit --omit=dev` encontrou zero vulnerabilidades; o audit completo reporta cinco ocorrencias high de `braces` em dependencias de lint (dev), sem correcao nao disruptiva disponivel no lock atual.

## Ainda necessário antes de produção

- Rodar migrations em Supabase self-hosted limpa e validar grants/policies com anon, dois tenants, usuários e service-role.
- Validar provisionamento do tenant e usuário, ativação uma vez, reenvio idempotente, falha de API, sete dias offline, suspensão 15º dia, leitura/exportação e restauração.
- Validar Compose com stack Supabase oficial numa VM limpa, reboot, domínios, TLS, atualizações versionadas e rollback.
- Cifrar backup de PostgreSQL e Storage, restaurar ambos numa VM isolada e registrar evidência de teste.
- Fazer review de segurança, configurar segredos/rotação reais, monitoramento e política operacional.

## Documentação canônica

- [[OBSIDIAN]] é o cérebro do produto.
- [[PLANO_ON_PREMISE]] é escopo/aceite.
- [[SEGURANCA]] define controles e operação.
- [[PLANO_CONTROL_PLANE_FUTURO]] registra o produto administrativo financeiro Pepius futuro.
- [[GLOSSARY]] e [[adr/0001-on-prem-postgresql-and-license-control-plane]] definem domínio/decisões.
