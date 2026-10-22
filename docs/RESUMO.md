# Estado atual do Pepius Imob

Atualizado em 2026-10-21.

## Produto vigente

Aplicação on-premise de uma imobiliária por instalação: vitrine pública e painel gerencial com imóveis, fotos e leads. Desenvolvimento continua em Supabase Cloud; produção de cliente usa Supabase self-hosted com PostgreSQL local na VM. Não inclui painel administrativo Pepius, Inbox, IA ou MySQL.

A auditoria do que falta para o MVP está em [[REVISAO_MODULO_INICIAL]]. As páginas e APIs já existem, mas a gestão pela tela ainda está parcial e a instalação/licenciamento central aguardam validação real.

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
- A home mantém a composição aprovada Linha de Planta, consulta destaques locais e leva a busca por texto/finalidade para a listagem. Os tokens Tailwind usados pela vitrine, detalhes e painel estão registrados no tema; o seletor claro/escuro funciona com `.dark`.

## Verificações automatizadas

`npm run type-check`, `npm run lint`, `npm test` (7 testes) e `npm run build` passaram na revisao anterior. Nesta correção também passaram type-check, lint e build; o lint mantém cinco avisos de `<img>` e zero erros. `docker compose config` passou com valores de exemplo. `npm audit --omit=dev` encontrou zero vulnerabilidades; o audit completo reporta cinco ocorrencias high de `braces` em dependencias de lint (dev), sem correcao nao disruptiva disponivel no lock atual.

## Ainda necessário antes de produção

- Rodar migrations em Supabase self-hosted limpa e validar grants/policies com anon, dois tenants, usuários e service-role.
- Validar provisionamento do tenant e usuário, ativação uma vez, reenvio idempotente, falha de API, sete dias offline, suspensão 15º dia, leitura/exportação e restauração.
- Validar Compose com stack Supabase oficial numa VM limpa, reboot, domínios, TLS, atualizações versionadas e rollback.
- Cifrar backup de PostgreSQL e Storage, restaurar ambos numa VM isolada e registrar evidência de teste.
- Fazer review de segurança, configurar segredos/rotação reais, monitoramento e política operacional.

## Ambiente de avaliação (2026-10-21)

- Por autorização do proprietário, o Supabase Cloud associado ao Vercel Production recebeu o tenant demonstrativo Linha de Planta (linha-de-planta-demonstracao) e 10 anúncios fictícios em 10 cidades; 4 venda, 4 locação e 2 ambas. Não há imagens, então as listagens usam placeholder.
- URL e chave pública Supabase de Production coincidem com o ambiente local. A chave de serviço, PEPIUS_TENANT_ID e LEAD_RATE_LIMIT_PEPPER foram atualizados nas variáveis Production do Vercel. Ainda não foi feito deploy.
- Supabase CLI 2.121.0 foi autenticado e todas as nove migrations da imobiliária foram aplicadas. site_config e local_license_state existem; a lease ainda está vazia. O perfil existente foi associado ao tenant demonstrativo como imobiliaria_owner. Foi criado o projeto Supabase Free `lwsnunuufkqmursocztg` (sa-east-1) para Pepius License Control; a migration central foi aplicada, as variáveis privadas foram configuradas em Vercel Production e as chaves JWT legadas do projeto central foram desativadas. O plano Free não gera cobrança recorrente, permite dois projetos ativos e pode pausar projetos após inatividade. Ainda faltam novo deployment e emissão/ativação de uma lease de avaliação; Production segue fechada até a lease ser gravada.
- A migration removeu o tenant administrativo legado e a tabela de licenças comerciais vazia. Não havia imóveis, leads ou Storage ligados a ele; os 10 anúncios do tenant demonstrativo usam UUID distinto e foram preservados.

## Documentação canônica

- [[OBSIDIAN]] é o cérebro do produto.
- [[PLANO_ON_PREMISE]] é escopo/aceite.
- [[SEGURANCA]] define controles e operação.
- [[PLANO_CONTROL_PLANE_FUTURO]] registra o produto administrativo financeiro Pepius futuro.
- [[GLOSSARY]] e [[adr/0001-on-prem-postgresql-and-license-control-plane]] definem domínio e arquitetura; [[adr/0002-auth-helpers-in-public-schema]] registra o limite dos helpers de RLS.
