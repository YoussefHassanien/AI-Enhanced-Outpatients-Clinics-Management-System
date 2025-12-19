# AI‑Enhanced Outpatients Clinics Management System

NestJS monorepo for an outpatient clinics management platform. It uses a public API Gateway, internal microservices (Auth, Doctor, Admin), RabbitMQ for messaging, PostgreSQL with TypeORM, JWT authentication (signed cookies), and shared utilities in a common library. Docker Compose is provided for local development; Azure Container Apps is the recommended target for deployment.

- Tech: Node.js 24 (LTS), NestJS 11, TypeORM 0.3, RabbitMQ, PostgreSQL, JWT, Class‑Validator, Throttler.
- Repo structure:
  - `apps/api-gateway` – Public HTTP API, JWT verification, rate limiting, exception handling
  - `apps/auth` – Users, Admins, Doctors, Patients, credentials issuing (JWT), migrations
  - `apps/doctor` and `apps/admin` – Service placeholders
  - `libs/common` – Shared configs, entities base, decorators, filters, middleware

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
- Copy env templates and update values:
  - `apps/api-gateway/.env`
  - `apps/auth/.env`
  - `libs/common/.env` (if you centralize DB config here)
- Start with Docker Compose:
  - `docker compose up --build`
  - API Gateway: http://localhost:PORT/GLOBAL_PREFIX/VERSION

## Project layout

- `apps/api-gateway`
  - Global config, versioning (`/GLOBAL_PREFIX/VERSION/`), CORS, helmet, cookie signing, validation pipe
  - Passport JWT strategy (reads token from signed cookie)
  - Throttling
  - Global exception filter (maps HTTP + RPC errors to HTTP responses)
  - Routes (examples):
    - `GET /GLOBAL_PREFIX/VERSION/auth` (health)
    - `POST /GLOBAL_PREFIX/VERSION/auth/login`
    - `POST /GLOBAL_PREFIX/VERSION/auth/admin/create`
    - `POST /GLOBAL_PREFIX/VERSION/auth/doctor/create`
    - `POST /GLOBAL_PREFIX/VERSION/auth/patient/create`
- `apps/auth`
  - TypeORM entities: `User`, `Admin`, `Doctor`, `Patient`
  - Migrations in `apps/auth/src/migration`
  - Business logic for create/login/credential issuance
  - Emits structured RPC errors consumed by the gateway
- `libs/common`
  - `configurations/orm.ts` – TypeORM data source config
  - `filters/catch-everything.filter.ts` – Global HTTP/RPC error mapping
  - `middlewares/logger.middleware.ts`
  - `constants` – error response class, enums, types
  - `database/base.entity.ts`

## Configuration (.env)

Keep values identical where required (especially JWT issuer/audience and secrets) across API Gateway and Auth.

Example `apps/api-gateway/.env`:
```
PORT=***
GLOBAL_PREFIX=***
VERSION=***
ENVIRONMENT=***
COOKIES_SECRET=***
ACCESS_TOKEN_SECRET=***
AUDIENCE=***
ISSUER=***

# CORS (optional fine-grained config)
METHODS=***
ALLOWED_HEADERS=***
CREDENTIALS=***

# RabbitMQ
RABBITMQ_URL=***
RABBIT_MQ_AUTH_CHANNEL=***
```

Example `apps/auth/.env`:
```
# JWT
ACCESS_TOKEN_SECRET=***
ACCESS_TOKEN_EXPIRATION_TIME=***
AUDIENCE=***
ISSUER=***

# DB
DATABASE_URL=***

# RabbitMQ
RABBITMQ_URL=***
RABBIT_MQ_AUTH_CHANNEL=***
```

Notes:
- Make `AUDIENCE` and `ISSUER` match exactly between Auth (signing) and Gateway (verification). Avoid trailing slashes and IPv6 vs IPv4 mismatches.
- Rotate `ACCESS_TOKEN_SECRET` in both apps together.

## Running locally

