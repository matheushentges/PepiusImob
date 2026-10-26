# Deploy e Operação do Pepius Imob

Este repositório entrega uma aplicação **on-premise/cloud-premise**: uma imobiliária por instalação, rodando com Supabase self-hosted, PostgreSQL local e serviços integrados na máquina virtual do cliente ou em infraestrutura dedicada.

> [!IMPORTANT]
> **A Vercel NÃO é utilizada para deploy deste projeto.**
> Qualquer deploy na Vercel foi formalmente descontinuado e abandonado. Toda a infraestrutura oficial é operada diretamente em máquina virtual dedicada via Docker Compose e Caddy.

> [!WARNING]
> **Segurança de Infraestrutura:** Endereços de IP reais, credenciais de produção e caminhos locais de chaves SSH pertencem estritamente ao ambiente local e **nunca** devem ser comitados neste repositório.

---

## 1. Arquitetura de Produção

A aplicação é executada em uma máquina virtual Linux dedicada (Ubuntu 22.04 / 24.04 LTS x86_64 ou ARM64):

- **Reverse Proxy & TLS:** Caddy v2 com Let's Encrypt TLS automático para os domínios configurados via variáveis de ambiente.
- **Serviços Orquestrados em Docker:**
  - **Vitrine & Painel Gerencial:** Next.js standalone container (`pepius-app`) na porta interna 3000.
  - **Supabase Self-Hosted:** Gateway unificado Envoy na porta 8000 (PostgreSQL 17 local, Auth GoTrue, Storage privado).
  - **Automação & Webhooks:** n8n v1.x para esteira de eventos e agenda.
  - **WhatsApp API:** Evolution API para atendimento e notificações de visitas.

---

## 2. Procedimento de Deploy e Atualização

Para atualizar o código e aplicar novas versões na máquina virtual:

### Passo 1: Conexão via SSH
```bash
# Conecte à VM utilizando a sua chave privada SSH local
ssh -i "<CAMINHO_PARA_SUA_CHAVE_PRIVADA>" <USUARIO>@<IP_DA_VM>
```

### Passo 2: Acessar a pasta do projeto e atualizar o código
```bash
cd /caminho/do/projeto/pepius-imob
git pull origin main
```

### Passo 3: Recompilar e reiniciar o container Next.js
```bash
docker compose -f deployment/docker-compose.integrations.yml build pepius-app
docker compose -f deployment/docker-compose.integrations.yml up -d pepius-app
```

### Passo 4: Verificar integridade (Healthcheck) e logs
```bash
# Validar status HTTP 200 do healthcheck local
curl -s http://localhost:3000/api/health | jq .

# Acompanhar logs em tempo real
docker compose -f deployment/docker-compose.integrations.yml logs -f --tail=50 pepius-app
```

---

## 3. Preparação Inicial de um Novo Servidor

Ao provisionar uma nova máquina virtual (Ubuntu 22.04 / 24.04 LTS):

1. Execute o script de preparação:
   ```bash
   bash deployment/setup-server.sh
   ```
   *Instala Docker Engine, Docker Compose plugin, ativa 4 GB de Swap e configura regras de firewall UFW/iptables para as portas 22, 80 e 443.*

2. Configure o arquivo de variáveis locais `deployment/.env` com os domínios e segredos da instalação.

3. Suba o stack completo:
   ```bash
   docker compose -f deployment/docker-compose.integrations.yml up -d
   ```

---

## 4. Verificação Prévia Local Antes do Push

Antes de enviar commits para o repositório remoto:

```bash
npm run type-check
npm run lint
npm test
npm run build
```
