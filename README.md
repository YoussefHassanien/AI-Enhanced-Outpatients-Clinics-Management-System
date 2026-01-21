# AI‑Enhanced Outpatients Clinics Management System

NestJS monorepo for an outpatient clinics management platform. It uses a public API Gateway, internal microservices (Auth, Doctor), RabbitMQ for messaging, PostgreSQL with TypeORM, JWT authentication via signed cookies, and shared utilities in a common library. Docker Compose is provided for local development; CI/CD deploys to AWS EC2 using Docker Compose.

- Tech: Node.js 24 (LTS), NestJS 11, TypeORM 0.3, RabbitMQ, PostgreSQL, JWT, Class‑Validator, Throttler, Swagger (dev‑only), Winston logging.
- Repo structure:
  - `apps/api-gateway` – Public HTTP API, JWT verification, rate limiting, exception handling, Swagger (dev‑only)
  - `apps/auth` – Users/Admins/Doctors/Patients, credentials issuing (JWT), migrations
  - `apps/doctor` – Visits/Medications/Labs/Scans microservice (RMQ), migrations
  - `apps/admin` – Minimal app (not included in Docker Compose yet)
  - `libs/common` – Shared configs, base entity, decorators, filters, middleware, logging

## Contents

- Quick start
- Project layout
- Configuration (.env)
- Running locally (Node / Docker)
- Database and migrations
- Authentication flow
- Error handling
- Testing
- Deployment (GitHub Actions)
- License

---

## Quick start

- Prereqs: Node 24+ (LTS), Docker, Docker Compose, PostgreSQL 17+.
- Install deps:
  - `npm ci`
- Configure environments:
  - `apps/api-gateway/.env`
  - `apps/auth/.env`
  - `apps/doctor/.env`
  - `libs/common/.env` (used by TypeORM CLI)
- Start with Docker Compose:
  - `npm run docker-compose:run`
  - API Gateway: http://localhost:4000/api/v1

## Project layout

- `apps/api-gateway`
  - Versioned routes at `/api/v<version>/...` (env‑driven)
  - CORS (origin from `AUDIENCE`), helmet, signed cookies, validation pipe
  - Passport JWT strategy reading token from signed cookie `accessToken`
  - Throttling via `@nestjs/throttler`
  - Global exception filter mapping HTTP + RMQ RPC errors
  - Example routes (prefix omitted here; see versioning above):
    - `GET /auth` (health)
    - `POST /auth/login`
    - `POST /auth/admin/create`
    - `POST /auth/doctor/create`
    - `POST /auth/patient/create`
- `apps/auth`
  - TypeORM entities: `User`, `Admin`, `Doctor`, `Patient`
  - Migrations under `apps/auth/src/migration`
  - JWT issuing with audience/issuer and expiration from env
  - RMQ microservice (queue from env) emitting structured RPC errors
- `apps/doctor`
  - TypeORM entities for visits/medications/labs/scans
  - RMQ microservice (queue from env), migrations under `apps/doctor/src/migration`
- `libs/common`
  - `configurations/orm.ts` – TypeORM DataSource + `TypeOrmModuleAsyncOptions`
  - `filters/catch-everything.filter.ts` – Global HTTP/RPC error mapping
  - `middlewares/logging.middleware.ts` and `interceptors/logging.interceptor.ts`
  - `constants`, `database/base.entity.ts`

## Configuration (.env)

Keep values aligned where required (JWT `ISSUER`/`AUDIENCE` and secrets) across API Gateway and Auth.

API Gateway (`apps/api-gateway/.env`):

```
ENVIRONMENT='dev'|'prod'
PORT=4000
VERSION=1
GLOBAL_PREFIX=api

ACCESS_TOKEN_SECRET=***
ISSUER=https://your-issuer
AUDIENCE=https://your-client-origin

COOKIES_SECRET=***
COOKIES_EXPIRATION_TIME=120000  # ms

# RabbitMQ
RABBIT_MQ_URL=amqp://user:pass@host:5672
RABBIT_MQ_TIMEOUT=30000
RABBIT_MQ_AUTH_QUEUE=auth-queue
RABBIT_MQ_DOCTOR_QUEUE=doctor-queue

# CORS (required in production only)
METHODS=GET,POST,PUT,PATCH,DELETE
CREDENTIALS=true
```

