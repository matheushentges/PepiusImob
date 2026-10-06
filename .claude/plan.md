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

## Fases de Implementação

### Fase 1: Estrutura Base (Setup)
1. Inicializar projeto Next.js com TypeScript
2. Configurar TailwindCSS e Shadcn/ui
3. Configurar Supabase (projeto + client)
4. Criar estrutura de pastas:
   ```
   /src
     /app
       /(public)         # Portal público
       /(dashboard)      # Portal imobiliária
       /(admin)          # Portal admin
       /api
     /components
       /ui               # Shadcn components
       /shared           # Componentes compartilhados
     /lib
       /supabase
       /utils
     /types
   ```
5. Configurar variáveis de ambiente

### Fase 2: Database & Auth
1. Criar schema do banco de dados no Supabase
2. Implementar migrations
3. Configurar Row Level Security (RLS) policies
4. Configurar Supabase Auth
5. Criar hooks de autenticação customizados
6. Implementar middleware de proteção de rotas

### Fase 3: Portal Admin
1. Layout admin com sidebar
2. Dashboard administrativo
3. CRUD de imobiliárias (tenants)
4. Sistema de licenças
5. Gestão de usuários
6. Ativar/desativar imobiliárias

### Fase 4: Portal da Imobiliária
1. Layout dashboard com sidebar
2. Dashboard da imobiliária
3. CRUD de imóveis
4. Upload de imagens (Supabase Storage)
5. Gestão de leads
6. Configurações da conta

### Fase 5: Portal do Cliente (Público)
1. Landing page
2. Listagem de imóveis com filtros
3. Busca avançada
4. Página de detalhes do imóvel
5. Formulário de contato/interesse
6. Galeria de imagens

### Fase 6: Sistema Omnichannel com IA
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

### Fase 7: Refinamentos
1. SEO otimizado
2. Responsividade completa
3. Loading states e error handling
4. Validações robustas
5. Testes básicos
6. Analytics e métricas

### Fase 8: Deploy
1. Deploy no Vercel
2. Configurar domínio (se houver)
3. Configurar variáveis de ambiente em produção
4. Configurar webhooks em produção (URLs públicas)
5. Testar integrações em produção
6. Documentação de setup para clientes

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
