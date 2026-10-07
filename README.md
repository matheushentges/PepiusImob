# Pepius Imob

Sistema SaaS para imobiliárias com integração omnichannel e IA.

## 🏗️ Arquitetura

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Omnichannel**: WhatsApp, Instagram, Messenger, Webchat
- **IA**: Anthropic Claude API para atendimento automatizado
- **Deploy**: Vercel + Supabase Cloud

## 🎯 Três Interfaces

### 1. Portal do Cliente (Público)
- Visualizar imóveis disponíveis
- Busca avançada com filtros
- Chat com atendimento IA

### 2. Portal da Imobiliária
- Gestão completa de imóveis
- Inbox unificado omnichannel
- Dashboard de leads e métricas
- Configuração de canais de atendimento

### 3. Portal Admin
- Gerenciamento de imobiliárias (tenants)
- Sistema de licenças SaaS
- Gestão de usuários
- Métricas globais

## 🚀 Quick Start

### 1. Instalação

```bash
# Clonar o repositório
git clone https://github.com/matheushentges/PepiusImob.git
cd pepius-imob

# Instalar dependências
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute as migrations em `supabase/migrations/` (na ordem)
3. Copie as credenciais (Project URL e API Keys)

### 3. Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com suas credenciais do Supabase
```

### 4. Rodar Localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`

### 5. Credenciais de Teste (seed data)

**Admin:**
- Email: `admin@pepius.com`
- Senha: `admin123`

**Imobiliária:**
- Email: `contato@imobiliariademo.com`
- Senha: `demo123`

## 🚢 Deploy na Vercel

### Deploy Rápido

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/matheushentges/PepiusImob)

### Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Adicionar variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Deploy em produção
vercel --prod
```

📖 **Guia completo de deploy:** [DEPLOY.md](./DEPLOY.md)

## 📦 Stack Tecnológica

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript**
- **TailwindCSS + Shadcn/ui**
- **React Hook Form + Zod**
- **Tanstack Query**
- **Lucide Icons**

### Backend
- **Supabase**
  - PostgreSQL (banco de dados)
  - Auth (autenticação)
  - Storage (upload de imagens)
  - Row Level Security (RLS)

### Omnichannel (em desenvolvimento)
- Meta Business API (WhatsApp, Instagram, Messenger)
- Anthropic Claude API (agente IA)
- Webhook handlers
- Real-time messaging

## 🗂️ Estrutura do Projeto

```
pepius-imob/
├── src/
│   ├── app/
│   │   ├── (public)/          # Portal público
│   │   ├── (dashboard)/       # Portal da imobiliária
│   │   └── (admin)/           # Portal admin
│   ├── components/
│   │   └── ui/                # Shadcn/ui components
│   ├── lib/
│   │   └── supabase/          # Supabase clients
│   ├── hooks/                 # Custom hooks
│   └── types/                 # TypeScript types
├── supabase/
│   ├── migrations/            # Database migrations
│   └── SETUP.md               # Guia de setup do Supabase
├── .claude/
│   └── plan.md                # Plano de implementação
└── public/
```

## 🔐 Multi-Tenancy

Sistema multi-tenant com isolamento via Row Level Security (RLS) do PostgreSQL.

Cada imobiliária (tenant) possui:
- Dados completamente isolados
- Usuários próprios
- Configurações independentes
- Licença individual

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar produção localmente
npm start

# Linting
npm run lint

# Type checking
npm run type-check

# Deploy na Vercel
npm run vercel:deploy
```

## 📊 Progresso do Desenvolvimento

| Fase | Status | Progresso |
|------|--------|-----------|
| 1. Setup | ✅ Completo | 100% |
| 2. Database & Auth | ✅ Completo | 100% |
| 3. Portal Admin | 🚧 Em progresso | 80% |
| 4. Portal Imobiliária | ⏳ Pendente | 0% |
| 5. Portal Público | ⏳ Pendente | 0% |
| 6. Omnichannel + IA | ⏳ Pendente | 0% |
| 7. Refinamentos | ⏳ Pendente | 0% |
| 8. Deploy | 🚧 Em progresso | 50% |

**Progresso Geral: ~30%**

## 📝 Documentação

- **Plano Completo**: [.claude/plan.md](./.claude/plan.md)
- **Setup Supabase**: [supabase/SETUP.md](./supabase/SETUP.md)
- **Guia de Deploy**: [DEPLOY.md](./DEPLOY.md)

## 🤝 Contribuindo

Este é um projeto proprietário. Entre em contato para mais informações.

## 📄 Licença

Proprietário - Pepius

---

Desenvolvido com ❤️ por [Matheus Hentges](https://github.com/matheushentges)
