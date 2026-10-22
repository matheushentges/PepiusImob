# Revisão do módulo inicial — 2026-10-21

## Escopo e método

Esta revisão compara o plano on-premise vigente com o código da vitrine pública, painel da imobiliária, APIs e CLI de licença, migrations, controles de segurança e guias operacionais. O escopo continua sendo uma instalação por imobiliária: vitrine e painel gerencial, com ativação/suspensão operadas pela Pepius via API/CLI.

Usei o guia visual [`../.interface-design/system.md`](../.interface-design/system.md), a skill Superpowers de brainstorming e a skill `frontend-design`. O guia existente prevalece sobre preferências visuais genéricas: DM Serif/DM Sans, azul-ardósia, terracota e linhas finas da identidade Linha de Planta.

Foi uma inspeção estática. Não rodei testes, não apliquei migrations e não validei uma instalação Supabase real. Também não havia ferramenta de navegador/captura de tela disponível para conferir a renderização final em desktop e celular.

## Avaliação

**A fundação técnica está presente, mas o módulo ainda não está pronto para uma imobiliária piloto.** As lacunas mais importantes estão nos fluxos visíveis de gestão, na implantação real do controle de licenças e na evidência de segurança/recuperação em Supabase self-hosted.

Status significa: **implementado no código** não implica validação operacional; **parcial** indica uma API ou parte de fluxo sem a experiência completa; **pendente** exige código, decisão ou ensaio real.

## Vitrine pública

### Implementado no código

- Home, busca/listagem, detalhe do imóvel e formulário de contato dinâmicos, ligados ao banco local.
- Consulta pública com projeção explícita de campos, sem endereço completo/CEP; fotos ficam no Storage privado e são servidas por URL assinada curta.
- Busca por texto, finalidade, categoria e faixa de preço na listagem.
- Lead validado no servidor, associado a imóvel/tenant, com honeypot e limite por IP.

Referências: [`src/app/(public)/page.tsx`](../src/app/%28public%29/page.tsx), [`src/app/(public)/imoveis`](../src/app/%28public%29/imoveis), [`src/app/api/public/leads/route.ts`](../src/app/api/public/leads/route.ts), [`src/lib/public-listings.ts`](../src/lib/public-listings.ts).

### Pendências funcionais e visuais

1. **Configuração da home — parcial.** O painel salva título e descrição da vitrine, mas a home usa texto fixo; os valores configurados aparecem na listagem. A imobiliária não consegue personalizar a primeira página como o painel promete.
2. **Venda e locação simultâneas — pendente.** O cadastro aceita `finalidade=ambos` e dois preços, mas o modelo público produz um único tipo/preço e prioriza venda quando ambos existem. A listagem e o detalhe não mostram as duas opções corretamente.
3. **Destaques — pendente de decisão/implementação.** O mapeamento público sempre define `featured: false`; a home então mostra os três imóveis mais recentes sob o título “em destaque”. Não há campo ou controle gerencial para escolher destaques.
4. **Navegação e continuidade da marca — parcial.** A home esconde os links de navegação em telas pequenas sem substituí-los por menu móvel. A rota `/imoveis` não recebe cabeçalho/rodapé compartilhados; detalhe e home têm estruturas próprias. Revisar os três estados juntos contra Linha de Planta, sem trocar a paleta aprovada.
5. **Escala da vitrine — pendente.** A listagem carrega todos os imóveis e todas as fotos para o navegador, assina URLs de cada imagem e filtra localmente. Falta paginação/limite e busca no servidor antes de crescer o catálogo.
6. **SEO e nome da instalação — parcial.** O metadata global é genérico e não usa o nome/textos da imobiliária. O detalhe cria metadata próprio; home e listagem não têm metadata específico nem sitemap/robots confirmado.

## Painel da imobiliária

### Implementado no código

- Autenticação Supabase; o servidor deriva tenant e role do perfil. Rotas de gestão usam contexto autenticado e RLS.
- Dashboard, CRUD de imóveis, upload/seleção de capa e exclusão de fotos, configurações whitelisted e exportação autenticada.
- APIs de leitura e mudança de status de leads; modo suspenso preserva leitura e exportação.