Install and run with Node:
- `npm ci`
- Dev API Gateway: `npm run start:dev --workspace apps/api-gateway` (or root `npm run start:dev` and select project)
- Dev Auth: `npm run start:dev --workspace apps/auth`

Run with Docker Compose:
```
docker compose up --build
# API at http://localhost:PORT/GLOBAL_PREFIX/VERSION
```

Compose file exposes:
- RabbitMQ (PORT)
- API Gateway (PORT)

You can customize container and image names (example):
```yaml
services:
  rabbitmq:
    image: rabbitmq:4.1.6-alpine
    container_name: message-queue
    ports: 5672
    networks: services-network

  auth:
    build:
      context: .
      dockerfile: ./apps/auth/Dockerfile
    image: "your docker hub image"
    container_name: auth-service
    env_file: [./apps/auth/.env]
    depends_on: [rabbitmq]
    command: node auth/main
    networks: services-network

  api-gateway:
    build:
      context: .
      dockerfile: ./apps/api-gateway/Dockerfile
    image: "your docker hub image"
    container_name: api-gateway
    env_file: [./apps/api-gateway/.env]
    ports: ["4000:4000"]
    depends_on: [rabbitmq, auth]
    command: node api-gateway/main
    networks: services-network

network:
  services-network:
    driver: bridge        
```

## Database and migrations

- DataSource: `libs/common/src/configurations/orm.ts`
- Scripts:
  - Generate: `npm run migration:generate -- -n <MigrationName>`
  - Run: `npm run migration:run`
  - Revert: `npm run migration:revert`

Ensure DB variables in `.env` are set. Run migrations before starting services that depend on the schema (Auth).

## Authentication flow

- API Gateway reads JWT from a signed cookie (`accessToken`) using `cookie-parser`.
- JWT verification uses:
  - `secretOrKey = ACCESS_TOKEN_SECRET`
  - `audience = AUDIENCE`
  - `issuer = ISSUER`
- Auth service issues tokens with the same `aud`/`iss` options (not just in payload).
- After login, the gateway (or client) should set the signed cookie. Ensure `COOKIES_SECRET` matches the signer.

Tip: If audience/issuer checks fail even when “identical”, trim both env values and regenerate a fresh token.

## Error handling

- Global filter: `libs/common/src/filters/catch-everything.filter.ts`
  - Detects:
    - HTTP exceptions (`HttpException`)
    - Plain RPC error objects from microservices (shape `{ message: string; status: number }`)
  - Returns normalized HTTP responses.
- Register globally (already wired in `ApiGatewayModule` via `APP_FILTER`).

Known pitfall: Microservice errors arriving over RabbitMQ are plain objects, not `instanceof RpcException`. The filter uses a type‑guard to detect them by shape.

## Testing

- Root Jest config supports `apps/**` and `libs/**`.
- Run all tests: `npm test`
- E2E templates exist under `apps/**/test`.

### GitHub Actions (CI/CD)

Workflows under `.github/workflows/` can build and deploy to Azure. For monorepo Dockerfiles that copy from repo root, ensure:
- `appSourcePath: ${{ github.workspace }}`
- `dockerfilePath: apps/auth/Dockerfile` (or the gateway’s Dockerfile)
- Provide registry credentials and Container App identifiers.

Example snippet (Auth):
```yaml
- name: Build and push image
  uses: azure/container-apps-deploy-action@v2
  with:
    appSourcePath: ${{ github.workspace }}
    dockerfilePath: apps/auth/Dockerfile
    registryUrl: docker.io
    registryUsername: ${{ secrets.AUTHSERVICE_REGISTRY_USERNAME }}
    registryPassword: ${{ secrets.AUTHSERVICE_REGISTRY_PASSWORD }}
    resourceGroup: <your-resource-group-name>
    containerAppName: auth-service
    imageToBuild: <dockerhub-namespace>/auth-service:${{ github.sha }}
```

## License

MIT © 2025 Youssef Hassanien