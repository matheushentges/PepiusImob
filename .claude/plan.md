# Plano de Implementação - Pepius Imob

## Visão Geral
Sistema SaaS para imobiliárias com três interfaces distintas: portal do cliente, portal da imobiliária e portal administrativo.

## Stack Tecnológica

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript** 
- **TailwindCSS** + **Shadcn/ui**
- **React Hook Form** + **Zod**
- **Tanstack Query** (cache e estado do servidor)

### Backend
- **Supabase**:
  - PostgreSQL (banco de dados)
  - Auth (autenticação)
  - Storage (upload de imagens)
  - Row Level Security (RLS) para multi-tenancy

### Omnichannel & IA
- **Meta Business API** (WhatsApp + Instagram + Messenger)
- **Anthropic Claude API** ou **OpenAI GPT** (agente IA)
- **Webhooks** (receber mensagens dos canais)
- **Vercel Edge Functions** ou **Supabase Edge Functions** (processamento)
- **Queue System** (processamento assíncrono de mensagens)

### Deploy
- **Vercel** (frontend + API routes)
- **Supabase Cloud** (backend + edge functions)

## Arquitetura do Sistema

### 1. Multi-Tenancy
Cada imobiliária será um tenant isolado com seus próprios dados:
- RLS no PostgreSQL para isolamento
- Campo `tenant_id` em todas as tabelas relevantes
- Usuários vinculados a tenants específicos

### 2. Três Interfaces

#### Portal do Cliente (Público)
- `/` - Landing page
- `/imoveis` - Listagem de imóveis
- `/imoveis/[id]` - Detalhes do imóvel
- `/imoveis/busca` - Busca avançada
- `/contato` - Formulário de contato

#### Portal da Imobiliária (Autenticado)
- `/dashboard` - Dashboard da imobiliária
- `/dashboard/imoveis` - Gestão de imóveis
- `/dashboard/imoveis/novo` - Cadastrar imóvel
- `/dashboard/imoveis/[id]` - Editar imóvel
- `/dashboard/leads` - Leads/contatos recebidos
- `/dashboard/inbox` - Inbox unificado (todas as conversas)
- `/dashboard/inbox/[conversationId]` - Conversa específica
- `/dashboard/configuracoes` - Configurações da conta
- `/dashboard/configuracoes/canais` - Integração de canais

#### Portal Admin (Super Admin)
- `/admin` - Dashboard administrativo
- `/admin/imobiliarias` - Gestão de imobiliárias
- `/admin/imobiliarias/nova` - Cadastrar imobiliária
- `/admin/licencas` - Gestão de licenças
- `/admin/usuarios` - Gestão de usuários

### 3. Sistema de Roles
- **admin** - Acesso total ao sistema
- **imobiliaria_owner** - Dono da imobiliária (acesso completo ao tenant)
- **imobiliaria_user** - Usuário da imobiliária (acesso limitado)
- **cliente** - Cliente final (visualização pública)

## Modelo de Dados

### Tabela: tenants (imobiliárias)
```sql
- id (uuid, PK)
- nome (text)
- slug (text, unique) - URL amigável
- email (text)
- telefone (text)
- logo_url (text)
- active (boolean) - ativo/inativo
- license_expires_at (timestamp) - data de expiração da licença
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela: profiles (usuários)
```sql
- id (uuid, PK, FK -> auth.users)
- tenant_id (uuid, FK -> tenants) - null para admin
- role (enum: admin, imobiliaria_owner, imobiliaria_user, cliente)
- nome (text)
- email (text)
- telefone (text)
- avatar_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela: properties (imóveis)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK -> tenants)
- titulo (text)
- descricao (text)
- tipo (enum: casa, apartamento, terreno, comercial, rural)
- finalidade (enum: venda, locacao, ambos)
- status (enum: disponivel, vendido, alugado, reservado)
- preco_venda (decimal)
- preco_locacao (decimal)
- endereco (text)
- cidade (text)
- estado (text)
- cep (text)
- bairro (text)
- area_total (decimal)
- area_construida (decimal)
- quartos (integer)
- banheiros (integer)
- vagas_garagem (integer)
- caracteristicas (jsonb) - array de características extras
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela: property_images (imagens dos imóveis)
```sql
- id (uuid, PK)
- property_id (uuid, FK -> properties)
- url (text)
- ordem (integer) - ordem de exibição
- is_cover (boolean) - imagem principal
- created_at (timestamp)
```

