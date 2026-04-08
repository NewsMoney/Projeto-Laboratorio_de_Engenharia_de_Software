# JoinMe

Aplicativo web de check-in em locais com mapa interativo, ranking de usuários e perfil. Construído com React 19, TypeScript, tRPC, Drizzle ORM e Tailwind CSS 4.

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Mapa Interativo** | Visualização de locais com Google Maps, geolocalização e marcadores clicáveis |
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
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, wouter |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| Banco de Dados | MySQL / TiDB |
| Mapa | Google Maps JavaScript API |
| Testes | Vitest |
| Build | Vite 7, esbuild |

## Estrutura do Projeto

```
client/
  src/
    pages/          ← Páginas (Home, Search, MapPage, Details, CheckIn, Ranking, Profile)
    components/     ← Componentes reutilizáveis (AppLayout, BottomNav, DesktopSidebar, Map)
    contexts/       ← Contextos React (ThemeContext)
    hooks/          ← Hooks customizados
    lib/trpc.ts     ← Cliente tRPC
    App.tsx          ← Rotas e layout principal
    index.css        ← Tema e estilos globais
drizzle/
  schema.ts          ← Schema do banco (users, places, checkins)
  *.sql              ← Migrações SQL
server/
  db.ts              ← Helpers de consulta ao banco
  routers.ts         ← Procedures tRPC (places, checkins, ranking, user, auth)
  routers.test.ts    ← Testes unitários dos routers
  storage.ts         ← Helpers de armazenamento S3
shared/
  const.ts           ← Constantes compartilhadas
```

## Pré-requisitos

Para rodar o projeto localmente, é necessário ter instalado:

- **Node.js** 22 ou superior
- **pnpm** 10 ou superior
- **MySQL** 8 ou **TiDB** (para o banco de dados)

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão MySQL (ex: `mysql://user:pass@host:3306/dbname`) |
| `JWT_SECRET` | Chave secreta para assinatura de tokens de sessão |
| `VITE_APP_ID` | ID da aplicação OAuth |
| `OAUTH_SERVER_URL` | URL base do servidor OAuth |
| `VITE_OAUTH_PORTAL_URL` | URL do portal de login OAuth (frontend) |
| `VITE_FRONTEND_FORGE_API_KEY` | Chave de API para Google Maps (frontend) |
| `VITE_FRONTEND_FORGE_API_URL` | URL base da API de mapas (frontend) |

## Instalação e Execução

```bash
# Instalar dependências
pnpm install

# Gerar e aplicar migrações do banco de dados
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Rodar em modo de desenvolvimento
pnpm dev

# Rodar testes
pnpm test

# Build de produção
pnpm build

# Iniciar em produção
pnpm start
```

O servidor de desenvolvimento estará disponível em `http://localhost:3000`.

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

O projeto inclui um workflow do GitHub Actions (`.github/workflows/ci.yml`) que executa automaticamente em cada push e pull request:

1. Instalação de dependências
2. Verificação de tipos TypeScript (`tsc --noEmit`)
3. Execução dos testes unitários (`vitest run`)
4. Build de produção (`vite build + esbuild`)

## Licença

MIT
