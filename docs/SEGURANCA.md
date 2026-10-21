# Segurança e operação

## Fronteiras de confiança

1. Navegador público: não confiável, sem acesso direto a dados privados.
2. Usuário autenticado: tenant e role são derivados do perfil no servidor/RLS; valores do navegador nunca definem autorização.
3. Serviço da imobiliária: roda na VM e possui chaves locais. Quem controla root também pode inspecionar ou alterar o software.
4. Serviço Pepius de licenças: deployment separado com banco comercial, tokens de operador e chave privada de assinatura.

## Dados e exposição

- A tabela `properties` contém endereço/CEP e só deve ser lida por usuários do tenant. O app busca pela credencial server-side e converte em DTO público sem `endereco`, `cep`, tenant, telefone privado ou metadados.
- `tenants`, `profiles`, `leads` e `property_images` são tabelas sem leitura anônima. A chave Supabase anon pode aparecer no navegador; nunca incluir service-role.
- APIs retornam allowlists de campos, `Cache-Control: no-store` para sessão, falham com mensagens genéricas e registram apenas códigos de erro, sem token ou conteúdo de lead.
- SQL de aplicação usa filtros parametrizados via Supabase; funções `SECURITY DEFINER` qualificam schemas e fixam `search_path`.

## Acesso e sessão

- Auth Supabase confirma a sessão no servidor; apenas `imobiliaria_owner` e `imobiliaria_user` entram no painel.
- Nenhum metadata de signup define role ou tenant. O CLI local provisiona primeiro responsável usando service-role fora do navegador.
- Mutations do navegador validam origem e licença; APIs revalidam tenant/role e RLS aplica o isolamento. Proxy Next 16 não substitui autenticação de rota.
- Owner é necessário para configurar a vitrine; equipe tem operações conforme licença. Role e tenant não são aceitos do body.
- Login usa mensagens genéricas e profile API retorna apenas role.

## Leads, SQL e abuso público

- Zod strict valida JSON, comprimentos, UUID, enum, e-mail/telefone, preferência e honeypot.
- Lead só é gravado após validar lease/features, tenant, imóvel disponível e limite de IP. O IP é HMAC-SHA-256 com pepper local e usado em contador atômico de 15 min (máximo inicial de cinco tentativas).
- Rejeitar origem inválida em mutações gerenciais, payloads grandes e IDs fora do formato. Nunca interpolar SQL do request.
- Monitorar crescimento da tabela de rate-limit e limpar registros expirados pelo procedimento operacional.

## Imagens

- Bucket `property-images` é privado; caminho começa com `<tenant UUID>/<property UUID>/`.
- Upload limita 5 MB, MIME JPEG/PNG/WebP e verifica magic bytes. Filename gerado no servidor; não confiar em filename, URL ou tenant do navegador.
- App assina URL por cinco minutos; exportação usa até uma hora. URLs assinadas são credenciais temporárias e devem ser tratadas como segredo.
- Backups cobrem binários de Storage, não só Postgres. Proteja acesso a volumes e snapshots.

## Licença e controle central

- Ed25519, leases assinados e verificação local com allowlist de public keys/key ID. Private signing key e operator Bearer tokens ficam só no ambiente Pepius, fora do pacote/VM.
- Código de ativação tem entropia aleatória, é armazenado como SHA-256 e consumido atomicamente. Instalação assina heartbeat com sua chave privada local.
- Estado central recebe instalação/status/funcionalidades/datas e trilha operacional; não recebe imóveis, leads nem imagens.
- Heartbeat 24h, lease máximo sete dias. A regra de atraso suspende após 15 dias corridos; licença inválida/expirada fecha acesso público e escritas. Leia-se preservada e exportável.
- Logs de auditoria devem registrar ator, ação e contexto estritamente comercial; não incluir códigos ou tokens. Rotacione operator tokens e chaves de assinatura com plano de sobreposição de public keys.
- O cliente com root pode adulterar binário, relógio e banco. O mecanismo não promete DRM anti-root; backups independentes são necessários.

## Infra, secrets e criptografia

- TLS termina no Caddy; configure domínio real e renovação automática. Configure DNS e firewall para portas 80/443 apenas, acesso administrativo por VPN/allowlist.
- Não expor PostgreSQL, Studio, Storage ou Kong diretamente. Use a network Docker do Supabase e `SUPABASE_INTERNAL_URL=http://kong:8000` entre serviços.
- Rotacione senha do Postgres, JWT secret, anon/service keys, peppers e operator tokens; altere cada serviço relacionado e teste login/heartbeat após rotação.
- Criptografe volume/disco e backups em repouso; proteja as chaves de backup separadas da VM. TLS protege trânsito, não volume comprometido.
- `.env.onprem`, `.env.local`, chave privada de licença e volumes de chaves nunca entram no Git, imagem, log ou suporte remoto.
- Respostas autenticadas usam `Cache-Control: no-store`; configuração de hardening aplica nos headers globais. CSP precisa de trabalho específico antes de ativar por causa de scripts inline do Next.

## Backup, atualização, restore

1. Criar backup consistente de Postgres e uma cópia separada dos objetos de Storage/config.
2. Cifrar, versionar, restringir acesso e armazenar cópia fora da VM/site.
3. Registrar versão de Supabase, app, migrations, `.env` sem secrets no inventário e passos de rotação.
4. Restaurar banco e imagens em VM isolada, aplicar migrations compatíveis e validar login, vitrine, imagem, lead e licença.
5. Atualizar somente com release versionada, backup antes de migrations e rollback planejado. Migrations destrutivas precisam ser revisadas antes de execução.

## Limites de validação atual

Testes unitários locais não comprovam políticas RLS reais, instalação Supabase, segurança de VM, cifra/restauração ou compatibilidade de upgrade. Executar testes de aceite em stack self-hosted limpa e numa cópia com dados antes de liberar uma instalação comercial.
