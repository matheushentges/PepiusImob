# Especificação e Design: Portal Administrativo de Licenças Pepius

**Data:** 2026-10-22  
**Status:** Aprovado para Planejamento  
**Produto:** Pepius License Portal (`pepius-license-portal`)  
**Repositório Alvo:** `c:\Users\Matheus\Documents\pepius-license-portal`  
**Base de Dados:** Supabase Control Plane (`https://lwsnunuufkqmursocztg.supabase.co`)  

---

## 1. Contexto e Objetivo

A Pepius opera um modelo de licenciamento on-premise no qual cada imobiliária roda uma instância isolada em sua própria VM com Supabase self-hosted. As instalações obtêm e renovam permissões de operação através de **leases criptográficas assinadas com Ed25519** pelo serviço central da Pepius.

Este projeto estabelece o **Portal Administrativo Oficial da Pepius** para operadores e administradores gerenciarem todo o ciclo de vida dessas licenças:
- Emissão de novas contas e geração de códigos de ativação de uso único.
- Monitoramento de instalações conectadas e status de heartbeats.
- Registro de pagamentos e renovação de vigências.
- Suspensão e reativação manual de licenças.
- Visualização de trilha imutável de auditoria.

O portal é um produto e projeto independente do pacote on-premise da imobiliária, garantindo isolamento total de chaves e dados conforme previsto em [[PLANO_CONTROL_PLANE_FUTURO]].

---

## 2. Arquitetura do Sistema

```text
[Operador Pepius] 
       │ (HTTPS / Navegador)
       ▼
[pepius-license-portal (Next.js 16 App Router na Vercel)]
       │
       ├─ Auth: Supabase Auth SSR via cookies HTTP-only
       ├─ UI: Tailwind v4 + Design System "Linha de Planta"
       └─ Server Layer: Next.js Server Components / Actions ('server-only')
              │
              ▼ (PostgREST / RPC via SUPABASE_SERVICE_ROLE_KEY)
[Supabase Control Plane (Projeto: lwsnunuufkqmursocztg)]
       ├─ public.license_accounts
       ├─ public.license_activation_codes
       ├─ public.license_installations
       ├─ public.license_payments
       └─ public.license_audit_events
```

### 2.1 Fronteiras e Segurança (Prioridade 0)
1. **Zero Privilégio do Cliente Final**: Nenhuma tabela do banco do Control Plane é aberta para `anon` ou `authenticated`. Todo acesso do portal ocorre no servidor via `SUPABASE_SERVICE_ROLE_KEY` envolta em `import 'server-only'`.
2. **Autenticação de Operadores**: Supabase Auth com email e senha. Sessões verificadas por `middleware.ts` no Next.js; rotas não autenticadas são redirecionadas para `/login`.
3. **Validação de Entrada**: Esquemas Zod estritos (`strict()`) para payloads de emissão, registro de pagamento e suspensão.
4. **Proteção contra Injeção e Ataques**: Procedimentos armazenados (`SECURITY DEFINER` com `search_path = ''`) para operações atômicas (`issue_license_account`, `record_license_payment`, `set_license_suspension`).
5. **Auditoria**: Cada ação grava um registro em `public.license_audit_events` contendo o ID do operador autenticado.

---

## 3. Especificação das Telas e Funcionalidades

### 3.1 Autenticação (`/login`)
- Formulário com e-mail e senha.
- Validação no cliente e servidor.
- Mensagens de erro amigáveis sem enumerar usuários.
- Redirecionamento automático pós-login para o Dashboard.

### 3.2 Dashboard de Visão Geral (`/`)
- **Cards de Métricas**:
  - **Licenças Ativas**: Contagem de licenças operando normalmente.
  - **Licenças Suspensas / Atrasadas**: Contagem de clientes com pagamento vencido há mais de 15 dias ou suspensão manual.
  - **MRR Estimado**: Soma do valor mensal (`monthly_amount_cents`) das licenças ativas, formatado em R$.
  - **Instalações Conectadas**: Total de instalações ativas e indicador de heartbeats recebidos nas últimas 24h.
- **Tabela de Atividades Recentes**: Últimos 5 eventos de auditoria com data, operador e ação.

### 3.3 Listagem de Licenças (`/licencas`)
- **Filtros e Busca**:
  - Campo de busca textual por Nome da Imobiliária ou UUID.
  - Filtro por status: Todas, Ativa, Atrasada, Suspensa.
  - Filtro por Plano.
