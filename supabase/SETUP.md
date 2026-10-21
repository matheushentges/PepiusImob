# Supabase: desenvolvimento Cloud e instalação on-premise

## Desenvolvimento

Desenvolvimento continua usando Supabase Cloud. Configure as chaves de desenvolvimento em `.env.local`, faça link do projeto e aplique as migrations:

```bash
supabase login
supabase link --project-ref <ref-do-projeto-de-desenvolvimento>
supabase db push --dry-run
supabase db push
```

Não use chaves de produção local/on-premise no desenvolvimento.

## Supabase self-hosted na VM da imobiliária

O banco entregue é PostgreSQL. Não há suporte ou configuração de MySQL. Instale o Supabase self-hosted em Docker Compose a partir do repositório oficial e fixe uma release compatível; não misture versões individuais dos serviços sem validar o conjunto. A documentação de instalação, atualização e responsabilidades operacionais está em [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting/docker).

1. Prepare uma VM Linux suportada, firewall, DNS, TLS e espaço de disco para banco, imagens e backups.
2. Instale o stack oficial Supabase self-hosted numa pasta separada, use um nome de projeto Compose `supabase` (a rede esperada será `supabase_default`) e mantenha `.env` fora do repositório.
3. Restrinja PostgreSQL e Supabase Studio à rede privada ou localhost. Não publique a porta 5432, Studio nem a porta do Kong diretamente na Internet. O Compose Pepius publica Caddy nas portas 80/443 e encaminha `api.<domínio>` para Kong dentro da rede Docker.
4. Aplique as migrations versionadas deste projeto ao banco on-premise. Instale o Supabase CLI e use a URL local de PostgreSQL; faça primeiro `db push --dry-run` e revise as migrations pendentes:

   ```bash
   supabase db push --db-url 'postgresql://postgres:<senha-URL-encoded>@127.0.0.1:5432/postgres' --dry-run
   supabase db push --db-url 'postgresql://postgres:<senha-URL-encoded>@127.0.0.1:5432/postgres'
   ```

5. A migration `20261021000001_on_prem_license_security.sql` migra o banco legado de imobiliária: remove a licença antiga e os dados comerciais/conta administrativa global, remove o seed de demonstração, endurece RLS e torna Storage privado. Exporte dados de faturamento/contas reais antes de aplicá-la. Em instalações novas, os registros de demonstração são descartados intencionalmente.
6. Copie `.env.onprem.example` para `.env.onprem`; configure chaves geradas pelo stack local, domínio, rede, ID do tenant, pepper aleatório de rate limit e a chave pública de licença fornecida pela Pepius. `LICENSE_DEV_BYPASS` deve ser `false`.
7. Construa e inicie a versão fixada do aplicativo:

   ```bash
   docker compose --env-file .env.onprem -f deployment/docker-compose.yml build
   docker compose --env-file .env.onprem -f deployment/docker-compose.yml up -d
   ```

8. Crie o tenant e o usuário responsável de dentro do container de provisionamento. Use uma senha temporária forte e não a passe como argumento de shell:

   ```bash
   docker compose --env-file .env.onprem -f deployment/docker-compose.yml run --rm \
     -e AGENCY_NAME -e AGENCY_SLUG -e AGENCY_EMAIL -e AGENCY_PHONE \
     -e AGENCY_OWNER_NAME -e AGENCY_OWNER_EMAIL -e AGENCY_OWNER_PASSWORD \
     license-agent node scripts/agency-provision.mjs
   ```

   Grave o `tenantId` retornado em `PEPIUS_TENANT_ID` no `.env.onprem` e recrie os serviços `pepius-app` e `license-agent`.
9. Ative a instalação com o código de uso único emitido pela Pepius:

   ```bash
   docker compose --env-file .env.onprem -f deployment/docker-compose.yml run --rm \
     -e PEPIUS_ACTIVATION_CODE license-agent \
     node --experimental-strip-types scripts/license.mjs activate
   ```

10. Faça login, publique um imóvel e confirme vitrine, imagem, lead, expiração da URL assinada, exportação e bloqueio de escrita quando a licença não está ativa.

## Atualizações, backup e restauração

O Compose em `deployment/` contém o app Pepius, Caddy e o agente de heartbeat. A stack do Supabase tem Compose e ciclos de atualização próprios. Registre `PEPIUS_VERSION`, faça backup, leia o changelog, aplique migrations com dry-run e teste uma atualização em cópia antes de atualizar produção. Mantenha a imagem anterior para rollback compatível com a migration já aplicada.

O operador da VM protege e testa cópias criptografadas do banco e dos objetos do Storage; snapshots apenas de Postgres não incluem as imagens. A documentação oficial descreve backup/restauração do banco e avisa que os arquivos de Storage precisam de tratamento próprio: [restauração para self-hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform) e [acesso ao PostgreSQL](https://supabase.com/docs/guides/self-hosting/accessing-postgres). A Pepius publica o procedimento de restauração da aplicação em [[SEGURANCA]].

## Serviço central de licenças (ambiente Pepius separado)

`license-control-plane/migrations/0001_license_control_plane.sql` deve ser aplicado a um projeto Supabase separado, controlado pela Pepius, nunca ao banco da imobiliária. Somente esse serviço recebe chave privada Ed25519, chave service-role, tokens dos operadores e flag `LICENSE_CONTROL_PLANE_ENABLED=true`. O pacote da imobiliária mantém essa flag falsa e não recebe segredos do operador.

Os comandos do proprietário ficam em `scripts/license-admin.mjs`; eles criam licenças, suspendem/restauram e registram pagamentos. A emissão guarda apenas hash do código de ativação. Não coloque tokens em histórico de shell, `.env.onprem` ou container de cliente. Veja [[PLANO_CONTROL_PLANE_FUTURO]].
