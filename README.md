# JoinMe

Aplicativo web de check-in em locais com mapa interativo, ranking de usuários e perfil. Construído com React 19, TypeScript, tRPC, Drizzle ORM e Tailwind CSS 4.

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Mapa Interativo** | Visualização de locais com Leaflet/OpenStreetMap, geolocalização e marcadores clicáveis |
| **Busca de Locais** | Pesquisa por nome com listagem em tempo real |
| **Detalhes do Local** | Informações completas, estatísticas e avaliações de cada local |
| **Check-in** | Registro de visita com avaliação (1-5 estrelas), comentário e nível de ocupação |
| **Ranking** | Classificação dos usuários mais ativos e locais mais visitados |
| **Perfil** | Estatísticas pessoais, nível de experiência e histórico de check-ins |
| **Autenticação** | Login via OAuth com sessão segura via cookie |
| **Responsivo** | Layout adaptativo com sidebar no desktop e navegação inferior no mobile |

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Leaflet, wouter |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| Banco de Dados | MySQL / TiDB |
| Mapa | Leaflet + OpenStreetMap (CartoDB Dark tiles) |
| Testes | Vitest |
| Build | Vite 7, esbuild |
| CI/CD | GitHub Actions |

## Estrutura do Projeto

O repositório está organizado em três diretórios principais:

```
.github/
  workflows/
    ci.yml              ← Pipeline CI/CD (frontend + backend em paralelo)

frontend/
  client/
    src/
      pages/            ← Páginas (Home, Search, MapPage, Details, CheckIn, Ranking, Profile)
      components/       ← Componentes reutilizáveis (AppLayout, BottomNav, LeafletMap, etc.)
      contexts/         ← Contextos React (ThemeContext)
      hooks/            ← Hooks customizados (useAuth, useMobile)
      lib/trpc.ts       ← Cliente tRPC
      App.tsx           ← Rotas e layout principal
      index.css         ← Tema dark e estilos globais
  shared/               ← Constantes e tipos compartilhados com o backend
  server/               ← Stubs de tipo para o tRPC client (type-only)
  package.json          ← Dependências e scripts do frontend
  vite.config.ts        ← Configuração Vite com proxy para backend
  tsconfig.json         ← Configuração TypeScript do frontend

backend/
  server/
    index.ts            ← Entry point do servidor Express
    routers.ts          ← Procedures tRPC (places, checkins, ranking, user, auth)
    db.ts               ← Helpers de consulta ao banco
    trpc.ts             ← Inicialização tRPC (router, procedures)
    storage.ts          ← Helpers de armazenamento S3
    *.test.ts           ← Testes unitários
  drizzle/
    schema.ts           ← Schema do banco (users, places, checkins)
    *.sql               ← Migrações SQL
  shared/               ← Constantes e tipos compartilhados
  package.json          ← Dependências e scripts do backend
  drizzle.config.ts     ← Configuração Drizzle Kit
  tsconfig.json         ← Configuração TypeScript do backend

README.md               ← Este arquivo
```

## Pré-requisitos

Para rodar o projeto localmente, é necessário ter instalado:

- **Node.js** 22 ou superior
- **pnpm** 10 ou superior
- **MySQL** 8 ou **TiDB** (para o banco de dados)

## Variáveis de Ambiente

Crie um arquivo `.env` em cada diretório (`frontend/` e `backend/`) com as variáveis necessárias.

### Frontend (`frontend/.env`)

| Variável | Descrição |
|---|---|
| `VITE_APP_ID` | ID da aplicação OAuth |
| `VITE_OAUTH_PORTAL_URL` | URL do portal de login OAuth |
| `VITE_FRONTEND_FORGE_API_KEY` | Chave de API para serviços frontend |
| `VITE_FRONTEND_FORGE_API_URL` | URL base da API frontend |

