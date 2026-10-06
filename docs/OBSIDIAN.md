# Pepius Imob - Notas Obsidian

## 🏠 Visão Geral

Sistema SaaS multi-tenant para imobiliárias com integração omnichannel (WhatsApp, Instagram, Messenger, Webchat) e agente IA para atendimento automatizado.

## 📊 Módulos do Sistema

### [[Portal Público]]
- Listagem de imóveis
- Busca avançada
- Detalhes do imóvel
- Formulário de contato
- Chat com IA

### [[Portal Dashboard Imobiliária]]
- Gestão de imóveis (CRUD)
- Inbox unificado omnichannel
- Gestão de leads
- Dashboard de métricas
- Configuração de canais
- Treinamento da IA

### [[Portal Admin]]
- Gestão de imobiliárias (tenants)
- Sistema de licenças
- Gestão de usuários
- Métricas globais

### [[Sistema Omnichannel]]
- WhatsApp Business API
- Instagram Messaging
- Facebook Messenger
- Webchat próprio
- Agente IA (Claude/GPT)
- Inbox unificado

## 🗄️ Database Schema

### Tenants (Imobiliárias)
- Multi-tenancy via RLS
- Cada imobiliária isolada
- Licenças por tenant

### Properties (Imóveis)
- Vinculados ao tenant
- Tipos: casa, apartamento, terreno, comercial, rural
- Finalidade: venda, locação, ambos
- Status: disponível, vendido, alugado, reservado

### Conversations (Conversas Omnichannel)
- Canal de origem
- Status (bot/humano)
- Histórico completo
- Atribuição de agente

### Messages (Mensagens)
- Texto, imagem, vídeo, áudio, documento
- Status: enviado, entregue, lido
- Sender: customer, agent, bot

## 🤖 Sistema de IA

### Capabilities
1. Responder perguntas gerais
2. Consultar imóveis (busca inteligente)
3. Capturar leads
4. Agendar visitas
5. Escalação para humano

### Treinamento
- FAQs personalizadas por tenant
- Scripts de atendimento
- Base de conhecimento dos imóveis
- Context-aware (histórico)

## 🔧 Stack Tecnológica

- **Frontend**: Next.js 14+, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: Anthropic Claude API
- **Omnichannel**: Meta Business API
- **Deploy**: Vercel + Supabase Cloud

## 📅 Timeline

- **Fase 1**: Setup ✅ (Completo)
- **Fase 2**: Database & Auth (Próximo)
- **Fase 3**: Portal Admin
- **Fase 4**: Portal Imobiliária
- **Fase 5**: Portal Público
- **Fase 6**: Sistema Omnichannel + IA
- **Fase 7**: Refinamentos
- **Fase 8**: Deploy

**Estimativa total**: 23-33 dias

## 🔗 Links

- Repositório: `C:\Users\Matheus\Documents\pepius-imob`
- GitHub: https://github.com/MatheusDosSantosR/pepius-imob
- Plano completo: [[plan.md]]
- Progresso: [[PROGRESS.md]]

## 💡 Decisões de Arquitetura

### Multi-Tenancy
Row Level Security (RLS) do PostgreSQL para isolamento total entre tenants.

### Migração Futura
Sistema preparado para migração:
- PostgreSQL padrão (sem vendor lock-in)
- Abstrações de serviços externos
- Docker-ready
- Standalone Next.js

### Custos
- Supabase: Free tier (500MB DB)
- Vercel: Free tier
- Claude API: ~$30-50/mês por tenant
- WhatsApp: Gratuito até 1.000 conversas/mês

## 🎯 Próximas Tarefas

- [ ] Criar projeto no Supabase
- [ ] Implementar schema do banco
- [ ] Configurar RLS policies
- [ ] Criar migrations SQL
- [ ] Configurar autenticação
- [ ] Implementar hooks de auth

---

**Tags**: #pepius #imobiliaria #saas #nextjs #supabase #omnichannel #ia
