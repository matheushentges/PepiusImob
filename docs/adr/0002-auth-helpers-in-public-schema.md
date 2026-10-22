# ADR 0002: Helpers de autenticação no schema public

As migrations precisam funcionar no Supabase Cloud de desenvolvimento e no PostgreSQL self-hosted. Como o Supabase Cloud protege o schema `auth`, helpers de tenant e papel ficam no schema `public`, definidos como `SECURITY DEFINER` com `search_path` vazio e consulta limitada ao `auth.uid()` atual; migrations do produto não criam nem removem funções no schema `auth`.
