# Pepius Imob - Documentação do Projeto

## 📋 Status do Projeto

**Última atualização**: 06/10/2024
**Fase atual**: Fase 2 - Database & Auth ✅

## ✅ Fase 1 Completa - Estrutura Base

### Realizações
- [x] Projeto Next.js 14+ inicializado com TypeScript
- [x] TailwindCSS configurado
- [x] Shadcn/ui configurado
- [x] Supabase client, server e middleware criados
- [x] Estrutura de pastas criada:
  - `src/app/(public)` - Portal público
  - `src/app/(dashboard)` - Portal imobiliária
  - `src/app/(admin)` - Portal admin
  - `src/app/api/webhooks` - Webhooks dos canais
  - `src/components/ui` - Componentes Shadcn
  - `src/components/shared` - Componentes compartilhados
  - `src/lib/supabase` - Integração Supabase
  - `src/lib/utils` - Utilitários
  - `src/types` - Tipos TypeScript
- [x] Variáveis de ambiente configuradas
- [x] Middleware de autenticação e proteção de rotas
- [x] Tipos TypeScript para database
- [x] Repositório Git inicializado

## ✅ Fase 2 Completa - Database & Auth

### Realizações
- [x] Schema completo do banco criado (11 tabelas)
- [x] Migrations SQL organizadas (4 arquivos)
- [x] Row Level Security (RLS) policies implementadas
- [x] Funções de autenticação e triggers
- [x] Seed data para testes
- [x] Hook useAuth criado
- [x] Providers (QueryClient + Auth) configurados
- [x] Layouts e páginas base:
  - Landing page
  - Login page
  - Dashboard layout + page
  - Admin layout + page
- [x] Proteção de rotas implementada
- [x] Documentação completa de setup Supabase

## 🎯 Próximos Passos

### Fase 3: Portal Admin
1. Criar componentes UI (Button, Input, Table, etc)
2. Implementar CRUD de imobiliárias
3. Implementar gestão de licenças
4. Implementar gestão de usuários
5. Dashboard com métricas reais

## 📁 Estrutura do Projeto

```
pepius-imob/
├── src/
│   ├── app/
│   │   ├── (public)/          # Rotas públicas
│   │   ├── (dashboard)/       # Dashboard imobiliária
│   │   ├── (admin)/           # Dashboard admin
│   │   └── api/
│   │       └── webhooks/      # Webhooks omnichannel
│   ├── components/
│   │   ├── ui/                # Componentes Shadcn
│   │   └── shared/            # Componentes reutilizáveis
│   ├── lib/
│   │   ├── supabase/          # Clientes Supabase
│   │   └── utils.ts           # Utilitários
│   └── types/
│       └── database.types.ts  # Tipos do banco
├── .claude/
│   └── plan.md                # Plano completo
├── .env.local                 # Variáveis locais
└── .env.example               # Template de variáveis
```

## 🔗 Links Úteis

- [Plano Completo](.claude/plan.md)
- [Repositório GitHub](https://github.com/MatheusDosSantosR/pepius-imob)
- Supabase Project: (a configurar)
- Vercel Deploy: (a configurar)

## 📦 Dependências Instaladas

### Principais
- Next.js 15.x
- React 19.x
- TypeScript 5.x
- Supabase (@supabase/supabase-js, @supabase/ssr)
- TailwindCSS
- Shadcn/ui (clsx, class-variance-authority, tailwind-merge)
- React Hook Form + Zod
- Tanstack Query
- Lucide React (ícones)

## 🎨 Design System

- **Componentes**: Shadcn/ui (Base UI + Radix)
- **Estilo**: New York
- **Cores**: Zinc (customizável)
- **Ícones**: Lucide React

## 🔐 Autenticação e Autorização

### Roles
- `admin` - Acesso total ao sistema
- `imobiliaria_owner` - Dono da imobiliária
- `imobiliaria_user` - Usuário da imobiliária
- `cliente` - Cliente final

### Proteção de Rotas
- `/dashboard/*` - Requer autenticação
- `/admin/*` - Requer role admin

## 📝 Notas de Desenvolvimento

### Multi-Tenancy
Sistema multi-tenant com isolamento via RLS do PostgreSQL. Cada imobiliária é um tenant isolado.

### Migração Futura
- Usar apenas features padrão do PostgreSQL
- Abstrair serviços externos (IA, Storage)
- Documentar todas as integrações
- Manter código portável