### Tabela: leads (contatos/interesse)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK -> tenants)
- property_id (uuid, FK -> properties, nullable)
- nome (text)
- email (text)
- telefone (text)
- mensagem (text)
- status (enum: novo, em_contato, convertido, perdido)
- created_at (timestamp)
```

### Tabela: licenses (licenças/assinaturas)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK -> tenants)
- plano (enum: basico, profissional, premium)
- valor (decimal)
- inicio (timestamp)
- fim (timestamp)
- active (boolean)
- created_at (timestamp)
```

### Tabela: channels (canais integrados)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK -> tenants)
- tipo (enum: whatsapp, instagram, messenger, webchat)
- nome (text) - nome do canal (ex: "WhatsApp Comercial")
- config (jsonb) - configurações específicas do canal
  {
    "phone_number_id": "...", // WhatsApp
    "access_token": "...",
    "instagram_account_id": "...", // Instagram
    "page_id": "...", // Messenger
    "webhook_verify_token": "..."
  }
- active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela: conversations (conversas)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK -> tenants)
- channel_id (uuid, FK -> channels)
- external_id (text) - ID externo do canal (WhatsApp sender, IG user_id, etc)
- contact_name (text) - nome do contato
- contact_phone (text)
- contact_email (text)
- property_id (uuid, FK -> properties, nullable) - imóvel de interesse
- status (enum: ativo, arquivado, spam)
- last_message_at (timestamp)
- assigned_to (uuid, FK -> profiles, nullable) - usuário responsável
- is_bot_active (boolean) - se o bot está ativo nesta conversa
- metadata (jsonb) - informações extras do contato
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabela: messages (mensagens)
```sql
- id (uuid, PK)
- conversation_id (uuid, FK -> conversations)
- external_id (text) - ID da mensagem no canal externo
- sender_type (enum: customer, agent, bot)
- sender_id (uuid, FK -> profiles, nullable) - se for agent
- content (text)
- content_type (enum: text, image, video, audio, document, location)
- media_url (text, nullable)
- metadata (jsonb) - dados extras (coordenadas, etc)
- status (enum: sent, delivered, read, failed)
- created_at (timestamp)
```

### Tabela: ai_training_data (dados de treinamento)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK -> tenants)
- tipo (enum: faq, script, knowledge_base)
- pergunta (text)
- resposta (text)
- categoria (text)
- active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

## Arquitetura Omnichannel com IA

### Fluxo de Mensagens

#### 1. Recebimento (Inbound)
```
Cliente envia mensagem (WhatsApp/Instagram/Messenger/Site)
    ↓
Webhook recebe a mensagem (API Route /api/webhooks/[channel])
    ↓
Valida e processa a mensagem
    ↓
Salva no banco (conversations + messages)
    ↓
Envia para processamento IA (se bot ativo)
    ↓
IA gera resposta baseada em:
    - Contexto da conversa
    - Base de conhecimento (imóveis)
    - FAQs e scripts
    ↓
Envia resposta automaticamente
    ↓
Salva resposta no banco
    ↓
Notifica dashboard em tempo real (websocket)
```

#### 2. Envio (Outbound)
```
Agente humano responde pelo dashboard
    ↓
API valida e processa
    ↓
Desativa bot temporariamente (modo humano)
    ↓
Envia via API do canal
    ↓
Salva no banco
    ↓
Atualiza status da mensagem
```

### Capabilities do Agente IA

1. **Responder perguntas gerais**
   - Horário de funcionamento
   - Localização
   - Serviços oferecidos

2. **Consultar imóveis**
   - Buscar por tipo, bairro, preço
   - Enviar detalhes e fotos
   - Agendar visitas

3. **Capturar leads**
   - Coletar nome, telefone, email
   - Entender interesse
   - Criar lead no sistema

4. **Escalação inteligente**
   - Detectar quando precisa de humano
   - Transferir conversa
   - Notificar equipe

5. **Contextual e Personalizado**
   - Lembrar conversa anterior
   - Adaptar tom ao canal
   - Multi-idioma (se necessário)

### Integrações Necessárias

#### WhatsApp Business API
- Webhook para receber mensagens
- Send Message API
- Media API (imagens, documentos)
- Template Messages (aprovados pelo Meta)

#### Instagram Messaging API
- Webhook para DMs e comentários
- Send API
- Media handling

