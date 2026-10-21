# Futuro produto: plataforma Pepius de licenças e finanças

## Objetivo

Criar uma plataforma administrativa separada, de propriedade e operação da Pepius, para gerir o ciclo comercial de clientes on-premise: contas, instalações, planos, licenças, pagamentos, cobrança e saúde operacional mínima. Ela deve consumir as interfaces de licença já definidas neste repositório; este documento registra o contexto para uma fase futura, sem adicionar sua UI ao pacote da imobiliária.

## Usuários e capacidades

- Dono/admin Pepius: gerenciar operadores e permissões, clientes, planos, preços, contratos, licenças, pagamentos e auditoria.
- Financeiro: consultar cobranças, registrar conciliação/pagamento, emitir relatórios e tratar inadimplência conforme política.
- Suporte: ver versão, ID da instalação, último heartbeat e estado da lease; sem acesso a imóveis, leads ou Storage do cliente.
- Cliente imobiliária (futuro, opcional): consultar faturas/licença, atualizar pagamento e abrir solicitação; sem gerenciar o produto imobiliário por este portal.

## Fronteiras

- Deployment, banco, domínio e secrets distintos do sistema imobiliário e do Supabase de cada cliente.
- Controle central guarda informações comerciais necessárias, public keys de instalação, leases/pagamentos e eventos de auditoria.
- Não recebe imóvel, lead, mensagem, imagem, credencial de funcionário ou cópia de banco local.
- Assinatura de leases usa chave privada Ed25519 em KMS/HSM ou segredo de alta proteção com rotação planejada; chave pública distribuída a instalações.
- API atual de ativação/heartbeat e operador manual permanece o contrato de licença. Uma UI/gateway chamará essa interface por operações internas autenticadas; não duplicará a lógica do ciclo de licença.

## Fases indicativas

1. **MVP operacional Pepius:** usuários/admins com RBAC e MFA, CRM de clientes, emissão/renovação/suspensão, pagamentos registrados manualmente, auditoria imutável e exportação financeira.
2. **Cobrança assistida:** integração de gateway com webhooks idempotentes, conciliação, retentativas, avisos e regras de inadimplência aprovadas. Não suspender com base em evento não verificado.
3. **Portal do cliente:** faturas e histórico, dados de contrato, atualização de método de pagamento, contatos e pedidos de renovação; não expor API key do operador.
4. **Observabilidade mínima:** versão do app e agente, heartbeat, falhas de licença, relógio e compatibilidade. Telemetria opt-in; sem dados de negócio e com retenção curta documentada.

## Requisitos que a fase futura deve preservar

- Separação de privilégios, MFA e autenticação forte para operador; autorização server-side por função e organização.
- Tokens rotacionáveis, segredos fora de front-end, rate limit, anti-replay, assinatura validada e logs de auditoria.
- Eventos do gateway autenticados por assinatura, deduplicados por ID, replay-safe e reconciliáveis com extrato.
- Inadimplência e suspensão comunicadas com regra e prazo claros; manter o lease assinado como fonte de estado local e os dados do cliente preservados.
- LGPD: minimização, retenção, exportação/apagamento conforme contrato e acesso a dados comerciais restrito.
- RTO/RPO, backup/restore, resposta a incidente, rotação de chave e continuidade sem controle central documentados antes da produção.

## Questões para a fase de descoberta

- Qual gateway, emissão fiscal, cobrança recorrente e estados de pagamento serão necessários?
- Como reconhecer e autorizar troca/reinstalação de VM, restauração de backup e rotação da chave local?
- Como operar assinatura com KMS/HSM, múltiplas chaves públicas e migração de key ID?
- Qual intervalo de renovação e prazo legal/comercial de tolerância?
- Qual telemetria mínima o contrato permite e qual retenção atende suporte sem monitorar conteúdo da imobiliária?

Este roadmap não concede autorização para coletar dados da instalação além do contrato de licença atual. Decisões futuras precisam de novo ADR e revisão de privacidade/segurança.
