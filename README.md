# Pepius Imob

Sistema on-premise para uma imobiliária por instalação: vitrine pública, painel gerencial, cadastro de imóveis, imagens e leads. A identidade visual Linha de Planta continua sendo a referência do produto.

## Arquitetura

- Durante o desenvolvimento, o projeto pode usar Supabase Cloud.
- Na instalação do cliente, o Supabase self-hosted roda em Docker Compose com PostgreSQL local na VM da imobiliária.
- O pacote não inclui painel global do proprietário, Inbox omnichannel ou recursos de IA.
- O controle de licenças fica no serviço central Pepius. A instalação recebe apenas a chave pública para validar leases assinados.
- A integração com o serviço central envia identificador da instalação e estado da licença; imóveis e leads permanecem na VM.

Consulte o [plano on-premise](docs/PLANO_ON_PREMISE.md), o [cérebro do produto](docs/OBSIDIAN.md), o [guia de segurança](docs/SEGURANCA.md) e o [roadmap do futuro painel Pepius](docs/PLANO_CONTROL_PLANE_FUTURO.md).

## Desenvolvimento

Requer Node.js 22 e um projeto Supabase de desenvolvimento. Configure `.env.local` usando `.env.example`, aplique as migrations ao projeto de desenvolvimento com Supabase CLI e defina `PEPIUS_TENANT_ID` para o tenant de desenvolvimento.

```bash
npm ci
npm run dev
```

Para criar a imobiliária local e o primeiro usuário responsável, use `npm run agency:provision` com as variáveis `AGENCY_NAME`, `AGENCY_SLUG`, `AGENCY_EMAIL`, `AGENCY_OWNER_NAME`, `AGENCY_OWNER_EMAIL` e `AGENCY_OWNER_PASSWORD`. O comando precisa da chave `SUPABASE_SERVICE_ROLE_KEY`, roda somente no servidor/terminal e nunca deve ser chamado pelo navegador.

Os testes de domínio de licença rodam com `npm test`. Verificações de lint, tipos e build estão em `npm run lint`, `npm run type-check` e `npm run build`.

## Instalação em VM

O procedimento completo está em [supabase/SETUP.md](supabase/SETUP.md). Em resumo: instale uma versão fixada do stack oficial Supabase self-hosted, proteja suas portas, aplique migrations, copie `.env.onprem.example` para `.env.onprem`, construa uma versão do aplicativo e suba o Compose da Pepius. O Compose expõe somente HTTP/HTTPS pelo Caddy; PostgreSQL, Studio e Kong não devem ter portas administrativas publicadas diretamente na Internet.

Cada instalação precisa de domínio/DNS apontando para a VM, certificado TLS, uma licença ativada e backups criptografados do PostgreSQL e do diretório de Storage. O cliente administra VM, backups e recuperação; a Pepius publica e documenta versões do aplicativo.

## Licenciamento

O operador Pepius emite códigos de ativação e registra pagamentos pela CLI privada/API autenticada. A instalação faz heartbeat diário e aceita operação offline por até sete dias. Após 15 dias corridos além de `paid_through`, o serviço central suspende a licença; a instalação aplica a suspensão ao próximo heartbeat ou quando o lease local expira. Em suspensão, a vitrine sai do ar, as alterações são bloqueadas e o painel oferece leitura e exportação. Os dados permanecem na VM.

As rotinas operacionais e os limites dessa proteção estão documentados em [[OBSIDIAN]] e [[PLANO_ON_PREMISE]]. Quem controla a VM com privilégios de root pode alterar o software; o licenciamento regula o funcionamento oficial, sem prometer inviolabilidade contra o administrador do servidor.
