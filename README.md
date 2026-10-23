# DevFlow

AI-powered project management and team collaboration platform built with the MERN stack.

## Tech stack

| Layer    | Technologies                                                                   |
| -------- | ------------------------------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Radix), React Router 7 |
| State    | TanStack Query (server state), Zustand (client/UI state)                       |
| Backend  | Node.js, Express 5, TypeScript, Zod, Pino, Helmet, CORS, express-rate-limit    |
| Database | MongoDB with Mongoose                                                          |
| Tooling  | npm workspaces, ESLint (typescript-eslint strict), Prettier, Vitest, Supertest |

## Project structure

```
devflow/
├── client/                  # React SPA (Vite)
│   └── src/
│       ├── app/             # App root, providers, router
│       ├── components/
│       │   ├── ui/          # shadcn/ui design-system primitives
│       │   ├── layout/      # App shell: sidebar, header, page header
│       │   └── feedback/    # Error boundaries, loaders, empty states
│       ├── config/          # Validated env, navigation, site and theme config
│       ├── features/        # Feature modules (api hooks, components, logic)
│       ├── hooks/           # Shared React hooks
│       ├── lib/             # API client, query client, utilities
│       ├── pages/           # Route-level pages (lazy loaded)
│       ├── stores/          # Zustand stores
│       ├── styles/          # Tailwind entry and design tokens
│       └── test/            # Test setup and helpers
└── server/                  # Express REST API
    ├── src/
    │   ├── config/          # Validated env, MongoDB connection
    │   ├── lib/             # Logger
    │   ├── middleware/      # Security, logging, validation, errors
    │   ├── modules/         # Feature modules (routes, controllers, services)
    │   ├── routes/          # API router composition
    │   ├── types/           # Shared API types
    │   ├── utils/           # AppError, response helpers
    │   ├── app.ts           # Express app factory
    │   └── server.ts        # Bootstrap and graceful shutdown
    └── tests/               # API tests (Vitest + Supertest)
```

## Getting started

### Prerequisites

- Node.js 22.12+ (see `.nvmrc`)
- MongoDB 7+ running locally, or a MongoDB Atlas connection string

### Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and set `MONGODB_URI`.

### Run in development

```bash
npm run dev          # API on http://localhost:5000, web app on http://localhost:5173
npm run dev:server   # API only
npm run dev:client   # web app only
```

The Vite dev server proxies `/api` to the API, so no CORS setup is needed locally. The API only
starts accepting requests after it connects to MongoDB. If the initial connection fails it retries
a few times, then exits with an error, so make sure MongoDB is running first.

### Production build

```bash
npm run build        # compiles server to server/dist and client to client/dist
npm start            # runs the compiled API
```

## Scripts

| Command             | Description                            |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Run API and web app with hot reload    |
| `npm run build`     | Build both applications                |
| `npm run typecheck` | Type-check both workspaces             |
| `npm run lint`      | Lint both workspaces                   |
| `npm run test`      | Run all tests                          |
| `npm run format`    | Format the repository with Prettier    |
| `npm run check`     | Format check, lint, typecheck and test |

## API

All endpoints are prefixed with `/api/v1`. Responses use a consistent envelope:

```jsonc
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "requestId": "..." } }
```

| Method | Path            | Description                                             |
| ------ | --------------- | ------------------------------------------------------- |
| GET    | `/health`       | Health report: status, uptime, version, database state  |
| GET    | `/health/live`  | Liveness probe (process is running)                     |
| GET    | `/health/ready` | Readiness probe, `503` when the database is unavailable |

## Environment variables

### Server (`server/.env`)

| Variable               | Default                 | Description                                  |
| ---------------------- | ----------------------- | -------------------------------------------- |
| `NODE_ENV`             | `development`           | `development`, `production` or `test`        |
| `PORT`                 | `5000`                  | HTTP port                                    |
| `CLIENT_ORIGIN`        | `http://localhost:5173` | Comma-separated list of allowed CORS origins |
| `MONGODB_URI`          | (required)              | MongoDB connection string                    |
| `LOG_LEVEL`            | `info`                  | Pino log level                               |
| `RATE_LIMIT_WINDOW_MS` | `900000`                | Rate-limit window for `/api`                 |
| `RATE_LIMIT_MAX`       | `300`                   | Requests per IP per window                   |

### Client (`client/.env`)

| Variable            | Default                 | Description                            |
| ------------------- | ----------------------- | -------------------------------------- |
| `VITE_API_BASE_URL` | `/api/v1`               | API base URL used by the browser       |
| `API_PROXY_TARGET`  | `http://localhost:5000` | Dev/preview proxy target (not exposed) |

## License

MIT
