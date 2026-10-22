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
- Vitrine pública refinada: botão chamativo de login removido do cabeçalho; rodapé institucionalizado contendo hiperlink - Banner de consentimento de cookies (`CookieConsentBanner`) persistido em `localStorage`, permitindo aceitar todos ou apenas essenciais; página `/privacidade` detalhada e formalmente em conformidade com a LGPD (Lei 13.709/2018), cobrindo controlador, base legal, direitos do titular, cookies e armazenamento on-premise.
- Responsividade Mobile Integral (Vitrine & Painel Administrativo):
  - Viewport padrão Next.js App Router configurado em `src/app/layout.tsx` (`export const viewport: Viewport`), eliminando zoom-out virtual e garantindo renderização 1:1 em dispositivos móveis (320px–428px).
  - Vitrine Pública: Cabeçalho mobile limpo em linha única de 64px, hero com busca empilhável ergonomicamente, pills de filtro rápido touch-friendly, listagem com filtros flexíveis, carrossel de fotos fluido e banner de cookies e botão flutuante de contato (`ContactFab`) ajustados para nunca sobrepor ou estourar a tela.
  - Painel da Imobiliária: Tabelas de Imóveis e Leads transformadas em lista de **Cards Mobile** (`md:hidden`) com tipografia hierárquica, dados essenciais, preços em destaque, atalhos diretos de ligação (`tel:`) e e-mail (`mailto:`) para leads, preservando a tabela clássica completa para desktop (`hidden md:block`).
  - Menu Mobile do Dashboard (`MobileNav`): Ícones mapeados (incluindo `KeyRound` para licença), áreas de clique confortáveis (touch targets >= 44px) e fechamento suave.
  - Modais e Formulários: Modais de atendimento de lead operam como bottom-sheets fluidos com rolagem interna, e botões de ação nos formulários de cadastro e edição de imóveis empilham com largura total em smartphones.
- Gerenciamento e Ativação de Licença no Painel da Imobiliária (`/dashboard/licenca`): Interface dedicada construída com padrão Linha de Planta para a equipe acompanhar o status da licença (`Ativa`, `Aguardando Ativação`, `Suspensa`, `Expirada`), tempo restante em dias/horas com barra de progresso visual, datas de vigência/heartbeat e ID da instalação com cópia em um clique. Permite que o responsável da imobiliária (`imobiliaria_owner`) cole e submeta o código de ativação gerado pelo Portal de Licenças diretamente na interface via `POST /api/dashboard/licensing/activate` ou dispare a sincronização manual imediata via `POST /api/dashboard/licensing/sync`, sem necessidade de intervenção via terminal/CLI.
- Diagramas Visuais e Modelagem de Arquitetura em [[OBSIDIAN]]:
  - **Diagrama de Estrutura Geral do Sistema (Mermaid `flowchart TB`):** Ilustra a separação completa entre a VM On-Premise do cliente (Caddy, Next.js 16, PostgreSQL local, Storage privado, Auth) e o Control Plane Central Pepius (`pepius-license-portal`, API Central de Licenciamento e DB Central de Licenças), demonstrando que o tráfego de dados de imóveis e leads jamais sai da máquina do cliente.
  - **Diagrama de Sequência de Ativação e Heartbeat (Mermaid `sequenceDiagram`):** Mapeia o handshake criptográfico assimétrico Ed25519 em 3 fases: Emissão do código de ativação de uso único (32 hex) no portal central -> Ativação via interface web do painel da imobiliária (`/dashboard/licenca`) -> Ciclo de sincronização diária silenciosa (*heartbeat* a cada 24h) com renovação de lease assinada.
  - **Diagrama de Estados do Ciclo de Vida da Instalação (Mermaid `stateDiagram-v2`):** Mapeia a resiliência operacional cobrindo os estados `AguardandoAtivacao`, `Ativa` (`OperacaoNormal`, `ToleranciaOffline` de até 7 dias sem internet, `CarenciaPagamento` de até 15 dias sem bloqueio), `Expirada` e `Suspensa` (com ativação do modo somente leitura e exportação JSON/fotos, garantindo que os dados da imobiliária nunca sejam apagados).
  - **Pitch Explicativo Didático de 2 Minutos:** Guia estruturado em 4 pilares (Soberania On-Premise, Criptografia Ed25519 sem invasão de privacidade, Tolerância Offline e Não Destrutividade) para explicar o produto a leigos, clientes ou investidores com facilidade.


## Verificações automatizadas

`npm run type-check`, `npm test` (14 testes) e `npm run build` passaram em 22/10 com 100% de sucesso. Zero erros ou warnings bloqueantes.

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
