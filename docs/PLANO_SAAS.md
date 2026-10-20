# Plano de Evolução SaaS - Pepius Imob

## 1. Visão Geral
Transformar o Pepius Imob em uma plataforma SaaS completa (ERP + Websites), mantendo rigorosamente o design system "Linha de Planta" (paleta slate/terracota, tipografia DM Serif/Sans, densidade média-alta e bordas precisas), já validado e implementado nas interfaces atuais.

## 2. Perfis de Usuário e Interfaces

### 2.1 Super Admin (Dono do SaaS)
- **Dashboard Global**: Métricas de MRR, total de imobiliárias ativas, licenças e saúde do sistema.
- **Gestão de Tenants**: Criar, ativar/desativar e gerenciar imobiliárias.
- **Configuração de Domínio**: Apontar o site personalizado de venda/locação de cada imobiliária (suporte a subdomínio `imobiliaria.pepius.com` e/ou domínio próprio `www.minhaimob.com.br`).

### 2.2 Imobiliária (Tenant Admin e Corretores)
- **ERP de Imóveis**: CRUD completo, upload de múltiplas imagens (Supabase Storage), gestão de status (disponível, reservado, vendido, alugado).
- **CRM e Leads**: Visualização em lista/kanban, histórico de interações, mudança de status (novo → em contato → convertido/perdido).
- **Inbox Omnichannel**: Centralização de conversas de WhatsApp, Instagram, Messenger e Webchat em uma única interface (via Webhooks/API).
- **Agenda e Visitas**: Calendário de visitas agendadas, com notificações e (futuramente) sincronização com Google Calendar/Outlook.
- **Configurações do Site Público**: Painel para o tenant personalizar a seção "Destaques", textos de boas-vindas, logo, cores de accent (dentro da paleta permitida) e informações de contato exibidas no site.

### 2.3 Cliente Final (Visitante do Site da Imobiliária)
- **Portal Público (Mobile-First e SEO Otimizado)**:
  - **Home**: Hero com busca avançada, seção de "Destaques" configurada pela imobiliária e benefícios.
  - **Busca e Filtros**: Filtros combinados (cidade, bairro, tipo, faixa de preço, quartos, banheiros).
  - **Página de Detalhes do Imóvel**: Galeria de fotos responsiva, descrição rica, características, mapa (geolocalização) e CTAs claros para contato (WhatsApp direto ou formulário).
  - **Responsividade**: Layout adaptável que prioriza a experiência em smartphones, conforme as melhores práticas do mercado imobiliário.

## 3. Arquitetura e Integrações
- **Multi-tenancy**: Reforço das políticas RLS (Row Level Security) no Supabase para isolamento total e seguro dos dados entre imobiliárias.
- **Storage**: Buckets no Supabase para imagens dos imóveis e logos, com otimização automática via `next/image`.
- **Integrações Externas**:
  - **Domínios Customizados**: Suporte a subdomínios (`imob.pepius.com`) E domínios próprios (`www.minhaimob.com.br`), configuráveis pelo painel da imobiliária no ERP. Middleware de roteamento para identificar o tenant pelo Host header.
  - **Canais de Comunicação (WhatsApp/Instagram)**: API Oficial do WhatsApp Business (Meta). **Fase atual: apenas estrutura de preparação** — tabelas, schemas e endpoints prontos, mas integração desativada globalmente. A ativação é feita individualmente por imobiliária (opt-in no painel de configurações).
  - **Agenda**: Sincronização bidirecional com Google Calendar via OAuth2, configurável por corretor/imobiliária no painel de integrações.
- **Escopo do ERP**: Foco 100% na gestão comercial (imóveis + CRM + site público). Sem módulo financeiro (boletos/repasses) nesta fase.

## 4. Roadmap de Implementação (Próximas Tasks)
1. **Refinar Multi-tenancy e Roteamento**: Adicionar campos `subdomain` e `custom_domain` na tabela `tenants` e criar middleware para rotear o tráfego do site público corretamente.
2. **Módulo de Configurações da Imobiliária**: Tela no portal da imobiliária para configurar destaques, logo e textos do site público.
3. **Galeria de Imagens e Storage**: Implementar upload de múltiplas imagens no CRUD de imóveis e exibição otimizada.
4. **Portal Público - Detalhes do Imóvel**: Criar página dinâmica `/imovel/[slug]` com layout responsivo, galeria e formulário de contato.
5. **Integração de Agenda**: Protótipo de agendamento de visitas no fluxo do cliente e visualização no inbox/ERP.

## 5. Decisões de Escopo (Validadas)

1. **Domínios**: Suporte a subdomínios (`imob.pepius.com`) E domínios próprios (`www.minhaimob.com.br`), configuráveis pelo painel da imobiliária no ERP.
2. **WhatsApp/Omnichannel**: API Oficial do WhatsApp Business (Meta). **Fase atual: apenas estrutura de preparação** — tabelas, schemas e endpoints prontos, mas integração desativada globalmente. A ativação é feita individualmente por imobiliária (opt-in no painel de configurações).
3. **Escopo do ERP**: Foco 100% na gestão comercial (imóveis + CRM + site público). Sem módulo financeiro (boletos/repasses) nesta fase.
4. **Agenda**: Sincronização bidirecional com Google Calendar via OAuth2, configurável por corretor/imobiliária no painel de integrações.

---
*Este plano mantém o design system "Linha de Planta" como padrão inegociável para todas as novas interfaces.*