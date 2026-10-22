---
title: Cérebro do produto — Pepius Imob
type: product-context
updated: 2026-10-21
tags: [pepius-imob, on-premise, imobiliárias, licenciamento, segurança]
---

# Pepius Imob — contexto canônico

Esta é a nota de contexto do produto dentro do repositório. Antes de alterar o escopo, confira esta nota e [[PLANO_ON_PREMISE]]. Depois de cada entrega, atualize a nota, [[RESUMO]] e a documentação afetada. Para decisões arquiteturais difíceis de reverter, consulte [[adr/0001-on-prem-postgresql-and-license-control-plane]] e [[adr/0002-auth-helpers-in-public-schema]]. A futura plataforma Pepius pertence a outro produto; seu objetivo fica em [[PLANO_CONTROL_PLANE_FUTURO]].

## Objetivo

Entregar a cada imobiliária uma instalação isolada em VM, com uma vitrine pública para imóveis e um painel gerencial autenticado para a própria equipe. A Pepius licencia o aplicativo por serviço central e publica versões. Imóveis, dados de contato e leads ficam na infraestrutura operada pelo cliente.

### Dentro do produto da imobiliária

- Vitrine responsiva: busca, lista, detalhe de imóveis e formulário de contato.
- Painel gerencial: imóveis, fotos, leads e personalização básica da vitrine.
- Uma instalação por imobiliária, com autenticação por usuário e tenant local.
- Supabase self-hosted em Docker Compose; banco PostgreSQL local.
- Licença assinada e validada localmente, heartbeat diário, tolerância de sete dias offline e exportação local.

### Fora deste produto

- Painel global do dono da Pepius, cadastro comercial de clientes, gestão de pagamentos e finanças.
- Gateway de pagamento, cobranças automatizadas e emissão fiscal.
- Inbox omnichannel, WhatsApp, calendário e IA.
- MySQL, SaaS multi-imobiliária ou dados de imóveis/leads enviados ao controle central.

## Arquitetura de instalação

```text
Navegador ── TLS/Caddy ── Pepius Imob (Next.js)
                               │
                               └── Supabase self-hosted (Kong/Auth/Storage/PostgreSQL)
                                      dados e objetos na VM do cliente

Agente de licença ── HTTPS ── API central Pepius
       │                           │
       └── PostgreSQL local        └── DB comercial e chave privada Ed25519
```

