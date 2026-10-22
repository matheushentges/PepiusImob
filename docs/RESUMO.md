# Estado atual do Pepius Imob

Atualizado em 2026-10-22.

## Produto vigente

Aplicação on-premise de uma imobiliária por instalação: vitrine pública e painel gerencial com imóveis, fotos e leads. Desenvolvimento continua em Supabase Cloud; produção de cliente usa Supabase self-hosted com PostgreSQL local na VM. Não inclui painel administrativo Pepius, Inbox, IA ou MySQL.

A auditoria do que falta para o MVP está em [[REVISAO_MODULO_INICIAL]]. As lacunas P0/P1 de produto identificadas na revisão de 21/10 foram corrigidas no código em 22/10; a instalação e o licenciamento central ainda aguardam validação em ambiente real.

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
- A home mantém a composição aprovada Linha de Planta, consulta destaques locais e leva a busca por texto/finalidade para a listagem. Os tokens Tailwind usados pela vitrine, detalhes e painel estão registrados no tema; a alternância de tema claro/escuro foi corrigida com `@custom-variant dark (&:where(.dark, .dark *));` no Tailwind CSS v4, com tema claro definido como padrão (`defaultTheme="light"`, `enableSystem={false}`).
- Home usa título/subtítulo configurados no tenant, exibe destaques apenas quando existem e mostra venda e locação simultâneas com preços separados na vitrine e no detalhe. Imóveis podem ser marcados como destaque pelo painel (coluna `featured`).
- Painel de leads funcional: busca, filtro por status, estatísticas, modal de detalhe, alteração de status via API, tratamento da relação com imóvel e modo somente leitura com licença inativa.
- Painel de imóveis com busca e filtros reais de tipo/status, coluna de preço para venda, locação ou ambas, destaque visual e edição.
- Falhas de upload de fotos agora são contadas e exibidas (inclusive após redirect), e a capa só muda após confirmação do servidor. Uploads são re-encodados com `sharp`, removendo EXIF/GPS e limitando o lado maior a 2400 px; exclusão de imóvel remove os objetos do Storage.
- Navegação mobile e desktop do painel humanizada (`src/components/dashboard/dashboard-nav-links.tsx`): menus amigáveis ("Visão Geral", "Catálogo de Imóveis", "Contatos de Clientes", "Personalização do Site"), destaque da rota ativa via `usePathname` e atalho rápido "Site ↗" para a vitrine pública.
- Vitrine pública refinada: botão chamativo de login removido do cabeçalho; rodapé institucionalizado contendo hiperlink discreto `"Imobiliária"` direcionando para `/login`, além de seletor de tema acessível.
- Privacidade e LGPD: Banner de consentimento de cookies (`CookieConsentBanner`) persistido em `localStorage`, permitindo aceitar todos ou apenas essenciais; página `/privacidade` detalhada e formalmente em conformidade com a LGPD (Lei 13.709/2018), cobrindo controlador, base legal, direitos do titular, cookies e armazenamento on-premise.
- Gerenciamento e Ativação de Licença no Painel da Imobiliária (`/dashboard/licenca`): Interface dedicada construída com padrão Linha de Planta para a equipe acompanhar o status da licença (`Ativa`, `Aguardando Ativação`, `Suspensa`, `Expirada`), tempo restante em dias/horas com barra de progresso visual, datas de vigência/heartbeat e ID da instalação com cópia em um clique. Permite que o responsável da imobiliária (`imobiliaria_owner`) cole e submeta o código de ativação gerado pelo Portal de Licenças diretamente na interface via `POST /api/dashboard/licensing/activate` ou dispare a sincronização manual imediata via `POST /api/dashboard/licensing/sync`, sem necessidade de intervenção via terminal/CLI.
- Portal Administrativo de Licenças (`pepius-license-portal`) construído em repositório GitHub (`https://github.com/matheushentges/pepius-license-portal`) e pasta dedicada (`c:\Users\Matheus\Documents\pepius-license-portal`), totalmente desacoplado do código do sistema da imobiliária e publicado na Vercel (`https://pepius-license-portal.vercel.app`). Conectado e validado diretamente ao projeto Supabase **Pepius License Control** (`lwsnunuufkqmursocztg`, sa-east-1) utilizando as chaves ativas do novo padrão Supabase (`sb_publishable` e `sb_secret`), com chaves JWT legadas desativadas. Inclui autenticação de operadores via Supabase Auth SSR, visualização da conta de avaliação `Linha de Planta (Avaliacao)`, dashboard financeiro com MRR, emissão de licença com código de 7 dias, registro de pagamentos, suspensão/reativação manual e auditoria.

