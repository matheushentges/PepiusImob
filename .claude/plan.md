# Plano vigente — Pepius Imob

O escopo substitui o plano SaaS anterior. Consulte `docs/OBSIDIAN.md` para contexto canônico, `docs/PLANO_ON_PREMISE.md` para escopo/aceite, `docs/SEGURANCA.md` para controles e `docs/PLANO_CONTROL_PLANE_FUTURO.md` para a futura plataforma comercial Pepius.

## Produto entregue à imobiliária

- Vitrine pública responsiva com busca/lista/detalhe e contato.
- Painel autenticado para imóveis, imagens, leads e personalização da vitrine.
- Uma imobiliária por instalação on-premise em VM, usando Supabase self-hosted e PostgreSQL local. Supabase Cloud fica em desenvolvimento. Sem MySQL.
- Controle local de lease assinada Ed25519, heartbeat diário, offline por até sete dias, suspensão após 15 dias corridos de atraso, painel somente leitura/exportável e dados preservados.
- Segurança por RLS/tenant, autenticação e autorização server-side, projeção pública whitelisted, Storage privado, URLs assinadas, validação estrita, rate limiting e segredos server-only.

## Operação Pepius antes do produto futuro

API central separada, de ativação/heartbeat e rotas de operador privadas/auditadas. CLI emite código de uso único, suspende/restaura e registra pagamentos manualmente. Nunca enviar conteúdo de imóveis/leads. A API central fica desligada na instalação do cliente.

## Fora da entrega

Admin global Pepius no app imobiliário, Inbox omnichannel, IA, gateway financeiro, cobranças automatizadas e MySQL. O painel proprietário financeiro é produto independente futuro.

## Regra de execução e documentação

Para cada mudança, ler as instruções Next da versão instalada (`node_modules/next/dist/docs/`) antes de código de framework, manter testes correspondentes, atualizar o cérebro (`docs/OBSIDIAN.md`, `docs/RESUMO.md` e plano/checklist relacionado) e registrar decisões duradouras em ADR. Preservar o bloco gerado do Next no `AGENTS.md`.

O produto só pode ser marcado pronto depois de testar migration/RLS, isolamento entre tenants, fluxos de licença, instalação/upgrade e restauração criptografada de banco e Storage em Supabase self-hosted real.
