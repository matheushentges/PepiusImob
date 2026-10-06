# Guia de Setup do Supabase

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Name**: pepius-imob
   - **Database Password**: (gere uma senha forte)
   - **Region**: South America (São Paulo)
   - **Plan**: Free (ou Pro se preferir)
5. Aguarde a criação (~2 minutos)

## 2. Obter Credenciais

Após criar o projeto:

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** (exemplo: `https://xxx.supabase.co`)
   - **anon public** key
   - **service_role** key (NUNCA exponha no frontend!)

## 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

## 4. Aplicar Migrations

### Opção A: Via Supabase Dashboard (Recomendado para início)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Crie uma nova query
3. Copie e cole o conteúdo de cada migration na ordem:
   - `20241006000001_initial_schema.sql`
   - `20241006000002_rls_policies.sql`
   - `20241006000003_auth_functions.sql`
   - `20241006000004_seed_data.sql` (opcional - dados de exemplo)
4. Execute cada uma (botão Run)

### Opção B: Via Supabase CLI (Para desenvolvimento contínuo)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Aplicar migrations
supabase db push

# Ou aplicar localmente (Docker necessário)
supabase start
supabase db reset
```

## 5. Criar Usuário Admin

No SQL Editor do Supabase, execute:

```sql
-- Criar primeiro usuário admin
SELECT create_admin_user(
  'seu-email@example.com',
  'sua-senha-segura',
  'Seu Nome'
);
```

Ou crie via Auth → Users no dashboard e depois atualize o role:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@example.com';
```

## 6. Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Contar registros de exemplo (se aplicou seed)
SELECT 'tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'ai_training_data', COUNT(*) FROM ai_training_data;
```

## 7. Configurar Storage (para imagens)

1. Vá em **Storage** no dashboard
2. Crie um bucket chamado `property-images`
3. Configure as policies:

```sql
-- Policy para upload (apenas usuários autenticados do tenant)
CREATE POLICY "Tenant users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.user_tenant_id()::text
);

-- Policy para leitura (público)
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Policy para delete
CREATE POLICY "Tenant users can delete their property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.user_tenant_id()::text
);
```

## 8. Testar Conexão

Execute no projeto:

```bash
npm run dev
```

O middleware de autenticação deve estar funcionando.

## 9. Próximos Passos

Após configurar o Supabase:
- ✅ Fase 2 completa
- → Iniciar Fase 3: Portal Admin
- → Criar layouts e componentes
- → Implementar CRUD de imobiliárias

## Troubleshooting

### Erro: "relation does not exist"
- As migrations não foram aplicadas. Execute-as na ordem.

### Erro: "permission denied for table"
- RLS policies não estão corretas. Verifique a migration 002.

### Erro: "row-level security policy for table"
- O usuário não tem permissão. Verifique o role no perfil.

### Variáveis de ambiente não carregam
- Reinicie o servidor de desenvolvimento (`npm run dev`)
- Verifique se o arquivo é `.env.local` (não `.env`)

## Links Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
