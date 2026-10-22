# Plano de produto e implementação — Pepius Imob on-premise

## Objetivo do produto

Fornecer a uma imobiliária uma instalação privada e operada em sua VM. O cliente usa uma vitrine pública para buscar e consultar imóveis e um painel gerencial para manter imóveis, fotos, leads e textos/cores da vitrine. A Pepius vende licenças e publica versões por uma camada central de controle; essa camada não recebe dados imobiliários.

## Usuários e limites de produto

| Usuário | O que faz |
| --- | --- |
| Visitante/cliente final | Pesquisa a vitrine, consulta imóveis e solicita contato. |
| Equipe da imobiliária | Mantém imóveis e fotos, lê leads e configura a vitrine. |
| Responsável da imobiliária | Além do gerenciamento, atualiza textos e cores do site. |
| Operador Pepius | Em ambiente privado, emite licença, registra pagamento e suspende/restaura instalação via CLI/API auditada. |

O pacote da imobiliária não inclui painel administrativo Pepius, cobrança online, gateway, Inbox, WhatsApp, calendário ou IA. A futura plataforma de gestão comercial e financeira está descrita em [[PLANO_CONTROL_PLANE_FUTURO]].

## Infraestrutura

- Desenvolvimento: Supabase Cloud.
- Vercel serve apenas para Preview de desenvolvimento, com `LICENSE_DEV_BYPASS=true` e dados Supabase isolados; Vercel Production nunca ignora a licença nem substitui a instalação on-premise.
- Cliente: Supabase self-hosted em Compose e PostgreSQL local na VM, uma instalação por imobiliária.
- App Next.js 16 no Compose Pepius, atrás de Caddy/TLS. O serviço interno de Kong só atende pela rede Docker.
- Storage self-hosted guarda imagens na VM. Banco e Storage são itens separados de backup/restauração.
- O cliente controla VM/root, rede, discos, chaves Supabase locais, backup e recuperação. Pepius controla o serviço central de licenças e releases.
- MySQL não é suportado nesta arquitetura.

## Vitrine pública

- Lista responsiva e busca/filtros sobre imóveis disponíveis.
- Detalhe do imóvel com campos públicos permitidos, fotos e localização sem endereço completo/CEP.
- Formulário de contato com validação, honeypot, limite de requisições e registro privado de lead.
- Vitrine não renderiza quando a lease não está ativa ou não contém `public-listing`.

## Painel imobiliário

- Usuários com roles `imobiliaria_owner` e `imobiliaria_user`; a role e o tenant vêm do perfil autenticado, nunca do request do navegador.
- Imóveis: cadastrar, editar, publicar/arquivar e remover; imagens JPEG, PNG e WebP até 5 MB.
- Leads: consultar contatos e atualizar status.
- Configuração: nome da imobiliária é leitura; apenas responsável altera título, descrição e cores whitelisted.
- Suspensão/expiração: painel em leitura, sem vitrine nem escritas, com exportação JSON dos imóveis/leads e links assinados para imagens.

## Licenciamento

### Modelo

O controle central usa banco separado e API privada autenticada. O operador emite e registra dados comerciais manualmente por CLI/API. A chave privada Ed25519 fica somente no ambiente Pepius; as instalações contêm apenas chaves públicas e material local de chave de instalação.

O código de ativação é aleatório, de uso único, armazenado no central como hash e associado a uma instalação/chave pública. Reenvio da ativação pode ser idempotente apenas para o mesmo `installationId` e chave pública.

### Ciclo de vida e comportamento

1. Ativação online recebe lease assinado, com instalação, estado, funcionalidades, `issuedAt` e validade.
2. Heartbeat assinado roda a cada 24h. Lease tem validade máxima de sete dias, que também limita funcionamento offline.
3. Após 15 dias corridos de atraso do pagamento, a API central emite estado suspenso. A próxima comunicação aplica suspensão; em falha de conectividade, lease local expirada bloqueia a vitrine e escritas.
4. Suspensa, a instalação preserva o banco e arquivos; painel permite leitura/exportação, e nega alterações no servidor/RLS.
5. Ao registrar pagamento, o central limpa suspensão financeira e o heartbeat seguinte entrega lease ativa. Suspensão manual é imediata no próximo heartbeat.

