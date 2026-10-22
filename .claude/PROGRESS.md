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
- Docker CLI instalado, mas o daemon não responde. Supabase CLI 2.121.0 autenticada e vinculada ao projeto PepiusImob; as nove migrations pendentes foram aplicadas e o histórico local/remoto está sincronizado. Supabase local/self-hosted, pgTAP/RLS em VM e restore ainda exigem uma stack Docker ativa.
- O 404 do Vercel Production continua porque a instalação não tem lease Ed25519 ativa. A chave de serviço Supabase server-side foi corrigida e validada. O bypass permanece bloqueado em Production; Preview continua restrito ao branch de desenvolvimento e sem credenciais/tenant próprios mostra catálogo vazio.
- O primeiro deploy Preview falhou porque o provider global inicializava o Supabase durante prerender sem variáveis configuradas. O cliente browser agora é opcional quando não há URL/chave; o login falha fechado com mensagem, e a vitrine pode abrir vazia. Nesta correção passaram `npm run type-check`, `npm run lint` (cinco avisos preexistentes de `<img>`, zero erros) e `npm run build`.
- A reclamação visual identificou a home substituída por redirect e tokens Tailwind de superfície/texto/borda não mapeados no tema. A composição original da home foi restaurada/adaptada ao produto da imobiliária; busca envia texto e finalidade à listagem; tema mapeia tokens e respeita `.dark`. Build/type-check/lint passam, e a saída CSS contém classes antes ausentes como `bg-surface-base` e `text-text-primary`.
- As migrations foram aplicadas ao Supabase Cloud temporário. O seed SaaS foi removido, RLS foi fechado durante a transição, helpers foram movidos de auth para public com search_path vazio e Storage de imagens ficou privado. Local on-prem ainda precisa de ensaio em VM.

- 21/10/2026: após autorização expressa, o Supabase Cloud ligado ao Vercel Production recebeu tenant temporário Linha de Planta (UUID 64377038-0f9c-40fa-bdac-cd928924f624) e 10 imóveis fictícios em 10 cidades: 4 venda, 4 locação, 2 ambas. Sem imagens; vitrine usa placeholder. Tenant gravado em PEPIUS_TENANT_ID no .env.local.
- Vercel Production tem URL, chave pública, chave de serviço server-side, tenant e pepper atualizados. O banco da imobiliária contém site_config e local_license_state; a lease ainda está vazia. Foi criado o projeto central Supabase Free `lwsnunuufkqmursocztg` em sa-east-1, aplicada a migration do control plane e configuradas as variáveis de assinatura/operação no Vercel Production e em `.env.local`. As chaves JWT legadas do projeto central foram desativadas após aparecerem no retorno do CLI; o control plane usa a chave secreta nova. O Free pode pausar após inatividade e permite dois projetos ativos. Ainda falta deployment com as novas variáveis e lease de avaliação para liberar Production.
- A revisão antes da migration encontrou um tenant administrativo legado sem imóveis, leads, licenças ou Storage. A migration removeu esse tenant e a tabela de licenças comerciais vazia. O perfil global foi vinculado como imobiliaria_owner ao tenant demonstrativo; os 10 imóveis permaneceram.

## Riscos/decisões a acompanhar

- Root do cliente pode adulterar software e relógio; licença não é DRM anti-root.
- Backup separado para Postgres e Storage é obrigação operacional do cliente.
- O release só deve ser liberado após ensaio de restore, dados e RLS entre tenants em VM isolada.