#### Facebook Messenger API
- Webhook
- Send API
- Persona/Page setup

#### Webchat (próprio)
- WebSocket ou Server-Sent Events
- Widget embarcável
- Histórico de conversas

### Configuração por Tenant

Cada imobiliária pode:
- Ativar/desativar canais
- Configurar credenciais de cada canal
- Personalizar comportamento do bot
- Definir FAQs e scripts
- Escolher quando bot deve escalar para humano
- Horário de atendimento (bot sempre/humano em horário comercial)

## ✅ PROGRESSO DO DESENVOLVIMENTO

### ✅ Fase 1: Estrutura Base (Setup) - COMPLETO
**Status**: 100% ✅ | **Data**: 06/10/2024

#### Realizações:
- ✅ Projeto Next.js 14+ inicializado com TypeScript
- ✅ TailwindCSS configurado
- ✅ Shadcn/ui configurado (components.json)
- ✅ Supabase client, server e middleware criados
- ✅ Estrutura completa de pastas criada
- ✅ Variáveis de ambiente (.env.local, .env.example)
- ✅ Utilidades (cn helper)
- ✅ Tipos TypeScript base
- ✅ Git inicializado e configurado
- ✅ README.md criado

**Arquivos Criados**:
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/utils.ts`
- `src/middleware.ts`
- `src/types/database.types.ts`
- `.env.local`, `.env.example`
- `components.json`

---

### ✅ Fase 2: Database & Auth - COMPLETO
**Status**: 100% ✅ | **Data**: 06/10/2024

#### Realizações:
- ✅ Schema completo do banco de dados (11 tabelas)
- ✅ 4 migrations SQL criadas e documentadas
- ✅ Row Level Security (RLS) policies completas
- ✅ Funções de autenticação e triggers
- ✅ Seed data para testes
- ✅ Hook `useAuth` customizado
- ✅ Providers (QueryClient + AuthProvider)
- ✅ Middleware de proteção de rotas implementado
- ✅ Layout root com Providers
- ✅ Páginas base criadas (landing, login, dashboard, admin)
- ✅ Layouts com sidebar para admin e dashboard

**Arquivos Criados**:
- `supabase/migrations/20241006000001_initial_schema.sql`
- `supabase/migrations/20241006000002_rls_policies.sql`
- `supabase/migrations/20241006000003_auth_functions.sql`
- `supabase/migrations/20241006000004_seed_data.sql`
- `supabase/SETUP.md` (documentação completa)
- `src/hooks/use-auth.tsx`
- `src/components/providers.tsx`
- `src/app/layout.tsx` (atualizado)
- `src/app/(public)/page.tsx` (landing page)
- `src/app/(public)/login/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/layout.tsx`

**Tabelas Criadas**:
1. tenants (imobiliárias)
2. profiles (usuários)
3. properties (imóveis)
4. property_images (fotos)
5. leads (contatos)
6. licenses (licenças)
7. channels (canais omnichannel)
8. conversations (conversas)
9. messages (mensagens)
10. ai_training_data (dados treino IA)

---

### 🚧 Fase 3: Portal Admin - EM PROGRESSO
**Status**: 60% 🚧 | **Data Início**: 06/10/2024

#### ✅ Completo:
- ✅ Layout admin com sidebar
- ✅ Dashboard administrativo (cards de estatísticas)
- ✅ Componentes UI do Shadcn (Button, Input, Label, Card, Table)
- ✅ Listagem de imobiliárias (tabela completa)
- ✅ Criação de nova imobiliária (formulário + validação)
- ✅ API route `/api/admin/tenants` (POST, GET)
- ✅ Validação de permissões (apenas admin)
- ✅ Auto-criação de licença básica

**Arquivos Criados**:
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/table.tsx`
- `src/app/(admin)/admin/imobiliarias/page.tsx`
- `src/app/(admin)/admin/imobiliarias/nova/page.tsx`
- `src/app/api/admin/tenants/route.ts`

#### ⏳ Pendente:
- [ ] Página de edição de imobiliária (`/admin/imobiliarias/[id]`)
- [ ] API route PUT/DELETE para tenants
- [ ] Toggle ativar/desativar imobiliária
- [ ] Gestão de licenças (CRUD completo)
- [ ] Gestão de usuários (listar, criar, editar)
- [ ] Dashboard com métricas reais (queries ao banco)

---

### ⏳ Fase 4: Portal da Imobiliária - PENDENTE
**Status**: 0% ⏳