## Verificações automatizadas

`npm run type-check`, `npm run lint`, `npm test` (9 testes) e `npm run build` passaram em 22/10. O lint mantém cinco avisos de `<img>` e zero erros. `docker compose config` passou com valores de exemplo. `npm audit --omit=dev` encontrou zero vulnerabilidades; o audit completo reporta cinco ocorrências high de `braces` em dependências de lint (dev), sem correção não disruptiva disponível no lock atual.

A migration `20261022000001_property_featured.sql` foi validada com `npx supabase db push --dry-run` e aplicada ao Supabase Cloud de avaliação em 22/10, após backup/export das tabelas em `.local` (ignorado pelo Git). A coluna `featured` foi conferida por consulta.

A migration `20261022000002_cleanup_legacy_schema.sql` foi criada e aplicada em 22/10 após backup completo em `.local/backup-20261022-cleanup/`. Ela removeu fisicamente as 4 tabelas legadas órfãs de Inbox/IA (`messages`, `conversations`, `channels`, `ai_training_data`, todas com 0 registros) e eliminou as colunas legadas de SaaS de `tenants` (`subdomain`, `custom_domain`, `domain_verified`). O banco `PepiusImob` contém agora unicamente as 7 tabelas necessárias ao produto on-premise: `properties`, `profiles`, `tenants`, `local_license_state`, `leads`, `property_images` e `public_lead_rate_limits`. A pasta `license-control-plane` foi movida para o repositório dedicado do portal.

## Ainda necessário antes de produção

- Rodar todas as migrations em Supabase self-hosted limpa e validar grants/policies com anon, dois tenants, usuários e service-role.
- Validar provisionamento do tenant e usuário, ativação uma vez, reenvio idempotente, falha de API, sete dias offline, suspensão 15º dia, leitura/exportação e restauração.
- Validar Compose com stack Supabase oficial numa VM limpa, reboot, domínios, TLS, atualizações versionadas e rollback.
- Cifrar backup de PostgreSQL e Storage, restaurar ambos numa VM isolada e registrar evidência de teste.
- Fazer review de segurança, configurar segredos/rotação reais, monitoramento e política operacional.

## Ambiente de avaliação (2026-10-21)

- Por autorização do proprietário, o Supabase Cloud associado ao Vercel Production recebeu o tenant demonstrativo Linha de Planta (linha-de-planta-demonstracao) e 10 anúncios fictícios em 10 cidades; 4 venda, 4 locação e 2 ambas. Não há imagens, então as listagens usam placeholder.
- URL e chave pública Supabase de Production coincidem com o ambiente local. A chave de serviço, PEPIUS_TENANT_ID e LEAD_RATE_LIMIT_PEPPER foram atualizados nas variáveis Production do Vercel. O deploy de Produção foi realizado com sucesso em 22/10 (`https://pepius-imob.vercel.app`) contendo as correções de tema claro padrão, banner de cookies LGPD, política de privacidade, humanização de navegação e limpeza do banco de dados.
- Supabase CLI 2.121.0 foi autenticado e as dez migrations então existentes foram aplicadas. site_config e local_license_state existem. A migration de destaque `20261022000001_property_featured.sql` e de limpeza `20261022000002_cleanup_legacy_schema.sql` foram aplicadas com sucesso. O perfil existente foi associado ao tenant demonstrativo como imobiliaria_owner. Foi criado o projeto Supabase Free `lwsnunuufkqmursocztg` (sa-east-1) para Pepius License Control; o portal administrativo foi publicado em projeto Vercel próprio (`https://pepius-license-portal.vercel.app`).
- A migration removeu o tenant administrativo legado e a tabela de licenças comerciais vazia. Não havia imóveis, leads ou Storage ligados a ele; os 10 anúncios do tenant demonstrativo usam UUID distinto e foram preservados.

## Documentação canônica

- [[OBSIDIAN]] é o cérebro do produto.
- [[PLANO_ON_PREMISE]] é escopo/aceite.
- [[SEGURANCA]] define controles e operação.
- [[PLANO_CONTROL_PLANE_FUTURO]] registra o produto administrativo financeiro Pepius futuro.
- [[GLOSSARY]] e [[adr/0001-on-prem-postgresql-and-license-control-plane]] definem domínio e arquitetura; [[adr/0002-auth-helpers-in-public-schema]] registra o limite dos helpers de RLS.
