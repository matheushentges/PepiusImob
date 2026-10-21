# ADR 0001: PostgreSQL on-premise e serviço central de licença

- Status: Aceito
- Data: 2026-10-21
- Contexto relacionado: [[PLANO_ON_PREMISE]], [[SEGURANCA]]

## Contexto

O produto deixa de ser SaaS multi-tenant e passa a ser instalado isoladamente na VM de cada imobiliária. A Pepius precisa licenciar e suspender instalações mesmo sem acesso ao banco local, enquanto os dados comerciais da imobiliária devem permanecer no ambiente do cliente. O desenvolvimento em andamento já usa Supabase Cloud.

## Decisão

- Manter Supabase Cloud durante desenvolvimento e validação.
- Em produção on-premise, instalar Supabase self-hosted em Docker Compose com PostgreSQL local; não introduzir MySQL.
- Separar o banco/API comercial de licenças da instalação da imobiliária.
- Assinar leases Ed25519 no control plane; entregar às instalações somente a chave pública. A instalação possui identidade/chave própria para heartbeat.
- Usar lease renovável com heartbeat diário, tolerância offline máxima de sete dias e regra de suspensão após 15 dias corridos de atraso.
- Preservar acesso em leitura/exportação de dados quando suspensa e manter os dados locais. Parar vitrine e mutations.
- Operar control plane inicialmente por CLI/API privada e auditada; a UI financeira será outro produto futuro.
- Cada tenant terá uma instalação; a vitrine usa projeção de servidor, não acesso público à tabela de imóveis.

## Consequências

- O cliente assume segurança, atualizações, armazenamento, backup e recuperação da VM; fotos do Storage exigem cópia separada do Postgres.
- A Pepius precisa gerenciar disponibilidade do control plane, chave privada, tokens, audit logs e ciclo de rotação de chaves.
- Falta de rede não suspende imediatamente uma licença válida; quando lease vence, acesso de público/escrita fecha até a validação seguinte.
- Quem possui root pode adulterar a aplicação; a decisão fornece controle operacional de licença, não DRM resistente a root.
- A migration que remove tabelas/licença/admin global legados deve preservar/exportar dados comerciais reais antes de execução.
- Migrations, cliente Supabase, Compose e procedimentos de restore precisam de ensaio em VM de aceite.

## Alternativas consideradas

- **Manter SaaS do app:** rejeitado porque o novo requisito é dados e runtime na VM da imobiliária.
- **MySQL local:** rejeitado; Supabase depende de PostgreSQL e migração de engine aumentaria incompatibilidade sem benefício definido.
- **Licença apenas em arquivo editável:** rejeitado; não oferece assinatura nem validade verificável local.
- **Bloqueio remoto instantâneo:** rejeitado por conflito com operação offline e rede instável; revogação ocorre por heartbeat/expiração.
- **Painel financeiro no produto imobiliário:** rejeitado; mistura papéis e segredos, aumenta superfície na VM e antecipa um produto separado.

## Revisão

Revisar se o modelo de venda exigir múltiplas instâncias por cliente, expiração maior, telemetria, gateway, portabilidade de VM, ou se os testes demonstrarem falhas de assinatura/recuperação.