#### Tarefas:
- [ ] CRUD completo de imóveis
  - [ ] Listagem com filtros
  - [ ] Formulário de criação
  - [ ] Formulário de edição
  - [ ] Exclusão
- [ ] Upload múltiplo de imagens (Supabase Storage)
- [ ] Gestão de leads (visualizar, atualizar status)
- [ ] Configurações da conta
- [ ] Dashboard com métricas reais (total imóveis, leads, etc)

---

### ⏳ Fase 5: Portal do Cliente (Público) - PENDENTE
**Status**: 0% ⏳

#### Tarefas:
- [ ] Listagem de imóveis com paginação
- [ ] Filtros avançados (tipo, cidade, preço, quartos, etc)
- [ ] Busca por texto
- [ ] Página de detalhes do imóvel
- [ ] Galeria de imagens (carousel)
- [ ] Formulário de contato/interesse
- [ ] Integração com leads (criar lead ao enviar formulário)

---

### ⏳ Fase 6: Sistema Omnichannel com IA - PENDENTE
**Status**: 0% ⏳

#### Tarefas:
1. **Database & Models**
   - Criar tabelas: channels, conversations, messages, ai_training_data
   - RLS policies para isolamento por tenant
   
2. **Webhooks & API Routes**
   - `/api/webhooks/whatsapp` - Receber mensagens WhatsApp
   - `/api/webhooks/instagram` - Receber mensagens Instagram
   - `/api/webhooks/messenger` - Receber mensagens Messenger
   - `/api/webhooks/webchat` - Chat do site
   - Validação e autenticação de webhooks
   
3. **Serviço de IA**
   - Módulo de processamento com Claude/GPT
   - Context builder (buscar imóveis, histórico, FAQs)
   - Prompt engineering para agente imobiliário
   - Detecção de intenção (consulta, agendamento, etc)
   - Escalação inteligente
   
4. **Envio de Mensagens**
   - Integração com Meta Business API
   - Módulo de envio abstrato (suporta múltiplos canais)
   - Retry e error handling
   - Status tracking
   
5. **Dashboard - Inbox Unificado**
   - Lista de conversas com filtros
   - Interface de chat em tempo real
   - Indicador de mensagens não lidas
   - Atribuir conversa a agente
   - Ativar/desativar bot por conversa
   - Ver histórico completo
   
6. **Dashboard - Gestão de Canais**
   - Adicionar/configurar WhatsApp
   - Adicionar/configurar Instagram
   - Adicionar/configurar Messenger
   - Widget de webchat (código para incorporar)
   - Testar conexão
   
7. **Dashboard - IA Training**
   - CRUD de FAQs
   - Scripts de atendimento
   - Base de conhecimento
   - Configurar comportamento do bot
   
8. **Real-time Updates**
   - WebSocket ou Supabase Realtime
   - Notificações de novas mensagens
   - Status de leitura
   - Typing indicators (opcional)
   
9. **Webchat Widget**
   - Widget embarcável no site público
   - Design responsivo
   - Funciona sem login
   - Histórico por session

---

### ⏳ Fase 7: Refinamentos - PENDENTE
**Status**: 0% ⏳

#### Tarefas:
- [ ] SEO (meta tags, sitemap, robots.txt)
- [ ] Responsividade completa mobile/tablet
- [ ] Loading states e skeleton screens
- [ ] Error handling robusto
- [ ] Validações com Zod em todos os formulários
- [ ] Testes unitários básicos
- [ ] Analytics (Google Analytics ou similar)
- [ ] Performance optimization

---

### ⏳ Fase 8: Deploy - PENDENTE
**Status**: 0% ⏳

#### Tarefas:
- [ ] Deploy no Vercel
- [ ] Configurar domínio
- [ ] Variáveis de ambiente em produção
- [ ] Configurar webhooks URLs públicas
- [ ] Testar integrações em produção
- [ ] Documentação final para clientes
- [ ] Setup CI/CD (GitHub Actions)

---

## 📊 RESUMO DO PROGRESSO

