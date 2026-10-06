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

## 🚀 Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Rodar em desenvolvimento
npm run dev
```

## 📦 Stack Tecnológica

- Next.js 14+
- TypeScript
- Supabase
- TailwindCSS + Shadcn/ui
- React Hook Form + Zod
- Tanstack Query
- Lucide Icons

## 🔐 Multi-Tenancy

Sistema multi-tenant com isolamento via Row Level Security (RLS) do PostgreSQL.

## 📝 Documentação

Veja o plano completo de implementação em `.claude/plan.md`

## 📄 Licença

Proprietário - Pepius
