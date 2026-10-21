# Checklist de instalação Pepius Imob on-premise

## Antes da VM

- [ ] Definir responsável do cliente por VM, rede, disco, backups e recuperação.
- [ ] Provisionar VM Linux, DNS público, TLS, firewall e acesso administrativo por VPN/allowlist.
- [ ] Registrar release Supabase oficial fixada e `PEPIUS_VERSION` da aplicação.
- [ ] Gerar secrets fortes/únicos para Postgres, JWT, anon/service-role, pepper e instalação.
- [ ] Guardar secrets de serviço central em ambiente Pepius separado; cliente recebe só URL e public keys de verificação.

## Supabase self-hosted

- [ ] Instalar Compose oficial em pasta separada e confirmar rede `supabase_default`.
- [ ] Restringir Postgres/Studio a localhost/rede privada; portas administrativas não públicas.
- [ ] Configurar domínio público de API em Kong e URL interna `http://kong:8000`.
- [ ] Fazer `supabase db push --dry-run` contra o banco de destino e revisar cada migration.
- [ ] Exportar licenças/comercial/admin legados se houver antes da migration on-premise destrutiva.
- [ ] Aplicar migrations e auditar grants/RLS com anon, authenticated e service-role.
- [ ] Confirmar bucket `property-images` privado, tipos aceitos e limite de tamanho.

## Aplicação e licença

- [ ] Criar `.env.onprem` a partir do modelo, revisar domínio, URLs pública/interna, anon key, service-role, tenant, HMAC pepper, trusted public keys e bypass desabilitado.
- [ ] Construir imagens com tag de release imutável e iniciar Caddy, app e agente.
- [ ] Criar tenant/usuário responsável pela CLI local e guardar senha temporária fora do shell history.
- [ ] Ativar com código de uso único e confirmar assinatura/validade no estado local.
- [ ] Confirmar heartbeat autenticado, DNS, certificado TLS, `X-Real-IP` e envio de contato limitado.
- [ ] Confirmar que não há diretório de segredo ou service-role dentro de artefatos públicos/client bundle.

## Aceite funcional e segurança

- [ ] Visitante vê somente imóveis disponíveis e campos públicos permitidos; address/CEP não aparecem no JSON/REST público.
- [ ] Usuários de imobiliária gerem somente seu tenant e seus arquivos; visitante/role cliente não entra no painel.
- [ ] Testar SQL injection, UUID inválido, campo extra `tenant_id`/`role`, payload grande, MIME falso e URL de objeto de outro tenant.
- [ ] Testar activation code one-time, idempotência da mesma chave e rejeição de chave/assinatura adulterada ou desconhecida.
- [ ] Testar indisponibilidade central, dias offline 1–7, lease expirada no dia 8, atraso nos dias 14/15, suspensão, leitura/exportação e reativação.
- [ ] Confirmar lead sem exposição no log e sem acesso anônimo via REST.

## Backup, restauração e atualização

- [ ] Criar backup cifrado de Postgres e cópia independente de Storage/config.
- [ ] Guardar cópia fora da VM, restringir acesso e registrar retenção/RPO/RTO.
- [ ] Restaurar ambos numa VM isolada; validar autenticação, imóvel, foto, lead, licença e exportação.
- [ ] Testar restart/reboot e persistência de volumes e identidade de licença.
- [ ] Atualizar cópia de staging com app versionado + migration; testar rollback conforme estratégia.
- [ ] Registrar evidência, versão e responsáveis.