| Fase | Status | Progresso | Data |
|------|--------|-----------|------|
| 1. Setup | ✅ Completo | 100% | 06/10/2024 |
| 2. Database & Auth | ✅ Completo | 100% | 06/10/2024 |
| 3. Portal Admin | 🚧 Em progresso | 60% | 06/10/2024 |
| 4. Portal Imobiliária | ⏳ Pendente | 0% | - |
| 5. Portal Público | ⏳ Pendente | 0% | - |
| 6. Omnichannel + IA | ⏳ Pendente | 0% | - |
| 7. Refinamentos | ⏳ Pendente | 0% | - |
| 8. Deploy | ⏳ Pendente | 0% | - |

**Progresso Geral**: ~25% (2.5 de 8 fases)

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### Para Continuar o Desenvolvimento:

1. **Configurar Supabase** (se ainda não foi feito)
   - Criar projeto em [supabase.com](https://supabase.com)
   - Aplicar as 4 migrations em `supabase/migrations/`
   - Seguir guia em `supabase/SETUP.md`
   - Adicionar credenciais no `.env.local`

2. **Completar Fase 3 - Portal Admin**
   - Editar imobiliária existente
   - CRUD de licenças
   - Gestão de usuários

3. **Iniciar Fase 4 - Portal Imobiliária**
   - CRUD de imóveis
   - Upload de fotos

---

## 📝 COMANDOS ÚTEIS

```bash
# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar em produção
npm start

# Adicionar componentes Shadcn
npx shadcn@latest add [component]

# Git
git add -A
git commit -m "mensagem"
git push origin main
```

---

## 🔗 LINKS IMPORTANTES

- **Repositório Local**: `C:\Users\Matheus\Documents\pepius-imob`
- **GitHub**: `https://github.com/matheushentges/PepiusImob`
- **Documentação Completa**: `docs/RESUMO.md`
- **Setup Supabase**: `supabase/SETUP.md`
- **Progresso Detalhado**: `.claude/PROGRESS.md`
- **Notas Obsidian**: `docs/OBSIDIAN.md`

---

## Pontos de Atenção para Migração Futura

### Banco de Dados
- Usar apenas features padrão do PostgreSQL
- Evitar dependências específicas do Supabase quando possível
- Documentar todas as policies RLS (podem ser recriadas em outro ambiente)
- Manter migrations em arquivos SQL

### Storage
- Abstrair acesso ao storage em um módulo
- Facilitar troca de provider (Supabase -> S3, por exemplo)
- Usar URLs relativas quando possível

### Autenticação
- Considerar abstrair autenticação em um adapter pattern
- Usar JWT padrão
- Preparar para migração para NextAuth ou similar

### Deploy
- Next.js roda em qualquer ambiente Node.js
- Usar standalone output se necessário
- Docker-ready (criar Dockerfile quando migrar)

### Omnichannel & IA
- Abstrair serviço de IA em módulo separado
- Facilitar troca de provider (Claude -> GPT -> local)
- Webhooks devem ser genéricos e adaptáveis
- Queue system para processamento assíncrono (considerar BullMQ se migrar)
- Documentar todas as integrações com APIs externas

## Estimativa de Tempo
- Fase 1: 1-2 dias
- Fase 2: 2-3 dias
- Fase 3: 3-4 dias
- Fase 4: 4-5 dias
- Fase 5: 3-4 dias
- Fase 6: 7-10 dias (Omnichannel + IA - complexidade alta)
- Fase 7: 2-3 dias
- Fase 8: 1-2 dias

**Total estimado: 23-33 dias de desenvolvimento**

## Custos Estimados de Operação

### APIs Externas (por mês, estimativa)
- **Meta Business API** (WhatsApp): Gratuito até 1.000 conversas/mês, depois ~$0.005-0.09 por mensagem
- **Meta Business API** (Instagram/Messenger): Gratuito
- **Anthropic Claude API**: ~$3 por 1M tokens de entrada, ~$15 por 1M tokens de saída
  - Estimativa: 100 conversas/dia = ~$30-50/mês por tenant
- **OpenAI GPT** (alternativa): Similar ou ligeiramente mais caro
- **Supabase**: Plano gratuito (até 500MB DB, 1GB storage, 2GB bandwidth)
- **Vercel**: Plano gratuito para projetos pessoais/hobby

### Recomendação
- Cobrar dos clientes por uso de IA (passar o custo)
- Ou incluir limite no plano (ex: 500 mensagens IA/mês no básico)
- Oferecer apenas bot de regras simples no plano básico

## Próximos Passos Imediatos
1. Confirmar stack e arquitetura
2. Iniciar Fase 1 (Setup)
3. Criar projeto no Supabase
4. Começar desenvolvimento incremental