### Backend (`backend/.env`)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão MySQL (ex: `mysql://user:pass@host:3306/dbname`) |
| `JWT_SECRET` | Chave secreta para assinatura de tokens de sessão |
| `OAUTH_SERVER_URL` | URL base do servidor OAuth |
| `PORT` | Porta do servidor (padrão: 3000) |

## Instalação e Execução

### Frontend

```bash
cd frontend
pnpm install
pnpm dev          # Inicia em http://localhost:5173 com proxy para backend
pnpm build        # Build de produção
pnpm check        # Verificação de tipos TypeScript
```

### Backend

```bash
cd backend
pnpm install
pnpm dev          # Inicia em http://localhost:3000
pnpm build        # Build de produção
pnpm start        # Inicia build de produção
pnpm test         # Executa testes unitários
pnpm db:generate  # Gera migrações do Drizzle
pnpm db:migrate   # Aplica migrações ao banco
```

### Desenvolvimento Local

Para desenvolvimento local, inicie o backend e o frontend em terminais separados. O frontend está configurado com proxy automático para o backend (`/api` redireciona para `http://localhost:3000`).

```bash
# Terminal 1 - Backend
cd backend && pnpm dev

# Terminal 2 - Frontend
cd frontend && pnpm dev
```

## Schema do Banco de Dados

O banco possui três tabelas principais:

**users** — Usuários autenticados via OAuth, com campos de nome, email, role (user/admin) e avatar.

**places** — Locais cadastrados com nome, endereço, coordenadas geográficas (lat/lng), categoria, descrição e imagem.

**checkins** — Registros de visitas vinculados a um usuário e um local, com avaliação (1-5), comentário opcional e nível de ocupação (vazio/moderado/cheio).

## Endpoints tRPC

| Router | Procedure | Tipo | Auth |
|---|---|---|---|
| `places` | `list` | Query | Público |
| `places` | `getById` | Query | Público |
| `places` | `search` | Query | Público |
| `places` | `nearby` | Query | Público |
| `places` | `topPlaces` | Query | Público |
| `places` | `create` | Mutation | Protegido |
| `checkins` | `create` | Mutation | Protegido |
| `checkins` | `byPlace` | Query | Público |
| `checkins` | `byUser` | Query | Protegido |
| `checkins` | `userStats` | Query | Protegido |
| `ranking` | `topUsers` | Query | Público |
| `ranking` | `topPlaces` | Query | Público |
| `user` | `profile` | Query | Protegido |
| `auth` | `me` | Query | Público |
| `auth` | `logout` | Mutation | Público |

## CI/CD

O projeto inclui um workflow do GitHub Actions (`.github/workflows/ci.yml`) que executa dois jobs em paralelo em cada push e pull request:

**Frontend:** Instalação de dependências, verificação de tipos TypeScript e build de produção. O artefato de build é disponibilizado para deploy.

**Backend:** Instalação de dependências, verificação de tipos TypeScript, execução dos testes unitários e build de produção.

## Notas de Migração

O diretório `backend/server/` contém arquivos stub (`trpc.ts`, `cookies.ts`, `systemRouter.ts`, `index.ts`) que substituem o framework original de autenticação. Esses stubs fornecem uma implementação funcional básica e devem ser adaptados para seu ambiente de produção:

- **`trpc.ts`** — Inicialização do tRPC com procedures pública e protegida. Adapte o middleware de autenticação conforme sua estratégia (JWT, session, etc.).
- **`cookies.ts`** — Configuração de cookies de sessão. Ajuste os parâmetros de segurança conforme seu domínio.
- **`systemRouter.ts`** — Router de sistema com health check. Adicione procedures administrativas conforme necessário.
- **`index.ts`** — Entry point do servidor. Implemente suas rotas de OAuth e sirva o build do frontend em produção.

O hook `frontend/client/src/hooks/useAuth.ts` também é um stub que consome `trpc.auth.me`. Adapte-o para sua estratégia de autenticação.

## Licença

MIT
