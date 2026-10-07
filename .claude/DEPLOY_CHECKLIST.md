# Checklist de Deploy - Pepius Imob

Use este checklist antes de fazer o deploy em produção.

## ✅ Pré-Deploy

### Configuração Local
- [ ] `.env.local` configurado corretamente
- [ ] Todas as dependências instaladas (`npm install`)
- [ ] Build local funciona sem erros (`npm run build`)
- [ ] Type checking passa (`npm run type-check`)
- [ ] Aplicação roda localmente (`npm run dev`)

### Supabase
- [ ] Projeto criado no Supabase
- [ ] Migration 1 aplicada: `20241006000001_initial_schema.sql`
- [ ] Migration 2 aplicada: `20241006000002_rls_policies.sql`
- [ ] Migration 3 aplicada: `20241006000003_auth_functions.sql`
- [ ] Migration 4 aplicada: `20241006000004_seed_data.sql`
- [ ] RLS policies ativas (verificar em Database > Policies)
- [ ] Usuário admin criado (email: `admin@pepius.com`)
- [ ] Credenciais copiadas (URL + Keys)

### Código
- [ ] Todas as alterações commitadas
- [ ] Push feito para o GitHub
- [ ] Branch `main` atualizada
- [ ] Sem arquivos `.env.local` no repositório
- [ ] `.gitignore` configurado corretamente

## 🚀 Deploy na Vercel

### Primeira Vez
- [ ] Conta criada/logada na Vercel
- [ ] Repositório importado
- [ ] Framework detectado como Next.js
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### Variáveis de Ambiente
Configure estas variáveis na Vercel (Settings > Environment Variables):

**Obrigatórias:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (ex: https://seu-projeto.vercel.app)

**Opcionais (para fase 6 - Omnichannel):**
- [ ] `META_APP_ID`
- [ ] `META_APP_SECRET`
- [ ] `META_ACCESS_TOKEN`
- [ ] `META_WEBHOOK_VERIFY_TOKEN`
- [ ] `ANTHROPIC_API_KEY`

### Deploy
- [ ] Primeiro deploy iniciado
- [ ] Build passou sem erros
- [ ] Deploy completo (status: Ready)
- [ ] URL de produção acessível

## 🧪 Testes Pós-Deploy

### Funcionalidades Básicas
- [ ] Landing page carrega (`/`)
- [ ] Página de login carrega (`/login`)
- [ ] Login funciona com usuário seed
- [ ] Redirecionamento após login funciona
- [ ] Dashboard admin carrega (`/admin`)
- [ ] Listagem de imobiliárias funciona (`/admin/imobiliarias`)

### CRUD de Imobiliárias
- [ ] Criar nova imobiliária funciona
- [ ] Listagem atualiza após criação
- [ ] Editar imobiliária funciona
- [ ] Toggle ativo/inativo funciona
- [ ] Deletar imobiliária funciona (quando não tem dados)

### Autenticação
- [ ] Logout funciona
- [ ] Middleware protege rotas autenticadas
- [ ] Redirect para login quando não autenticado
- [ ] Roles funcionam (admin vs imobiliaria)

### Performance
- [ ] Páginas carregam em < 3s
- [ ] Imagens otimizadas
- [ ] Sem erros no console
- [ ] Lighthouse score > 70

## 🔧 Configurações Avançadas

### Domínio Customizado (Opcional)
- [ ] Domínio adicionado na Vercel
- [ ] DNS configurado
- [ ] HTTPS ativo
- [ ] Redirect de www configurado

### Webhooks (Fase 6)
- [ ] URLs de webhook configuradas no Meta Business
- [ ] Verify token configurado
- [ ] Webhooks testados com ferramenta de teste

### Monitoramento
- [ ] Analytics configurado (se aplicável)
- [ ] Sentry ou similar (error tracking)
- [ ] Vercel Analytics ativo
- [ ] Logs configurados

## 📝 Documentação

### Atualizar
- [ ] README.md com URL de produção
- [ ] DEPLOY.md revisado
- [ ] Changelog atualizado
- [ ] Documentação para clientes (se aplicável)

### Backup
- [ ] Backup do banco de dados
- [ ] Backup das variáveis de ambiente
- [ ] Documentação de recovery

## 🎉 Go Live

### Comunicação
- [ ] Stakeholders notificados
- [ ] Equipe informada sobre URL
- [ ] Documentação compartilhada

### Suporte
- [ ] Plano de rollback definido
- [ ] Contatos de emergência documentados
- [ ] Suporte preparado para receber feedback

## 🐛 Troubleshooting Comum

### Build Falha
```bash
# Testar build localmente
npm run build

# Verificar errors de TypeScript
npm run type-check

# Verificar logs na Vercel
```

### Erro 500 em Produção
1. Verificar logs na Vercel
2. Verificar variáveis de ambiente
3. Verificar conexão com Supabase
4. Verificar RLS policies

### Redirect Loop no Login
1. Verificar middleware
2. Verificar cookies (SameSite, Secure)
3. Verificar configuração do Supabase Auth

### Imagens não carregam
1. Verificar configuração de `next.config.ts`
2. Verificar permissões do Supabase Storage
3. Verificar URLs das imagens

## 📊 Métricas de Sucesso

- [ ] Tempo de build < 2 min
- [ ] Tempo de deploy < 5 min
- [ ] Uptime > 99%
- [ ] TTFB < 500ms
- [ ] Core Web Vitals no verde

## 🔄 CI/CD (Futuro)

- [ ] GitHub Actions configurado
- [ ] Testes automatizados no CI
- [ ] Deploy automático no merge para main
- [ ] Notificações de deploy no Slack/Discord

---

**Data do Deploy**: _____________  
**Responsável**: _____________  
**Versão**: _____________  
**Notas**: _____________
