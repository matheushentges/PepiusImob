# Glossário

| Termo | Significado neste produto |
| --- | --- |
| Instalação | Cópia do app, Supabase e PostgreSQL isolados na VM de uma imobiliária. |
| Imobiliária/tenant | Entidade única atendida por uma instalação on-premise; `tenant_id` agrupa seus dados. |
| Vitrine | Site público de lista, busca, detalhes e contato de imóveis. |
| Painel gerencial | Área autenticada da equipe para imóveis, fotos, leads e textos/cores. |
| Lead | Solicitação de contato do visitante vinculada a um imóvel e guardada localmente. |
| Plano | Oferta comercial definida pela Pepius; pode conceder funcionalidades e preço. |
| Feature | Identificador assinado que libera uma parte do app, por exemplo `public-listing`, `properties`, `leads`. |
| Código de ativação | Segredo de uso único emitido pela Pepius e trocado por vínculo de instalação e lease. |
| Lease | Declaração Ed25519 assinada, curta e renovável, com estado, features e expiração. |
| Heartbeat | Comunicação periódica autenticada entre agente local e serviço Pepius. Não carrega dados imobiliários. |
| Control plane | Serviço central Pepius para contrato, licença, ativação, pagamento manual/auditado e heartbeat. |
| API de operador | Rotas privadas Bearer token usadas por CLI/futura plataforma, não acessíveis aos usuários da imobiliária. |
| RLS | Row Level Security do PostgreSQL; regra por linha no banco, além das verificações do servidor. |
| URL assinada | Link temporário que concede acesso a arquivo privado específico no Storage. |
| Modo somente leitura | Estado suspenso/lease expirado no qual painel consulta e exporta; vitrine e escrita estão bloqueadas. |
| Offline | Ausência do serviço central; o lease atual vale até sete dias no máximo. |
| On-premise | Software executado na infraestrutura da imobiliária e administrado pelo cliente. |