Referências: [`src/app/(dashboard)`](../src/app/%28dashboard%29), [`src/lib/auth/agency.ts`](../src/lib/auth/agency.ts), [`src/app/api/dashboard`](../src/app/api/dashboard).

### Pendências que impedem o fluxo completo

1. **Gestão de leads — parcial, prioridade máxima.** A tela tem campos de busca/status sem estado ou handlers e um botão “Ver Detalhes” sem ação. A API `PATCH` de status existe, mas a equipe não consegue usá-la pela tela. Implementar detalhe legível e alteração de status; ligar filtros à lista e dar feedback de sucesso/erro.
2. **Filtros de imóveis — parcial.** A barra de busca e seletores da tabela não alteram a consulta nem filtram a lista.
3. **Menu administrativo em celular — pendente.** O botão hambúrguer do layout atual não tem `onClick`; há outro componente de navegação móvel com interação, mas ele não é montado pelo layout ativo.
4. **Fotos — fluxo suscetível a perda silenciosa.** No cadastro, falhas de upload são ignoradas e o imóvel é salvo como se o envio tivesse terminado. Na tela de fotos, falhas HTTP ao remover ou escolher capa não são exibidas e a interface pode divergir do banco. Ao excluir um imóvel, o banco pode remover os metadados relacionados, mas o handler não remove os objetos de Storage; eles podem ficar órfãos.
5. **Ciclo de vida das contas — incompleto.** O provisionamento cria somente a primeira conta responsável. Há roles owner/equipe, mas não há convite/criação/remoção de usuários nem fluxo de recuperação/troca de senha. As telas de login apontam “Fale conosco” para `/contato`, rota que não existe.
6. **Operação de leads — decidir.** O envio grava localmente e aparece no painel, sem notificação para a imobiliária. Confirmar se a equipe deve consultar o painel manualmente no MVP ou se precisa de aviso por e-mail; WhatsApp/Inbox continuam fora do escopo aprovado.
7. **Privacidade — pendente antes de uso público.** O formulário recolhe nome, telefone, e-mail, mensagem e preferência de horário sem aviso/link de privacidade visível. Definir aviso, finalidade, retenção e procedimento de exclusão/exportação dos leads.

## Controle central Pepius de licenças

### Implementado no código

- API de emissão/consulta, suspensão/restauração, registro de pagamento, ativação e heartbeat; CLI de operador.
- Ativação de uso único com repetição idempotente para a mesma instalação/chave, leases Ed25519 de até sete dias e regra de atraso de 15 dias.
- Dados comerciais e chave de assinatura separados do banco da imobiliária por projeto Supabase/configuração; a instalação recebe somente lease assinada e chave pública.

Referências: [`src/app/api/licensing/v1`](../src/app/api/licensing/v1), [`src/lib/licensing`](../src/lib/licensing), [`scripts/license-admin.mjs`](../scripts/license-admin.mjs), [`license-control-plane/migrations`](../license-control-plane/migrations).

### Pendências operacionais

1. **Implantar o controle central.** O repositório contém a migration central e rotas dentro do app Next, mas não um deployment/runbook completo para uma instância Pepius separada. Os exemplos de ambiente não documentam URL/chave do Supabase central, chave privada e `keyId`, tokens de operador, rotação e recuperação. O código existe; não há evidência neste repositório de ambiente central configurado e ensaiado.
2. **Proteger a superfície de operador.** Bearer tokens fortes e comparação constante estão no código. Antes de operar clientes, definir deployment isolado, restrição de rede/allowlist ou equivalente, rotação/revogação de tokens, alertas, backup/restauração do banco comercial e proteção da chave privada. Não criar painel financeiro Pepius nesta fase.
3. **Recuperar instalação.** Documentar reinstalação/troca de VM, desativação de instalação antiga, nova ativação e restauração de backup sem duplicar licença.

## Segurança e operação on-premise

### Controles já presentes

- Supabase/PostgREST parametrizado; Zod strict e limite de corpo nos endpoints relevantes.
- Service-role e chaves privadas em módulos server-only; APIs conferem sessão, role, tenant e origem em mutações.
- RLS, políticas de tenant, bucket privado, URLs assinadas, limite atômico de leads e resposta pública com campos permitidos.
- Headers de segurança básicos e TLS pelo Caddy documentado.

