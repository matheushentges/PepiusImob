# Guia de Deploy - Pepius Imob

## Deploy na Vercel

### 1. Preparação do Projeto

✅ Projeto já está configurado com:
- `vercel.json` - Configuração da Vercel
- `.vercelignore` - Arquivos a ignorar no deploy
- `next.config.ts` - Otimizações para produção

### 2. Criar Conta na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Autorize a Vercel a acessar seus repositórios

### 3. Configurar Projeto no Supabase

Antes do deploy, certifique-se de que seu projeto Supabase está configurado:

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto (ou use existente)
3. Anote as credenciais:
   - `Project URL`
   - `anon/public key`
   - `service_role key` (Settings > API)

4. Execute as migrations:
   - Vá em SQL Editor
   - Execute os arquivos em `supabase/migrations/` na ordem:
     1. `20241006000001_initial_schema.sql`
     2. `20241006000002_rls_policies.sql`
     3. `20241006000003_auth_functions.sql`
     4. `20241006000004_seed_data.sql`

### 4. Deploy via CLI (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login na Vercel
vercel login

# Deploy (primeira vez)
vercel

# Siga as instruções:
# - Set up and deploy? Yes
# - Which scope? (sua conta)
# - Link to existing project? No
# - Project name? pepius-imob
# - In which directory is your code? ./
# - Want to override settings? No

# Adicionar variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Deploy em produção
vercel --prod
```

### 5. Deploy via Dashboard (Alternativa)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório do GitHub
3. Configure o projeto:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: (deixe padrão)
   
4. Adicione as variáveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
   ```

5. Clique em "Deploy"

### 6. Configurar Domínio Customizado (Opcional)

1. No dashboard do projeto na Vercel
2. Vá em "Settings" > "Domains"
3. Adicione seu domínio
4. Siga as instruções de DNS

### 7. Configurar Webhooks (Após Deploy)

Para o sistema omnichannel funcionar, você precisa configurar os webhooks:

1. Anote a URL do deploy: `https://seu-projeto.vercel.app`

2. Configure no Meta Business:
   - Webhook URL: `https://seu-projeto.vercel.app/api/webhooks/whatsapp`
   - Verify Token: (crie um e adicione em `META_WEBHOOK_VERIFY_TOKEN`)

### 8. Variáveis de Ambiente Necessárias

#### Obrigatórias (para funcionar básico):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

#### Opcionais (para omnichannel + IA):
```env
META_APP_ID=seu-app-id
META_APP_SECRET=seu-app-secret
META_ACCESS_TOKEN=seu-access-token
META_WEBHOOK_VERIFY_TOKEN=token-aleatorio-seguro
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 9. CI/CD Automático

A Vercel automaticamente:
- Faz deploy a cada push no `main`
- Cria preview deployments para PRs
- Roda `npm run build` antes do deploy
- Invalida cache automaticamente

### 10. Monitoramento

Acesse o dashboard da Vercel para:
- Ver logs de deploy
- Monitorar performance
- Ver analytics
- Configurar alertas

### 11. Troubleshooting

#### Build falha com erro de TypeScript
```bash
# Localmente, teste o build
npm run build

# Corrija os erros e commit
```

#### Erro 500 no servidor
- Verifique os logs na Vercel
- Certifique-se que as env vars estão configuradas
- Teste localmente com `npm run build && npm start`

#### Erro de conexão com Supabase
- Verifique se as credenciais estão corretas
- Teste a conexão localmente primeiro
- Verifique as RLS policies

## Deploy Manual (Auto-hospedagem)

Se preferir hospedar em outro lugar:

### Build standalone

```bash
# Configurar standalone output
# Adicione no next.config.ts:
# output: 'standalone',

npm run build

# Os arquivos estarão em .next/standalone/
# Copie para seu servidor e rode:
node .next/standalone/server.js
```

### Docker (futuro)

```dockerfile
# Criar Dockerfile quando necessário
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
CMD ["npm", "start"]
```

## Checklist Pré-Deploy

- [ ] Todas as env vars configuradas
- [ ] Migrations aplicadas no Supabase
- [ ] Build local funciona (`npm run build`)
- [ ] Seed data aplicado (usuário admin criado)
- [ ] RLS policies ativas
- [ ] `.env.local` NÃO commitado
- [ ] Testes básicos passando
- [ ] README.md atualizado

## Pós-Deploy

- [ ] Testar login com usuário seed
- [ ] Criar primeira imobiliária
- [ ] Verificar dashboard admin
- [ ] Testar portal público
- [ ] Configurar domínio (se aplicável)
- [ ] Configurar webhooks (quando implementar omnichannel)

## Custos Estimados

### Vercel
- **Hobby (Grátis)**:
  - 100GB bandwidth/mês
  - Unlimited deployments
  - HTTPS automático
  - **Suficiente para começar**

- **Pro ($20/mês)**:
  - Necessário se:
    - Mais de 100GB bandwidth
    - Deploy com senha
    - Analytics avançado
    - Mais de 1 concurrent build

### Supabase
- **Free**:
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth
  - **Suficiente para testes**

- **Pro ($25/mês)**:
  - 8GB database
  - 100GB file storage
  - 250GB bandwidth
  - Daily backups

**Custo inicial**: $0 (usando planos gratuitos)
**Custo produção**: $0-45/mês (dependendo da escala)

## Próximos Passos

1. Deploy na Vercel ✅
2. Testar em produção
3. Configurar domínio customizado
4. Implementar analytics
5. Configurar CI/CD avançado
6. Adicionar testes automatizados
