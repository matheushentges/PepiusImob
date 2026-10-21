<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Produto e documentação contínua

- Antes de implementar, leia `docs/OBSIDIAN.md` e o documento de escopo relacionado. O cérebro do produto define Pepius Imob on-premise, uma imobiliária por instalação, Supabase self-hosted com PostgreSQL local; desenvolvimento pode usar Supabase Cloud.
- Após cada entrega de código/arquitetura, atualize `docs/OBSIDIAN.md` e `docs/RESUMO.md`; atualize plano, checklist e progresso quando a mudança afetar esses documentos. Registre decisões arquiteturais duradouras em `docs/adr/`.
- Escreva documentos Markdown em UTF-8. Preserve este bloco Next.js gerado acima.
- Produto da imobiliária é somente vitrine e painel gerencial. Controle financeiro/admin global Pepius, gateway, Inbox e IA são produtos/escopos separados ou futuros. Não reintroduza MySQL.
- Não expor endereço completo, CEP, leads, dados de perfil ou segredos no acesso público. Não enviar imóveis/leads à API central de licença.
- Migrations destrutivas precisam ser revisadas e sinalizadas antes de serem aplicadas a dados reais. Não aplicar migrations a Supabase conectado sem dry-run e backup/export apropriado.
- Use interfaces server-only para service-role/chaves privadas, validação de schema, isolamento por tenant em servidor e RLS, Storage privado e testes de assinatura/licença.
