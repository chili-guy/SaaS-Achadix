# ShopBot

Sistema que publica links de afiliado da Shopee automaticamente em canais do WhatsApp via Evolution API.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | Node.js + TypeScript + Fastify |
| Fila | BullMQ + Redis |
| Banco | PostgreSQL + Drizzle ORM |
| WhatsApp | Evolution API |
| Dashboard | Next.js 14 + Tailwind CSS |
| Infra | Docker Compose |

## Estrutura

```
shopbot/
├── apps/
│   ├── api/          ← Fastify + BullMQ + Drizzle
│   └── web/          ← Next.js dashboard admin
├── packages/
│   └── shared/       ← Tipos TypeScript compartilhados
├── docker-compose.yml
└── .env.example
```

## Setup local (desenvolvimento)

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Uma instância da Evolution API rodando

### 1. Clone e instale dependências

```bash
git clone <repo>
cd shopbot
pnpm install
```

### 2. Configure o ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas configurações:

```env
DATABASE_URL=postgresql://shopbot:shopbot123@localhost:5432/shopbot
REDIS_URL=redis://localhost:6379
EVOLUTION_BASE_URL=https://sua-evolution.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=nome_da_instancia
ADMIN_PASSWORD=senha_segura_aqui
NEXTAUTH_SECRET=string_aleatoria_longa
API_PORT=3001
```

### 3. Suba o banco e Redis com Docker

```bash
docker compose up postgres redis -d
```

### 4. Rode as migrations

```bash
pnpm db:generate   # gera arquivos de migration a partir do schema
pnpm db:migrate    # aplica as migrations no banco
```

### 5. Inicie os servidores

```bash
# Em terminais separados:
pnpm dev:api   # API na porta 3001
pnpm dev:web   # Dashboard na porta 3000
```

Acesse `http://localhost:3000` e faça login com a senha definida em `ADMIN_PASSWORD`.

---

## Deploy no EasyPanel / Hostinger VPS

### Pré-requisitos no servidor

- Docker + Docker Compose instalados
- Evolution API já rodando (pode ser em outro container/serviço)

### 1. Envie os arquivos para o servidor

```bash
rsync -avz --exclude node_modules --exclude .next --exclude dist \
  ./ usuario@seu-servidor:/app/shopbot/
```

Ou use Git:

```bash
ssh usuario@seu-servidor
git clone <repo> /app/shopbot
```

### 2. Configure o .env no servidor

```bash
cd /app/shopbot
cp .env.example .env
nano .env   # preencha todas as variáveis
```

Variáveis importantes para produção:

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com   # URL pública da API
ADMIN_PASSWORD=senha_muito_segura
NEXTAUTH_SECRET=string_de_32_chars_aleatoria
POSTGRES_PASSWORD=senha_do_postgres_segura
```

### 3. Faça o build e suba os containers

```bash
docker compose up -d --build
```

### 4. Verifique os logs

```bash
docker compose logs -f api
docker compose logs -f web
```

### EasyPanel — configuração de reverse proxy

No EasyPanel, crie dois serviços (ou use o docker-compose diretamente):

- **API**: porta `3001` → domínio `api.seusite.com`
- **Web**: porta `3000` → domínio `shopbot.seusite.com`

Certifique-se de que `NEXT_PUBLIC_API_URL` aponta para o domínio público da API.

---

## Uso do sistema

### Fluxo básico

1. Acesse o dashboard e faça login
2. Em **Configurações**, informe as credenciais da Evolution API
3. Em **Produtos**, cadastre seus produtos afiliados da Shopee
4. Em **Canais**, cadastre os canais do WhatsApp e configure os horários de postagem (cron)
5. Ative os canais e produtos — o sistema começará a postar automaticamente

### Expressões Cron

| Expressão | Significado |
|-----------|-------------|
| `0 9,18 * * *` | Todo dia às 9h e 18h |
| `0 * * * *` | De hora em hora |
| `0 */2 * * *` | A cada 2 horas |
| `0 8 * * *` | Todo dia às 8h |
| `30 12 * * 1-5` | Dias úteis ao meio-dia e trinta |

### ID do Canal WhatsApp

O `channelId` é o número identificador do canal/newsletter no WhatsApp.
Para obter: acesse a Evolution API → lista de chats → localize o canal pelo nome.
O formato é algo como `120363xxxxxxxxxx` (sem `@newsletter`).

---

## API Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login com senha |

### Produtos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/products` | Listar produtos |
| POST | `/products` | Criar produto |
| PUT | `/products/:id` | Atualizar produto |
| PATCH | `/products/:id/toggle` | Ativar/desativar |
| DELETE | `/products/:id` | Excluir produto |

### Canais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/channels` | Listar canais |
| POST | `/channels` | Criar canal |
| PUT | `/channels/:id` | Atualizar canal |
| PATCH | `/channels/:id/toggle` | Ativar/desativar |
| DELETE | `/channels/:id` | Excluir canal |

### Posts / Histórico

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/posts?channelId=&status=&page=` | Listar histórico |
| GET | `/posts/:id` | Detalhes de um post |

### Configurações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/settings` | Obter todas as configs |
| PUT | `/settings` | Salvar configs |

---

## Comandos úteis

```bash
# Acessar banco via Drizzle Studio (UI web)
pnpm db:studio

# Ver logs dos workers
docker compose logs -f api

# Reiniciar apenas a API
docker compose restart api

# Rebuild após mudanças no código
docker compose up -d --build api web
```

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL | Sim |
| `REDIS_URL` | URL do Redis | Sim |
| `EVOLUTION_BASE_URL` | URL base da Evolution API | Sim* |
| `EVOLUTION_API_KEY` | Chave da Evolution API | Sim* |
| `EVOLUTION_INSTANCE` | Nome da instância | Sim* |
| `ADMIN_PASSWORD` | Senha do dashboard | Sim |
| `NEXTAUTH_SECRET` | Secret para JWT | Sim |
| `API_PORT` | Porta da API (padrão: 3001) | Não |
| `NEXT_PUBLIC_API_URL` | URL pública da API (build do web) | Sim em prod |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL (Docker) | Docker |

*Podem ser configuradas pelo dashboard em vez de .env