### Evidências e hardening ainda necessários

1. **RLS e Storage ainda não foram ensaiados com sessão real.** `supabase/tests/on_prem_security.sql` confirma RLS/privilegios e grants anon, mas não simula usuários de dois tenants lendo/escrevendo registros, nem tentativas de acessar objetos Storage de outro tenant. Executar no Supabase self-hosted com anon, dois usuários, dois tenants e service-role.
2. **Cobertura automatizada estreita.** Os testes locais cobrem validação de imóvel e domínio/assinatura da licença; faltam testes de rotas e fluxos de ponta a ponta para authz, upload, leads, filtros e suspensão/exportação. A auditoria não executou testes.
3. **Metadados de imagem.** O upload valida MIME e magic bytes, mas armazena o arquivo original. Avaliar reprocessar imagens para remover EXIF/GPS antes de expor fotos publicamente.
4. **Instalação/restore sem evidência real.** A documentação descreve setup, backups separados de banco/Storage e restauração, mas ainda falta registrar um ensaio de instalação limpa, reboot, atualização/rollback e restore criptografado em VM isolada.
5. **Versões de imagem mutáveis.** `node:22-alpine` e `caddy:2-alpine` não fixam digest/patch. Fixar versões de release e registrar compatibilidade Supabase antes de vender atualização repetível.
6. **CSP.** A política de conteúdo não está ativada; `docs/SEGURANCA.md` registra que precisa de configuração compatível com os scripts do Next. Fechar essa hardening após validar as rotas e a renderização.

## Documentação que contradiz o produto

O [`DEPLOY.md`](../DEPLOY.md) na raiz ainda ensina deploy de produção na Vercel, configura variáveis de funcionalidades omnichannel/IA, seed de admin e cadastro SaaS. O plano atual diz que Vercel é apenas Preview e que a entrega comercial roda on-premise. Reescrever o guia ou arquivá-lo com aviso claro antes de usá-lo como instrução de implantação.

## Ordem sugerida para fechar o MVP

### P0 — antes do piloto

1. Completar o fluxo de leads pela interface: detalhe, mudança de status e filtros funcionais.
2. Corrigir a representação de imóveis para venda+locação e decidir se “destaques” é uma função do MVP.
3. Implantar o control plane em ambiente Pepius separado e ensaiar emissão, ativação, heartbeat, suspensão manual/financeira, pagamento e reativação.
4. Instalar em VM limpa com Supabase self-hosted, executar migrations e simular anon, usuários de tenants, fotos e licença suspensa.
5. Fazer backup cifrado e restaurar banco e imagens em VM isolada; guardar evidência e versão de todos os serviços.

### P1 — antes da primeira instalação comercial

1. Fazer barra de imóveis e leads funcionar; implementar paginação.
2. Corrigir navegação móvel; harmonizar home/listagem/detalhe com o guia Linha de Planta.
3. Aplicar os textos configurados na home e resolver onboarding, recuperação e gestão de usuários.
4. Dar resultado visível em falhas de upload/exclusão e limpar imagens ao remover imóvel.
5. Publicar aviso de privacidade/retention para contatos e remover metadados EXIF/GPS das fotos.
6. Atualizar `DEPLOY.md`, exemplos de ambiente e instruções do deployment central.

### P2 — evolução

- SEO local (metadata por instalação, sitemap e robots), alertas operacionais, limpeza automatizada de rate-limit, CSP testada e observabilidade mínima de versão/heartbeat.
- Painel Pepius, gateway, cobrança automática, portal financeiro, Inbox e IA permanecem no roadmap separado.

## Critério de pronto do módulo inicial

Uma equipe consegue entrar, cadastrar/editar/publicar imóveis e fotos, acompanhar contatos, atualizar status e personalizar a home em desktop e celular. Um cliente final encontra imóveis, vê todas as opções de venda/locação e envia contato sem receber dados privados. Uma instalação Supabase self-hosted limpa consegue ser instalada, suspensa/reativada por licença, atualizada e restaurada a partir de backup criptografado, com as políticas testadas em sessão real.\n