Auth (`apps/auth/.env`):

```
ENVIRONMENT='dev'|'prod'

# PostgreSQL URL for TypeORM
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Password hashing and JWT
ROUNDS=12
ACCESS_TOKEN_SECRET=***
ACCESS_TOKEN_EXPIRATION_TIME=120000  # ms
HASHING_ALGORITHM=HS256
ISSUER=https://your-issuer
AUDIENCE=https://your-client-origin

# RabbitMQ
RABBIT_MQ_URL=amqp://user:pass@host:5672
RABBIT_MQ_TIMEOUT=30000
RABBIT_MQ_AUTH_QUEUE=auth-queue
```

Doctor (`apps/doctor/.env`):

```
ENVIRONMENT=development|production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
RABBIT_MQ_URL=amqp://user:pass@host:5672
RABBIT_MQ_TIMEOUT=30000
RABBIT_MQ_DOCTOR_QUEUE=doctor-queue
RABBIT_MQ_AUTH_QUEUE=auth-queue
```

TypeORM CLI (`libs/common/.env`):

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Notes:

- `GLOBAL_PREFIX` must be `api` (validated).
- `AUDIENCE` and `ISSUER` must match exactly between Auth (signing) and Gateway (verification).
- Rotate `ACCESS_TOKEN_SECRET` in both apps together.

## Running locally

Node (per app):

- Build: `npm run build api-gateway` | `npm run build auth` | `npm run build doctor`
- Dev: `npm run start:dev` (defaults to gateway) or `npm run start -- api-gateway` / `npm run start -- auth` / `npm run start -- doctor`

Docker Compose:

```
npm run docker-compose:run
# Gateway at http://localhost:4000/api/v1
```

Compose highlights (see [docker-compose.yml](docker-compose.yml)):

- RabbitMQ service `message-queue` (port 5672 exposed)
- API Gateway on `4000:4000`
- Auth and Doctor microservices running as RMQ consumers
- Logs mounted to [logs/](logs)

## Database and migrations

- DataSource: [libs/common/src/configurations/orm.ts](libs/common/src/configurations/orm.ts)
- Scripts:
  - Generate: `npm run migration:generate -- -n <MigrationName>`
  - Run: `npm run migration:run`
  - Revert: `npm run migration:revert`

Ensure DB variables in `.env` are set. Run migrations before starting microservices that depend on the schema (Auth, Doctor).

## Authentication flow

- API Gateway reads JWT from signed cookie `accessToken`.
- JWT verification:
  - `secretOrKey = ACCESS_TOKEN_SECRET`
  - `audience = AUDIENCE`
  - `issuer = ISSUER`
- Auth service issues tokens with matching `aud`/`iss` options.
- Cookie is set with `COOKIES_SECRET` and `COOKIES_EXPIRATION_TIME`.
- Swagger docs (dev): `/api/v<version>/docs`.

Tip: If audience/issuer checks fail even when “identical”, trim values and reissue a fresh token.

## Error handling

- Global filter: [libs/common/src/filters/catch-everything.filter.ts](libs/common/src/filters/catch-everything.filter.ts)
  - Detects HTTP exceptions and plain RMQ RPC error objects
  - Returns normalized HTTP responses
- Registered globally in the API Gateway via `APP_FILTER`.

Known pitfall: RMQ errors often arrive as plain objects (not `RpcException`). The filter uses a shape‑based guard.

## Testing

- Unit tests present (e.g., under [apps/auth/src](apps/auth/src)).
- Run tests: `npm test`
- Lint: `npm run lint`
- Format: `npm run format`

## Deployment (GitHub Actions)

Workflow [\.github/workflows/aws.yml](.github/workflows/aws.yml) builds images and deploys to AWS EC2 via SSH:

- Builds and pushes Docker images for Auth, Gateway, Doctor to Docker Hub
- SSHs into EC2 and runs `docker compose down && docker compose pull && docker compose up -d`
- Requires secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`

## License

MIT © 2025 Youssef Hassanien