O agente não envia imóveis/leads. Root no host pode modificar binários, relógio, banco e validação; essa arquitetura dificulta desativação casual e evita vazamento de negócio, mas não fornece DRM inviolável.

## Segurança obrigatória

- RLS e `tenant_id` originado do perfil; leitura pública apenas por projeção server-side allowlist.
- Sem acesso anônimo a tabelas brutas de imóveis, tenants, perfis ou leads. Endereço completo e CEP ficam privados.
- Validação estrita de inputs, parâmetros PostgREST, mensagens de erro genéricas e logging sem tokens/PII.
- Auth/AuthZ em cada API e operação, same-origin em mutations de navegador, cookies Supabase, segredos marcados server-only.
- Supabase Storage privado, diretórios por tenant, URLs assinadas curtas, tipo validado por MIME + magic bytes, tamanho máximo.
- Limitador atômico de leads por hash HMAC do IP + pepper local, honeypot e validação do imóvel.
- TLS na entrada, segredos fortes/rotacionados, discos e backups criptografados, firewall e atualização.
- Auditoria de emissão, ativação, suspensão, restauração e pagamento no controle central.

Detalhes e cenários de ameaça estão em [[SEGURANCA]].

## Operação do controle antes do futuro painel Pepius

O operador usa `scripts/license-admin.mjs` e endpoints `/api/licensing/v1/operator/*`, com Bearer token forte, ambiente separado e histórico auditável. A tela global `/admin` e endpoints `/api/admin` foram removidos do app imobiliário. A API central só existe ativa no deployment privado da Pepius (`LICENSE_CONTROL_PLANE_ENABLED=true`); para cliente é `false`.

## Migração do estado antigo

O projeto preserva as migrations históricas para criar o schema Supabase; a migration on-premise mais recente transforma esse schema, remove a tabela comercial `licenses`, demove roles `admin`, remove seed/dados da imobiliária de demonstração, endurece RLS e torna bucket privado. Ela não deve ser executada sem antes exportar pagamentos/licenças reais que estejam no banco de desenvolvimento. As imagens são mantidas no Storage e exigem backup próprio.

## Critérios de aceite da versão

- Vitrine lista apenas imóveis publicados da instalação e devolve somente campos whitelisted; endereço/CEP não são acessíveis com anon key nem na resposta web.
- Contato público valida payload/imóvel/licença e limita requisições; leads só aparecem no tenant correto.
- Usuários sem role de imobiliária não entram no painel; usuário de outro tenant não lê nem altera dados/arquivos.
- Tentativas de injeção, IDs inválidos, role/tenant forjados, content type falso e payload acima do limite são rejeitados.
- Assinatura adulterada/desconhecida, lease expirado e heartbeat forjado falham fechados; ativação é de uso único/idempotente à mesma identidade.
- Testar offline até sete dias, expiração posterior, atraso até o 14º dia, suspensão no início do 15º dia, modo leitura/export e reativação.
- Instalação limpa, restart persistente, atualização versionada, backup cifrado e restauração do banco **e** imagens validados em VM de aceite.
- Depois de cada entrega: atualizar [[OBSIDIAN]], [[RESUMO]], plano/checklist relevantes e ADR de decisão duradoura.

## Estado atual do repositório

Implementados: vitrine de dados reais, APIs de leads e gestão, configurações limitadas, roles de imobiliária, agente/API Ed25519, CLI de licenças e provisionamento, Dockerfiles/Compose/Caddy, migrations separadas da instalação e controle, exportação e documentação principal.

Esta lista descreve código existente, não aceite operacional. A revisão funcional e os próximos itens por prioridade estão em [[REVISAO_MODULO_INICIAL]]. Em especial, concluir o fluxo de leads na UI e validar o control plane e Supabase self-hosted antes do piloto.

Pendentes antes de cliente: testar migrations e RLS numa stack Supabase self-hosted limpa; exercitar provisionamento/ativação/suspensão/restore ponta a ponta; validar instalação e upgrade/rollback; completar backups restauráveis de Postgres e Storage; gerar e guardar as chaves reais; passar revisão de segurança e teste com duas imobiliárias isoladas. Não declare a versão pronta antes desses ensaios.