Durante desenvolvimento, usamos Supabase Cloud. Para cliente, usamos a stack oficial Supabase self-hosted em Docker Compose e PostgreSQL. `SUPABASE_INTERNAL_URL` atende chamadas server-side na rede Docker; `NEXT_PUBLIC_SUPABASE_URL` é a URL HTTPS pública de Kong. Caddy termina TLS e sobrescreve `X-Real-IP`. PostgreSQL/Studio não são publicados na Internet. Helpers de RLS ficam em `public` com `SECURITY DEFINER`, `search_path` vazio e lookup pelo usuário autenticado; migrations não alteram o schema protegido `auth`.
O Vercel Production está sendo usado temporariamente para avaliar o produto; não substitui uma instalação de cliente on-premise. `LICENSE_DEV_BYPASS=true` só funciona em `VERCEL_ENV=preview` ou no desenvolvimento local; Production exige uma lease assinada ativa. Preview deve usar credenciais e dados Supabase de desenvolvimento isolados.
Para abrir a vitrine de Preview sem consultar uma licença, configure `LICENSE_DEV_BYPASS=true` no escopo Preview do Vercel. Sem variáveis Supabase e tenant, a aplicação abre com catálogo vazio e autenticação desabilitada; o login volta a funcionar quando o Supabase é configurado. Para trabalhar com dados, configure no Preview `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `PEPIUS_TENANT_ID` e `LEAD_RATE_LIMIT_PEPPER`, todos ligados a um projeto de desenvolvimento isolado. Nunca copie credenciais de produção ou de clientes.

## Interface da vitrine

A rota inicial preserva a composição aprovada da marca Linha de Planta: navegação discreta, hero serifado, busca, destaques e rodapé. O conteúdo público é voltado a compradores e locatários; não deve prometer Inbox/IA nem vender cadastro self-service. A busca da home envia texto e finalidade para a listagem. Os tokens Tailwind da interface (`surface-*`, `text-*`, `border-*`, estados de erro/sucesso) são mapeados em `globals.css`; o tema escuro usa a classe `.dark` do `next-themes`.

## Segurança e dados

- O navegador recebe apenas a anon key do Supabase. Service-role, pepper, tokens de operadores e chave privada são server-side; a chave privada só existe na Pepius.
- O público não tem leitura direta das tabelas privadas. O servidor consulta imóveis com projeção explícita e retorna bairro/cidade, sem endereço completo ou CEP.
- Consultas usam PostgREST parametrizado. Zod valida corpos estritos, UUIDs, limites de texto/preço/imagens; uploads verificam assinatura do conteúdo e tenant proprietário.
- RLS limita registros à imobiliária; Storage privado guarda fotos por caminho de tenant e entrega URLs assinadas com expiração de cinco minutos (até uma hora para exportação).
- Leads públicos passam por honeypot e limite atômico por IP, cujo hash usa pepper local. O endpoint valida imóvel e licença antes de gravar; nenhum lead vai ao controle central.
- Autorização é revalidada no servidor e na política RLS; o proxy Next 16 é apenas uma ajuda de navegação. Campos devolvidos por APIs públicas são whitelisted.
- Operações comerciais são auditadas centralmente. Limites e resposta a incidentes estão em [[SEGURANCA]].

## Licenciamento

Uma instalação gera um par de chaves Ed25519 local. O operador emite um código de uso único e o cliente ativa localmente. A API central guarda hash do código e chave pública da instalação; entrega lease assinado com status, funcionalidades, validade e instalação. O banco local guarda o lease e a chave pública Pepius usada para validar a assinatura. A chave privada de assinatura não é distribuída.

Heartbeat é assinado pela chave da instalação e ocorre a cada 24h. O lease dura no máximo sete dias, o que permite operar offline por até sete dias. Pagamento vencido não suspende antes de 15 dias completos; a partir daí o central retorna lease suspenso, aplicado no próximo heartbeat. Se a rede ficar indisponível, o lease expirado bloqueia a vitrine e escritas. Em suspensão, painel em leitura e exportação continuam; os dados não são removidos. Pagamento registrado restaura na resposta do heartbeat seguinte. Suspensão manual pode ser imediata.

No modo suspenso, o app oculta a vitrine, bloqueia gravações no servidor e no RLS, mantém leitura do tenant no painel e oferece JSON com imóveis/leads e links assinados para fotos. Esses links expiram em até uma hora.

O licenciamento é uma regra de operação oficial e não proteção inviolável contra quem controla a VM/root. A licença não é kill switch remoto instantâneo: depende do próximo heartbeat ou do fim da validade local.

## Operação e responsabilidades

- **Cliente:** VM, domínio/DNS, credenciais locais, PostgreSQL, armazenamento de imagens, firewall, criptografia, backups, teste de restauração e acesso root.
- **Pepius:** serviço de licença, material privado de assinatura, tokens de operador, releases, migrations, documentação e correções do aplicativo.
- **Desenvolvimento:** Supabase Cloud de desenvolvimento. Nunca use credenciais de clientes nos ambientes de desenvolvimento.
- **Instalação:** Supabase Compose isolado + Compose Pepius; update com release/imagem versionada e migration revisada.

## Estado implementado e pontos de validação

- Vitrine usa dados do banco local; busca/lista/detalhe não usam mais mocks.
- Lead público é gravado e associado ao imóvel no tenant configurado.
- APIs gerenciais incluem CRUD de imóvel, imagens, status de lead, configurações whitelisted e exportação.
- As configurações de título, descrição e cores validadas são aplicadas na lista e nos detalhes públicos; a identidade da imobiliária vem do tenant local.
- Controle de licença inclui geração/administração CLI, código de ativação, assinatura, heartbeat e estado local.
- Admin global e Inbox foram removidos da instalação da imobiliária; API central de licença fica desabilitada nela.
- Dockerfiles/Compose de app e agente, Caddy e migrations separados foram adicionados.
- Testes locais cobrem assinatura, adulteração/validade, limite de atraso e heartbeat; validar RLS/SQL, provisionamento, instalação e restore em instância Supabase self-hosted antes de liberar cliente.

## Verificação desta entrega

- `npm run type-check`, `npm run lint`, `npm test` (7 testes) e `npm run build` passaram. O lint mantém cinco avisos de `<img>` em previews/URLs assinadas.
- `docker compose config` passou com o arquivo de exemplo. O daemon Docker não está disponível para validar Supabase self-hosted, RLS/pgTAP ou restore em VM. As migrations foram aplicadas com sucesso ao Supabase Cloud usado temporariamente para avaliação.
- `npm audit --omit=dev` não encontrou vulnerabilidades de runtime. O audit completo sinaliza cinco ocorrências high do advisory de `braces` no encadeamento de lint; atualizar forçando rebaixaria Next e não foi aplicado.

## Ambiente temporário de avaliação (21/10/2026)

Após autorização do proprietário, o Supabase Cloud atualmente associado ao Vercel Production está sendo usado temporariamente para avaliar a vitrine. Foi criado o tenant Linha de Planta, slug linha-de-planta-demonstracao, UUID 64377038-0f9c-40fa-bdac-cd928924f624. Ele contém 10 anúncios fictícios disponíveis em 10 cidades, distribuídos entre venda (4), locação (4) e ambas as finalidades (2). As descrições identificam os anúncios como demonstrativos. Não foram adicionadas imagens, então a vitrine usa o placeholder.

As variáveis de Production no Vercel foram atualizadas com URL, chaves Supabase, tenant e pepper. O Supabase CLI 2.121.0 foi autenticado e as nove migrations pendentes foram aplicadas; site_config existe, Storage de imagens está privado e RLS restringe acesso. Os 10 imóveis demonstrativos permanecem. O perfil global existente foi vinculado a esse tenant como imobiliaria_owner. O control plane temporário Pepius License Control usa o projeto Supabase `lwsnunuufkqmursocztg` (organização Free, região sa-east-1); a migration própria foi aplicada e as variáveis de assinatura/operação foram configuradas no ambiente local e em Vercel Production. As chaves legadas desse projeto foram desativadas após aparecerem no retorno do CLI; o serviço usa a chave `sb_secret` nova. O projeto Free pode pausar após período sem atividade e respeita o limite de dois projetos ativos gratuitos. Ainda falta publicar o deployment com essas variáveis e emitir/ativar a lease de avaliação; até isso ocorrer, Production continua fechada. Não apresentar os anúncios como inventário real; são dados temporários para avaliação.

## Manutenção do cérebro

Toda entrega de código deve atualizar esta nota e [[RESUMO]] com o comportamento real. Atualize plano, segurança, checklist e progresso quando forem afetados. Registre decisões de banco, protocolo, segurança, compatibilidade ou licenciamento em ADR. Mantenha documentos em UTF-8. Não reintroduza decisões antigas de SaaS, Inbox, IA ou MySQL sem rever o escopo com o usuário.

## Links do repositório

- [[PLANO_ON_PREMISE]] — escopo e implementação.
- [[REVISAO_MODULO_INICIAL]] — lacunas funcionais, segurança e operação identificadas para o MVP.
- [[SEGURANCA]] — controles, ameaças e responsabilidade operacional.
- [[GLOSSARY]] — termos do domínio.
- [[PLANO_CONTROL_PLANE_FUTURO]] — objetivo futuro da plataforma administrativa Pepius.
- [[RESUMO]] — estado atual do código e verificações.
- [[adr/0001-on-prem-postgresql-and-license-control-plane]] — decisão arquitetural aprovada.
- [[adr/0002-auth-helpers-in-public-schema]] — compatibilidade e segurança dos helpers de RLS.