- **Colunas da Tabela**:
  - Imobiliária (Nome + UUID abreviado).
  - Plano e Features.
  - Mensalidade (R$).
  - Pago Até (`paid_through`).
  - Status (Badge semântica: Verde, Amarelo, Vermelho).
  - Ações (Link para detalhes).
- Botão de ação primária no topo: **"Emitir Nova Licença"**.

### 3.4 Emissão de Nova Licença (`/licencas/nova`)
- **Campos do Formulário**:
  - `agency_name`: Texto obrigatório (2 a 160 caracteres).
  - `plan`: Seleção ou texto (ex: "Profissional", "Empresarial").
  - `features`: Seleção múltipla com checkboxes (`public-listing`, `properties`, `leads`).
  - `monthly_amount`: Valor em Reais (convertido internamente para centavos).
  - `paid_through`: Seletor de data (deve ser igual ou posterior à data atual).
- **Ação pós-submissão**:
  - Chama a procedure `issue_license_account`.
  - Gera código criptográfico de ativação único (32 bytes `base64url`).
  - Redireciona para tela/modal com o **Código de Ativação**, botão de cópia instantânea, aviso de expiração de 7 dias e instruções CLI formatadas para o operador enviar ao cliente.

### 3.5 Detalhes da Licença (`/licencas/[id]`)
- **Cabeçalho**: Nome da Imobiliária, Badge de Status, Plano e Data de Criação.
- **Ações Rápidas**:
  - **Registrar Pagamento**: Modal solicitando Valor (R$), Nova Data de Vencimento e Referência/Comprovante.
  - **Suspender / Reativar**: Botão com confirmação que altera o campo `manually_suspended`.
- **Card de Instalação Vinculada**:
  - UUID da instalação na VM.
  - Chave pública Ed25519 registrada.
  - Timestamp do último heartbeat e status de conectividade (Online nas últimas 24h / Ausente).
- **Histórico Financeiro**: Tabela com pagamentos anteriores registrados.
- **Histórico de Auditoria**: Eventos vinculados a esta licença específica.

### 3.6 Trilha de Auditoria Geral (`/auditoria`)
- Tabela com paginação contendo:
  - Data/Hora (`TIMESTAMPTZ` formatado em horário local).
  - Operador (`actor_id`).
  - Licença Afetada.
  - Ação realizada (`license.issued`, `license.payment_recorded`, `license.suspended`, etc.).
  - Detalhes (JSON legível com valores alterados).

---

## 4. Design System ("Linha de Planta" Administrativa)

- **Tipografia**:
  - Títulos e KPIs: `DM Serif Display`.
  - Corpo, labels e dados tabulares: `DM Sans` com `tabular-nums`.
- **Paleta de Cores**:
  - Fundo claro: `#FAFAFA`, Fundo escuro: `#0F172A`.
  - Primária: `#334155` (Slate 700).
  - Accent / Destaque: `#E07A5F` (Terracota).
  - Bordas: `1px solid var(--border)`.
  - Suporte completo a Dark Mode com persistência via `next-themes`.
- **Densidade**:
  - Média-alta, focada em produtividade operacional, telas limpas, inputs com altura de 36px (`h-9`), tabelas legíveis e botões com foco acessível.

---

## 5. Estratégia de Deploy & Integração

1. **Repositório**: Inicializado em `c:\Users\Matheus\Documents\pepius-license-portal` com `.gitignore` completo.
2. **Supabase**:
   - Conectado ao projeto do Control Plane `lwsnunuufkqmursocztg`.
   - Criação do primeiro usuário de login administrativo no Supabase Auth.
3. **Vercel**:
   - Criação de novo projeto Vercel (`pepius-license-portal`) via Vercel CLI.
   - Variáveis configuradas na Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL=https://lwsnunuufkqmursocztg.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
     - `SUPABASE_SERVICE_ROLE_KEY=...`
4. **Verificação de Qualidade**:
   - `npm run type-check`: 0 erros.
   - `npm run lint`: 0 erros.
   - Testes unitários de domínio e regras de status.
   - Build de produção validado (`npm run build`).

---

## 6. Documentação no Antigravity

- Atualização de `docs/OBSIDIAN.md` e `docs/RESUMO.md` no repositório `pepius-imob` registrando a existência, fronteiras e URL de produção do novo portal.
