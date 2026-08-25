# AI‑Enhanced Outpatients Clinics Management System

> **CodeBlue** — a microservice platform that digitises outpatient clinic workflows for **El Kasr El Ainy (Cairo University) Outpatient Clinics**.
> Doctors and administrators manage patients, visits, medications, scans and labs, while AI services transcribe Arabic clinical audio (speech‑to‑text) and read data straight off Egyptian national‑ID cards (OCR).

A NestJS 11 / TypeScript monorepo with a public HTTP **API Gateway** in front of internal **RabbitMQ** microservices, two **Python GPU** AI services, a shared **PostgreSQL** database (TypeORM), media storage on **Cloudinary**, JWT auth via signed cookies, structured Winston logging, and a Docker‑based CI/CD pipeline that builds images to Docker Hub and deploys to AWS EC2 behind nginx + Let's Encrypt.


https://github.com/user-attachments/assets/d2053335-8ec0-41e2-9a2f-acd8d1cc45b2

---

## Table of contents

- [System at a glance](#system-at-a-glance)
- [Architecture](#architecture)
- [Service catalog](#service-catalog)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Domain & data model](#domain--data-model)
- [Roles & permissions](#roles--permissions)
- [Quick start](#quick-start)
- [Configuration (.env)](#configuration-env)
- [Running locally](#running-locally)
- [Database & migrations](#database--migrations)
- [Authentication & authorization](#authentication--authorization)
- [API reference (Gateway)](#api-reference-gateway)
- [Inter‑service messaging (RabbitMQ)](#inter-service-messaging-rabbitmq)
- [AI / ML services](#ai--ml-services)
- [Media & file handling](#media--file-handling)
- [End‑to‑end workflows](#end-to-end-workflows)
- [Error handling](#error-handling)
- [Logging & observability](#logging--observability)
- [Security & rate limiting](#security--rate-limiting)
- [Testing](#testing)
- [CI/CD & deployment](#cicd--deployment)
- [Infrastructure files](#infrastructure-files)
- [Conventions & gotchas](#conventions--gotchas)
- [License](#license)

---

## System at a glance

|                        |                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Public entry point** | API Gateway — REST over HTTP(S), versioned at `/api/v<VERSION>`                                  |
| **Internal transport** | RabbitMQ (AMQP) — request/reply (`send`) and fire‑and‑forget (`emit`)                            |
| **Persistence**        | PostgreSQL via TypeORM 0.3 (one shared DataSource, migration‑driven)                             |
| **Media storage**      | Cloudinary (photos + audio), organised per patient/domain                                        |
| **AI: speech‑to‑text** | ASR service — OpenAI Whisper (`faster-whisper`), GPU, Arabic clinical audio                      |
| **AI: ID reading**     | OCR service — YOLOv8 + PaddleOCR (Arabic), Egyptian national‑ID extraction, GPU                  |
| **AuthN**              | JWT signed by Auth, carried in a signed, HTTP‑only cookie `accessToken`, verified at the Gateway |
| **AuthZ**              | Role‑based (`SUPER_ADMIN`, `DOCTOR`, `PATIENT`) via a `@Roles()` decorator + JWT guard           |
| **Node runtime**       | Node.js 24 (Alpine), npm 11.7.0, TypeScript 5.9 (target ES2023)                                  |
| **Python runtime**     | Python 3.10/3.11 on `nvidia/cuda` base images (CUDA 12.2 / 12.9)                                 |
| **Local dev**          | `docker compose -f docker-compose.dev.yml`                                                       |
| **Production**         | Docker Hub images → EC2 (over Tailscale) → nginx + Let's Encrypt at `code-blue-apis.me`          |

---

## Architecture

The API Gateway is the only externally reachable service. It authenticates requests, then translates them into RabbitMQ messages addressed to the appropriate microservice. Microservices never expose HTTP — they are pure RMQ consumers. The Node services that own data share a single PostgreSQL database; the AI services are stateless GPU workers; Cloudinary holds binary media.

```
                              ┌────────────────────────────┐
        HTTPS (prod)          │           nginx            │  code-blue-apis.me
   browser / client ───────▶  │  TLS termination + proxy  │   (TLSv1.2/1.3, Let's Encrypt)
                              └─────────────┬──────────────┘
                                            │  :5000 (prod)  /  :4000 (dev)
                              ┌─────────────▼──────────────────────────────────┐
                              │                 API Gateway                    │
                              │  REST · URI versioning · Helmet · signed       │
                              │  cookies · CORS · ValidationPipe · Throttler   │
                              │  global exception filter · Swagger (dev only)  │
                              └─────────────┬──────────────────────────────────┘
                                            │
                                ╔═══════════▼═══════════╗
                                ║   RabbitMQ (AMQP)     ║  durable queues, persistent msgs
                                ╚══╦═════╦═════╦════╦════╦═══╗
                                   │     │     │    │    │   │
        ┌──────────┐   ┌──────────┐ ┌────┴───┐ │ ┌──┴──┐ │ ┌─┴───────────────┐
        │   Auth   │   │  Doctor  │ │ Super- │ │ │ ASR │ │ │  Cloud-Storage  │
        │  (RMQ)   │   │  (RMQ)   │ │ Admin  │ │ │ GPU │ │ │      (RMQ)      │
        │ users,   │   │ visits,  │ │ (RMQ)  │ │ │Whis-│ │ │   Cloudinary    │
        │ doctors, │   │ meds,    │ │ clinics│ │ │per  │ │ │  photos+audio   │
        │ patients,│   │ scans,   │ │ + admin│ │ └─────┘ │ └────────┬────────┘
        │ super-   │   │ labs     │ │ facade │ │   ┌─────┴──┐       │
        │ admins   │   │          │ │        │ │   │  OCR   │       │
        └────┬─────┘   └────┬─────┘ └───┬────┘ │   │  GPU   │       │
             │              │           │      │   │YOLO+   │       │
             │              │           │      │   │Paddle  │       │
             │              │           │      │   └────────┘       │
             └──────────────┴───────────┴──────┴────────────────────┘
                                   │                         │
                          ┌────────▼─────────┐      ┌────────▼─────────┐
                          │   PostgreSQL     │      │    Cloudinary    │
                          │ (shared schema,  │      │  (media assets)  │
                          │  TypeORM)        │      └──────────────────┘
                          └──────────────────┘
```

Key properties:

- **Single ingress** — only the Gateway listens on HTTP; everything else is RMQ‑only.
- **Two messaging styles** — `ClientProxy.send()` for request/reply (queries, updates) and `ClientProxy.emit()` for fire‑and‑forget events (record creation/uploads).
- **Service composition** — the Super‑Admin service is largely a façade that fans queries out to Auth and Doctor and reshapes the responses; Doctor calls ASR (transcription) and Cloud‑Storage (uploads) while writing a record.
- **Loose DB coupling across services** — within Auth's tables there are real foreign keys (e.g. `User ↔ Doctor`), but Doctor's tables reference patients/doctors/clinics by plain id with **no** cross‑service FK; those ids are resolved at query time over RMQ.

---

## Service catalog

| Service           | Path                 | Type            | Transport         | Queue (`*_QUEUE`) | DI token                     | Owns / does                                                                                        |
| ----------------- | -------------------- | --------------- | ----------------- | ----------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **API Gateway**   | `apps/api-gateway`   | NestJS (HTTP)   | HTTP in / RMQ out | —                 | —                            | Public REST API, JWT verification, CORS, throttling, Swagger, error mapping                        |
| **Auth**          | `apps/auth`          | NestJS µservice | RMQ               | `auth`            | `AUTH_MICROSERVICE`          | Users, Doctors, Patients, Super‑Admins; login & JWT issuing; password hashing; soft delete/restore |
| **Doctor**        | `apps/doctor`        | NestJS µservice | RMQ               | `doctor`          | `DOCTOR_MICROSERVICE`        | Visits, Medications, Scans, Labs; pagination; orchestrates ASR + Cloud‑Storage                     |
| **Super‑Admin**   | `apps/super-admin`   | NestJS µservice | RMQ               | `super-admin`     | `SUPER_ADMIN_MICROSERVICE`   | Clinics CRUD; admin dashboards; façade over Auth + Doctor                                          |
| **Cloud‑Storage** | `apps/cloud-storage` | NestJS µservice | RMQ               | `cloud-storage`   | `CLOUD_STORAGE_MICROSERVICE` | Cloudinary uploads (photo/audio) + temp‑file cleanup                                               |
| **ASR**           | `apps/asr`           | Python (GPU)    | RMQ               | `asr`             | `ASR_MICROSERVICE`           | Speech‑to‑text (Whisper) for clinical audio                                                        |
| **OCR**           | `apps/ocr`           | Python (GPU)    | RMQ               | `ocr`             | `OCR_MICROSERVICE`           | Egyptian national‑ID extraction (YOLO + PaddleOCR)                                                 |
| **RabbitMQ**      | (image)              | Broker          | AMQP              | —                 | —                            | Message broker (`rabbitmq:4.1.6-alpine`)                                                           |
| **Common lib**    | `libs/common`        | Library         | —                 | —                 | —                            | Shared config, base entity, enums, filters, pipes, decorators, logging                             |

> The previous `apps/admin` app has been **removed** and superseded by `apps/super-admin`.

---

## Tech stack

**Backend (Node):** NestJS 11 (`@nestjs/common`, `core`, `microservices`, `config`, `jwt`, `passport`, `swagger`, `throttler`, `typeorm`, `axios`), TypeScript 5.9, TypeORM 0.3, PostgreSQL (`pg`), RabbitMQ (`amqplib`, `amqp-connection-manager`), Passport JWT/Local, bcrypt, class‑validator / class‑transformer, helmet, cookie‑parser, Cloudinary SDK, `file-type`, `uuid`, Winston + daily‑rotate‑file.

**AI (Python):**

- **ASR** — `faster-whisper`, `ffmpeg-python`, `pika`, `numpy`, `python-dotenv`.
- **OCR** — `paddleocr` (+ `paddlepaddle-gpu`), `ultralytics` (YOLOv8), `torch`, `openvino` (CPU fallback), `opencv-python-headless`, `pika`, `pyyaml`, `numpy`.

**Tooling:** Jest + ts‑jest, ESLint 9 + Prettier, SWC, NestJS CLI (monorepo, webpack build), Docker / Docker Compose, GitHub Actions, nginx, Tailscale.

---

## Repository layout

```
.
├── apps/
│   ├── api-gateway/          # Public HTTP API (NestJS)
│   │   └── src/
│   │       ├── auth/         # auth controller/service/module + JWT guard & strategy
│   │       ├── doctor/       # doctor controller/service/module
│   │       ├── super-admin/  # super-admin controller/service/module
│   │       ├── asr/          # speech-to-text proxy controller
│   │       ├── ocr/          # ID-OCR proxy controller
│   │       ├── constants/    # EnvironmentVariables (validation) + tokens
│   │       └── main.ts       # bootstrap (prefix, versioning, helmet, CORS, swagger…)
│   ├── auth/                 # Auth microservice (RMQ) — entities, dtos, migrations
│   ├── doctor/               # Doctor microservice (RMQ) — entities, dtos, migrations
│   ├── super-admin/          # Super-Admin microservice (RMQ) — Clinic entity, migrations
│   ├── cloud-storage/        # Cloudinary microservice (RMQ)
│   ├── asr/                  # Python ASR worker (Whisper) — run_consumer.py, src/, models cache
│   └── ocr/                  # Python OCR worker (YOLO + PaddleOCR) — run_consumer.py, src/, models/
├── libs/
│   └── common/src/
│       ├── configurations/   # orm.ts (TypeORM DataSource), envValidation.ts
│       ├── constants/        # enums.ts (Role, Microservices, *Patterns…), classes.ts
│       ├── database/         # base.entity.ts (id, globalId, timestamps, soft delete)
│       ├── decorators/       # roles.decorator.ts
│       ├── filters/          # catch-everything.filter.ts (HTTP + RPC error mapping)
│       ├── interceptors/     # logging.interceptor.ts (RPC)
│       ├── middlewares/      # logging.middleware.ts (HTTP)
│       ├── pipes/            # big-int.pipe.ts
│       └── services/         # logging.service.ts (Winston)
├── docker-compose.dev.yml    # Local dev (build from source)
├── docker-compose.prod.yml   # Production (pull images from Docker Hub)
├── nginx.conf                # TLS + reverse proxy (prod host)
├── rabbitmq.conf             # RabbitMQ file logging
├── nest-cli.json             # Monorepo projects (1 lib + 5 Node apps)
├── tsconfig.json             # @app/common path alias, ES2023
├── .github/workflows/
│   ├── dev.yml               # CI on `development` (install → build → test)
│   └── prod.yml              # CI/CD on `main` (test → build/push → deploy → health-check)
└── logs/                     # Mounted log output (per service)
```

> **Build‑time coupling:** because DTOs/entities/constants are shared between services, each Node `Dockerfile` copies selected source from sibling apps (e.g. the Doctor image copies entities from `auth`/`super-admin` and DTOs from `super-admin`/`cloud-storage`/`asr`) plus the full `libs/`, then runs `npm run build <app>`.

---

## Domain & data model

All TypeORM entities extend a shared `BaseEntity` (`libs/common/src/database/base.entity.ts`):

| Column      | Type              | Notes                                                               |
| ----------- | ----------------- | ------------------------------------------------------------------- |
| `id`        | integer           | `@PrimaryGeneratedColumn` (internal, auto‑increment)                |
| `globalId`  | uuid              | `@Generated('uuid')`, unique — the external/API identifier          |
| `createdAt` | timestamp         | `@CreateDateColumn`                                                 |
| `updatedAt` | timestamp         | `@UpdateDateColumn`                                                 |
| `deletedAt` | timestamp \| null | `@DeleteDateColumn` — **soft delete** (rows are never hard‑deleted) |

> **Internal vs. external ids:** services pass `globalId` (UUID) across RMQ and to clients, while numeric `id` is used for in‑database relationships. Soft‑deleted rows are excluded by default; `includeDeleted` / `onlyDeleted` pagination flags and `withDeleted` queries surface them for restore flows.

### Auth domain (users & staff)

- **`User` (`Users`)** — `firstName`, `lastName`, `role` (enum), `gender` (enum), `language` (enum, default `ENGLISH`), `dateOfBirth` (date), `socialSecurityNumber` (bigint, unique). _Password is **not** stored here._
- **`BaseStaff`** (abstract) — `phone` (unique), `email` (unique), `password` (bcrypt hash), `speciality` (nullable), `clinicId` (indexed), and a `OneToOne` → `User` (`onDelete: CASCADE`).
  - **`Doctor` (`Doctors`)** extends BaseStaff, adds `isApproved` (boolean, default `false`).
  - **`SuperAdmin` (`Super-Admins`)** extends BaseStaff.
- **`Patient` (`Patients`)** — `address` (nullable), `job` (nullable), `OneToOne` → `User`.

**National‑ID derivation:** the 14‑digit Egyptian `socialSecurityNumber` is validated by regex `^[23]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{7}$` and used to derive **gender** (13th digit: odd = male, even = female) and **date of birth** (century digit `2`→1900s / `3`→2000s + `YYMMDD`).

### Doctor domain (clinical records)

A shared abstract base `DoctorPatientRelation` carries `patientId` and `userId` (the doctor's user id), both indexed.

- **`Visit` (`Visits`)** — `diagnoses` (text), `diagnosesAudioUrl` (text, nullable), `clinicId` (int, indexed).
- **`Medication` (`Medications`)** — `name`, `dosage` (enum `MedicationDosage`), `period` (enum `MedicationPeriod`), `comments` (nullable), `commentsAudioUrl` (nullable).
- **`Scan` (`Scans`)** — `name`, `type` (enum `ScanTypes`), `photoUrl` (text, nullable), `comments` (nullable), `commentsAudioUrl` (nullable).
- **`Lab` (`Labs`)** — `name`, `photoUrl` (text, nullable), `comments` (nullable), `commentsAudioUrl` (nullable).

### Super‑Admin domain

- **`Clinic` (`Clinics`)** — `name`, `speciality`. Doctors/super‑admins reference a clinic by id (`clinicId`).

### Enumerations (`libs/common/src/constants/enums.ts` and per‑app `constants/enums.ts`)

| Enum               | Values                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| `Role`             | `SUPER_ADMIN` (0), `DOCTOR` (1), `PATIENT` (2)                                |
| `Gender`           | `MALE` (0), `FEMALE` (1)                                                      |
| `Language`         | `ENGLISH` (0), `ARABIC` (1)                                                   |
| `Environment`      | `PRODUCTION` (`'prod'`), `DEVELOPMENT` (`'dev'`), `TESTING` (`'test'`)        |
| `MedicationDosage` | once → six times per day (`'1'`–`'6'`)                                        |
| `MedicationPeriod` | `CHRONIC` (`'0'`), individual days, weeks, and months (≈42 values — see enum) |
| `ScanTypes`        | `MRI`, `CT`, `X_RAY`, `ULTRA_SOUND`, `PET_CT`, `MAMOGRAPHY`                   |

---

## Roles & permissions

Authorization is enforced at the Gateway by `JwtAuthGuard` (extends Passport `AuthGuard('jwt')`) combined with the `@Roles(...)` decorator (`ROLES_KEY = 'roles'`). The guard validates the JWT, loads the user, and checks that the user's role is among those required by the handler.

| Role          | Capabilities (high level)                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPER_ADMIN` | Manage clinics, doctors and patients; view system‑wide doctors/patients/visits; create & amend clinical records; OCR/ASR. Auto‑approved on creation.     |
| `DOCTOR`      | Create/read their own patients' visits, medications, labs, scans; search patients; OCR/ASR. **Requires approval** (`isApproved`) before they can log in. |
| `PATIENT`     | Represented in the data model and created by staff; not an interactive API consumer in the current surface.                                              |

---

## Quick start

**Prerequisites**

- Docker + Docker Compose (the only hard requirement to run the whole stack).
- For GPU AI services: an NVIDIA GPU + drivers + NVIDIA Container Toolkit (otherwise OCR falls back to CPU/OpenVINO; ASR expects CUDA).
- For non‑Docker Node development: Node.js 24+, a reachable PostgreSQL 15+ and RabbitMQ.
- A Cloudinary account (cloud name + API key/secret) for media uploads.

**Run the full stack (Docker, recommended)**

```bash
npm ci                                   # install (for tooling / local builds)
# create the per-service .env files (see Configuration below):
#   apps/api-gateway/.env  apps/auth/.env  apps/doctor/.env
#   apps/super-admin/.env  apps/cloud-storage/.env
#   apps/asr/.env  apps/ocr/.env  libs/common/.env
npm run docker-compose:run               # stop → build → up -d (docker-compose.dev.yml)
```

The compose script runs:

```bash
docker compose -f docker-compose.dev.yml stop \
  && docker compose -f docker-compose.dev.yml build \
  && docker compose -f docker-compose.dev.yml up -d
```

Then:

- **API Gateway:** http://localhost:4000/api/v1
- **Swagger (dev only):** http://localhost:4000/api/v1/docs

Before first use, apply migrations (see [Database & migrations](#database--migrations)).

---

## Configuration (.env)

Each Node service validates its environment at boot with `class-validator` (`validateEnviornmentVariables` + a per‑app `EnvironmentVariables` class); invalid/missing variables abort startup. The Python services read individual `RABBITMQ_*` variables (no single URL). Values below are taken directly from the validation classes.

> **Cross‑service invariants**
>
> - `ISSUER`, `AUDIENCE`, and `ACCESS_TOKEN_SECRET` **must be identical** between Auth (token signing) and the Gateway (token verification).
> - Queue names are validated to **exact literals**: `auth`, `doctor`, `super-admin`, `ocr`, `asr`, `cloud-storage`.
> - `GLOBAL_PREFIX` must equal `api`.
> - Node services use `RABBIT_MQ_URL` (a single `amqp://…` URL with host **and** port); Python services use discrete `RABBITMQ_HOST/PORT/USER/PASSWORD/VHOST`.
> - The RabbitMQ compose service is named **`rabbitmq`** (use it as the AMQP host inside Docker).

### API Gateway — `apps/api-gateway/.env`

```dotenv
ENVIRONMENT=dev                 # dev | prod | test
PORT=4000                       # 1..65535
VERSION=1                       # numeric; drives /api/v<VERSION>
GLOBAL_PREFIX=api               # must equal "api"

ACCESS_TOKEN_SECRET=<alphanumeric>   # MUST match Auth
ISSUER=<issuer>                      # MUST match Auth
AUDIENCE=<client-origin>             # MUST match Auth; also the CORS origin

COOKIES_SECRET=<alphanumeric>
COOKIES_EXPIRATION_TIME=120000       # cookie lifetime in milliseconds

RABBIT_MQ_URL=amqp://user:pass@rabbitmq:5672
RABBIT_MQ_AUTH_QUEUE=auth
RABBIT_MQ_DOCTOR_QUEUE=doctor
RABBIT_MQ_SUPER_ADMIN_QUEUE=super-admin
RABBIT_MQ_OCR_QUEUE=ocr
RABBIT_MQ_ASR_QUEUE=asr

ASR_TMP_DIR=/app/tmp/asr_uploads     # shared temp dir for uploaded audio/images

# CORS — validation enforces these only when ENVIRONMENT=prod, but they are read
# at bootstrap, so provide them in every environment:
METHODS=GET,POST,PUT,PATCH,DELETE    # comma-separated; must contain a comma in prod
CREDENTIALS=true                     # boolean string
```

### Auth — `apps/auth/.env`

```dotenv
ENVIRONMENT=dev
DATABASE_URL=postgresql://user:pass@postgres:5432/codeblue

ROUNDS=12                            # bcrypt cost (positive int)
ACCESS_TOKEN_SECRET=<alphanumeric>   # MUST match Gateway
ACCESS_TOKEN_EXPIRATION_TIME=3600    # JWT lifetime in SECONDS
HASHING_ALGORITHM=HS256              # HS256|HS384|HS512|RS256|RS384|RS512
ISSUER=<issuer>                      # MUST match Gateway
AUDIENCE=<client-origin>             # MUST match Gateway

RABBIT_MQ_URL=amqp://user:pass@rabbitmq:5672
RABBIT_MQ_AUTH_QUEUE=auth
RABBIT_MQ_SUPER_ADMIN_QUEUE=super-admin
```

### Doctor — `apps/doctor/.env`

```dotenv
ENVIRONMENT=dev
DATABASE_URL=postgresql://user:pass@postgres:5432/codeblue

RABBIT_MQ_URL=amqp://user:pass@rabbitmq:5672
RABBIT_MQ_DOCTOR_QUEUE=doctor
RABBIT_MQ_AUTH_QUEUE=auth
RABBIT_MQ_SUPER_ADMIN_QUEUE=super-admin
RABBIT_MQ_ASR_QUEUE=asr
RABBIT_MQ_CLOUD_STORAGE_QUEUE=cloud-storage   # used at runtime by the cloud-storage client
```

> `RABBIT_MQ_CLOUD_STORAGE_QUEUE` is required at runtime (the Doctor module registers a Cloud‑Storage RMQ client) even though it is not part of the Doctor validation schema.

### Super‑Admin — `apps/super-admin/.env`

```dotenv
ENVIRONMENT=dev
DATABASE_URL=postgresql://user:pass@postgres:5432/codeblue

RABBIT_MQ_URL=amqp://user:pass@rabbitmq:5672
RABBIT_MQ_DOCTOR_QUEUE=doctor
RABBIT_MQ_AUTH_QUEUE=auth
RABBIT_MQ_SUPER_ADMIN_QUEUE=super-admin
```

### Cloud‑Storage — `apps/cloud-storage/.env`

```dotenv
ENVIRONMENT=dev
RABBIT_MQ_URL=amqp://user:pass@rabbitmq:5672
RABBIT_MQ_CLOUD_STORAGE_QUEUE=cloud-storage

CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<numeric-api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

### ASR (Python) — `apps/asr/.env`

```dotenv
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBIT_MQ_ASR_QUEUE=asr
RABBIT_MQ_PREFETCH_COUNT=2

WHISPER_MODEL_SIZE=large-v3          # base|small|medium|large|large-v3…
WHISPER_DEVICE=auto                  # auto|cuda|cpu
WHISPER_COMPUTE_TYPE=default         # default|int8|float16|bfloat16|float32
WHISPER_DEFAULT_BEAM_SIZE=1
MAX_CONCURRENT_REQUESTS=4
LOG_LEVEL=INFO
# TEMP_DIR, LOG_DIR, HF_HOME (model cache) are set by the Dockerfile
```

### OCR (Python) — `apps/ocr/.env`

```dotenv
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBIT_MQ_OCR_QUEUE=ocr

CONFIDENCE_THRESHOLD=0.6             # YOLO region-detection confidence
ID_DIGIT_CONFIDENCE=0.25            # digit-detection confidence
IMAGE_SIZE=640                       # YOLO input size
PADDLE_GPU_ENABLED=true
LOG_LEVEL=INFO
```

### TypeORM CLI — `libs/common/.env`

Used by the migration commands (a single DataSource that discovers every entity/migration under `apps/**`).

```dotenv
DATABASE_URL=postgresql://user:pass@postgres:5432/codeblue
```

> **Production env files** are flat‑named next to `docker-compose.prod.yml` on the server: `api-gateway.env`, `auth.env`, `doctor.env`, `super-admin.env`, `cloud-storage.env`, `asr.env`, `ocr.env`. In prod the Gateway listens on **5000** (behind nginx).

---

## Running locally

### With Docker (all services)

```bash
npm run docker-compose:run
# Gateway → http://localhost:4000/api/v1   (Swagger at /api/v1/docs)
```

`docker-compose.dev.yml` builds every service from source, starts RabbitMQ, the four Node microservices, the Gateway (`4000:4000`), and the two GPU Python workers. Shared host mounts:

- `./logs` → `/app/logs` (Node services) and `./logs/asr`, `./logs/ocr` for the Python ones.
- `./tmp/asr_uploads` → `/app/tmp/asr_uploads` on Gateway, Doctor and Cloud‑Storage (so a file written by the Gateway can be read by Doctor/Cloud‑Storage).
- `./asr_model_cache` (Whisper) and the `paddleocr-cache` named volume (PaddleOCR) persist downloaded models between runs.

### Per‑app (Node, without Docker)

You still need PostgreSQL and RabbitMQ reachable, plus each app's `.env`.

```bash
# build a single app
npm run build api-gateway        # | auth | doctor | super-admin | cloud-storage

# run in watch mode (defaults to the gateway / nest-cli root project)
npm run start:dev

# or start a specific app
npm run start -- auth            # | doctor | super-admin | cloud-storage | api-gateway
```

### Python workers (without Docker)

```bash
cd apps/asr   # or apps/ocr
pip install -r requirements.txt  # ASR also needs ffmpeg; OCR needs paddlepaddle-gpu (see Dockerfile)
python run_consumer.py
```

---

## Database & migrations

- **DataSource:** `libs/common/src/configurations/orm.ts`
  - Runtime (`dataSourceAsyncOptions`): `type: postgres`, `url: DATABASE_URL`, `ssl.rejectUnauthorized: false`, `autoLoadEntities: true`, `synchronize: false`, `logging: ['error','warn']`.
  - CLI (`dataSource`): same, but globs **all** apps — entities `apps/**/*.entity.{ts,js}`, migrations `apps/**/migration/*.{ts,js}` — and uses `DATABASE_URL` from `libs/common/.env`.
- **`synchronize` is off** everywhere — schema changes are migration‑driven only.

> **One schema, many services.** Although each Node service has its own `DATABASE_URL`, the entire schema is managed by this single TypeORM DataSource and migrations cross‑reference tables across services (e.g. the Super‑Admin migration alters `Doctors`/`Super-Admins`, which Auth owns). In the reference setup all Node services point at **one shared PostgreSQL database**.

**Commands**

```bash
npm run migration:generate -- apps/<app>/src/migration/<Name>   # generate from entity diff
npm run migration:run                                           # apply pending migrations
npm run migration:revert                                        # roll back the last migration
```

**Migration history (by app)**

- **Auth** — create `Users`; create `Doctors`; create `Patients`; FK constraints (Doctors/Patients → Users); move `password` off `User` onto staff, add `language` + (later removed) `refreshToken`, extend `Role`; add `Super-Admins` table; default `isApproved = false`.
- **Doctor** — create `Visits`, `Medications`, `Scans`, `Labs`; align entities with best practice (drop FKs, enforce `NOT NULL` on `patientId`/`userId`); unique constraint on staff phone; `NOT NULL` on `userId`.
- **Super‑Admin** — add `clinicId` to `Super-Admins`, index it, and make `Doctors.speciality` nullable.
- **Cloud‑Storage** — make `Scans`/`Labs` `photoUrl` nullable; add audio URL columns (`diagnosesAudioUrl`, `commentsAudioUrl`) for visits/labs/scans and then medications.

---

## Authentication & authorization

1. **Login** — `POST /auth/login` with `{ email, password }`. The Gateway forwards to Auth (`auth.login`). Auth validates the credentials against **approved** doctors and super‑admins (bcrypt compare; email trimmed/lowercased) and issues a JWT.
2. **JWT** — signed by Auth with `ACCESS_TOKEN_SECRET`, algorithm `HASHING_ALGORITHM`, `expiresIn = ACCESS_TOKEN_EXPIRATION_TIME` (seconds), `iss = ISSUER`, `aud = AUDIENCE`. Payload: `{ sub, globalId, socialSecurityNumber, role }`.
3. **Cookie** — the Gateway sets the token in a **signed, HTTP‑only** cookie named `accessToken` (signed with `COOKIES_SECRET`, `maxAge = COOKIES_EXPIRATION_TIME` ms). In production the cookie is `secure` + `sameSite: 'none'`; otherwise `sameSite: 'lax'`. The login response body returns `{ name, language, role }`.
4. **Verification** — the Gateway's Passport JWT strategy extracts the token from the signed cookie, verifies signature/`aud`/`iss`/expiry (`ignoreExpiration: false`), then calls Auth (`auth.user`) to load the full user (rejecting if not found).
5. **Authorization** — `@Roles(Role.X, …)` + `JwtAuthGuard` restrict handlers per role.

**Swagger** (dev only): `/api/v<VERSION>/docs`.

> **Pitfall:** if `aud`/`iss` checks fail even when values look identical, trim trailing whitespace in the env files and reissue a fresh token. Rotate `ACCESS_TOKEN_SECRET` in **both** Auth and Gateway together.

---

## API reference (Gateway)

All routes are prefixed with the global prefix and version, i.e. **`/api/v<VERSION>`** (e.g. `/api/v1`). "Auth ✓" means a valid `accessToken` cookie is required; "Roles" lists accepted roles. Health endpoints are public.

### Auth — base `/auth`

| Method | Path                   | Auth | Roles                   | Body                                                         |
| ------ | ---------------------- | ---- | ----------------------- | ------------------------------------------------------------ |
| GET    | `/auth`                | –    | public                  | Health check                                                 |
| POST   | `/auth/login`          | –    | public                  | `LoginDto` `{ email, password }` → sets `accessToken` cookie |
| POST   | `/auth/doctor/create`  | ✓    | `SUPER_ADMIN`           | `CreateDoctorDto`                                            |
| POST   | `/auth/patient/create` | ✓    | `SUPER_ADMIN`, `DOCTOR` | `CreatePatientDto`                                           |

### Doctor — base `/doctor`

| Method | Path                                    | Auth | Roles    | Body / params                                           |
| ------ | --------------------------------------- | ---- | -------- | ------------------------------------------------------- |
| GET    | `/doctor`                               | –    | public   | Health check                                            |
| POST   | `/doctor/visit`                         | ✓    | `DOCTOR` | `CreateVisitDto` + optional `audio` file                |
| POST   | `/doctor/medication`                    | ✓    | `DOCTOR` | `CreateMedicationDto` + optional `audio` file           |
| POST   | `/doctor/lab`                           | ✓    | `DOCTOR` | `UploadLabDto` + `image` (required) + optional `audio`  |
| POST   | `/doctor/scan`                          | ✓    | `DOCTOR` | `UploadScanDto` + `image` (required) + optional `audio` |
| GET    | `/doctor/patients`                      | ✓    | `DOCTOR` | `?page&limit`                                           |
| GET    | `/doctor/visits`                        | ✓    | `DOCTOR` | `?page&limit`                                           |
| GET    | `/doctor/patient/:id/visits`            | ✓    | `DOCTOR` | patient `globalId`                                      |
| GET    | `/doctor/patient/:id/medications`       | ✓    | `DOCTOR` | patient `globalId`                                      |
| GET    | `/doctor/patient/:id/scans`             | ✓    | `DOCTOR` | patient `globalId`                                      |
| GET    | `/doctor/patient/:id/labs`              | ✓    | `DOCTOR` | patient `globalId`                                      |
| GET    | `/doctor/patient/:socialSecurityNumber` | ✓    | `DOCTOR` | search by national ID                                   |

### Super‑Admin — base `/super-admin` (all `SUPER_ADMIN`)

| Method | Path                                                                                                              | Body / params                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | `/super-admin`                                                                                                    | Health check (public)                                                |
| GET    | `/super-admin/doctors`                                                                                            | `?page&limit`                                                        |
| GET    | `/super-admin/patients`                                                                                           | `?page&limit`                                                        |
| GET    | `/super-admin/visits`                                                                                             | `?page&limit`                                                        |
| GET    | `/super-admin/managed-patients`                                                                                   | `?page&limit`                                                        |
| GET    | `/super-admin/managed-visits`                                                                                     | `?page&limit`                                                        |
| GET    | `/super-admin/patient/:id` · PATCH `/super-admin/patient/:id`                                                     | get / update patient (`UpdatePatientDto`)                            |
| GET    | `/super-admin/doctor/:id` · PATCH · DELETE · PATCH `/doctor/:id/restore`                                          | get / update (`UpdateDoctorDto`) / soft‑delete / restore doctor      |
| POST   | `/super-admin/clinic` · PATCH `/clinic/:id` · DELETE `/clinic/:id` · PATCH `/clinic/:id/restore` · GET `/clinics` | clinic CRUD (`CreateClinicDto` / `UpdateClinicDto`) + paginated list |
| POST   | `/super-admin/visit` · `/medication` · `/lab` · `/scan`                                                           | create records (same DTOs/files as Doctor)                           |
| PATCH  | `/super-admin/visit/:id` · `/medication/:id` · `/lab/:id` · `/scan/:id`                                           | amend records (with optional image/audio)                            |
| GET    | `/super-admin/patient/:id/visits` · `/medications` · `/scans` · `/labs`                                           | patient record views                                                 |
| GET    | `/super-admin/patient-search/:socialSecurityNumber`                                                               | search patient by national ID                                        |
| GET    | `/super-admin/clinic/:clinicId/visits` · `/doctors` · `/patients`                                                 | clinic‑scoped, paginated                                             |

### ASR — base `/asr`

| Method | Path              | Auth | Roles                   | Body                                                    |
| ------ | ----------------- | ---- | ----------------------- | ------------------------------------------------------- |
| GET    | `/asr`            | –    | public                  | Health check                                            |
| POST   | `/asr/transcribe` | ✓    | `DOCTOR`, `SUPER_ADMIN` | multipart `file` (audio, ≤ 20 MB) → `{ transcription }` |

### OCR — base `/ocr`

| Method | Path              | Auth | Roles                   | Body                                                                                                |
| ------ | ----------------- | ---- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| GET    | `/ocr`            | –    | public                  | Health check                                                                                        |
| POST   | `/ocr/process-id` | ✓    | `SUPER_ADMIN`, `DOCTOR` | multipart `image` (jpg/png/pdf, ≤ 5 MB) → `{ firstName, lastName, location, socialSecurityNumber }` |

---

## Inter‑service messaging (RabbitMQ)

- **Transport options** (all microservices): `Transport.RMQ`, `urls: [RABBIT_MQ_URL]`, `queue: <service queue>`, `queueOptions: { durable: true }`, `persistent: true`, `maxConnectionAttempts: 5`.
- **Patterns** are dotted strings defined as enums in `libs/common/src/constants/enums.ts` — e.g. `auth.login`, `auth.doctor.create`, `doctor.visit.create`, `doctor.patient.visits`, `superAdmin.clinic.create`, `superAdmin.getClinicVisits`, `asr.transcribeAudio`, `ocr.isUp`, `cloud-storage.uploadLabPhoto`. (The Gateway's OCR call uses an empty pattern; the Python OCR worker routes by payload.)
- **`send` vs `emit`** — queries/updates use request/reply `send`; record **creation/upload** uses fire‑and‑forget `emit` (e.g. `doctor.visit.create`, `doctor.lab.upload`).
- **DI tokens** — `AUTH_MICROSERVICE`, `DOCTOR_MICROSERVICE`, `SUPER_ADMIN_MICROSERVICE`, `ASR_MICROSERVICE`, `OCR_MICROSERVICE`, `CLOUD_STORAGE_MICROSERVICE` (see `Microservices` enum).
- **Validation across the wire** — each microservice applies a global `ValidationPipe` (`transform`, `forbidUnknownValues`) whose `exceptionFactory` wraps failures in an `RpcException` carrying `{ message, status: 400 }`.

> Two historical typos are preserved in the enums (kept here so message strings match the code exactly): `auht.clinic.doctors` and `…searchForPatientBySocilaSecurityNumber`.

---

## AI / ML services

Both AI workers are standalone Python processes that consume from RabbitMQ, run GPU inference, reply over the RPC `reply_to`/`correlation_id` mechanism, and clean up temp files. They log to daily‑rotated files (`YYYY-MM-DD.log` + `…_errors.log`).

### ASR — speech‑to‑text (`apps/asr`)

- **Model:** OpenAI Whisper via `faster-whisper` (CTranslate2). Size/device/precision configurable (`WHISPER_MODEL_SIZE`, `WHISPER_DEVICE`, `WHISPER_COMPUTE_TYPE`); default `large-v3`, auto device.
- **Pipeline:** receive `{ audio_base64, beam_size? }` → decode → save temp → **ffmpeg** normalises to 16 kHz mono WAV → `model.transcribe(...)` → concatenate segments → reply `{ transcription }` (or `{ error, status: 500 }`) → delete temp dir → ack.
- **Concurrency:** background `ThreadPoolExecutor` (`MAX_CONCURRENT_REQUESTS`, default 4) with QoS prefetch (`RABBIT_MQ_PREFETCH_COUNT`, default 2); the main connection never blocks.
- **Image:** `nvidia/cuda:12.2.2-cudnn8-runtime-ubuntu22.04` + Python 3 + ffmpeg; Whisper weights cached in `/app/models` (`HF_HOME`).

### OCR — Egyptian national‑ID extraction (`apps/ocr`)

- **Models (three stages):**
  1. **Region detection** — YOLOv8 (`egyId_weights.pt` / OpenVINO `Class_openvino_model`) locates the ID outline, name zones, location zone and photo box.
  2. **Digit detection** — YOLOv8 (`best.pt` / OpenVINO `ID_openvino_model`) detects the 14 ID digits, ordered left‑to‑right.
  3. **Text recognition** — **PaddleOCR** (`lang='ar'`) reads the Arabic name/location crops (RTL‑aware).
- **Backend selection:** if a CUDA GPU + `.pt` weights + `ultralytics` are present → **PyTorch** on `cuda:0`; otherwise → **OpenVINO** on CPU. Pre‑trained weights ship in `apps/ocr/models/`.
- **Pipeline:** receive `{ image_base64 }` → decode/save → YOLO region detect (`CONFIDENCE_THRESHOLD`) → crop name/location/ID regions → PaddleOCR on text crops + YOLO digits on the ID crop → reply `{ firstName, lastName, location, socialSecurityNumber }` (or `{ error: "Invalid National ID Photo" }`) → delete run dir → ack. Prefetch = 1 (one ID at a time). The Gateway applies a 60 s timeout.
- **Image:** `nvidia/cuda:12.9.0-cudnn-runtime-ubuntu22.04` + Python 3.11 + `paddlepaddle-gpu` (installed from Paddle's CUDA index); PaddleOCR language pack cached in the `paddleocr-cache` volume.

---

## Media & file handling

Cloud‑Storage wraps Cloudinary and is the only writer of binary media.

- **Configuration:** `cloud_name` / `api_key` / `api_secret` from env; `secure: true` in production.
- **Folder layout:** `CodeBlue Project/<ENVIRONMENT>/Patients/<patientGlobalId>/<Visits|Labs|Scans|Medications>`, with deterministic `public_id`s (e.g. `<labGlobalId>`, `<scanGlobalId>-image`, `<…>-audio`). Audio is stored as Cloudinary `resource_type: 'video'`.
- **Patterns:** `cloud-storage.uploadLabPhoto`, `uploadScanPhoto`, `uploadLabAudio`, `uploadScanAudio`, `uploadMedicationAudio`, `uploadVisitAudio`, and `deleteTemporaryFile` (cleanup event).
- **What gets stored where:** uploads return a `secure_url` that the Doctor service persists into `Labs.photoUrl`/`commentsAudioUrl`, `Scans.photoUrl`/`commentsAudioUrl`, `Visits.diagnosesAudioUrl`, `Medications.commentsAudioUrl`.

**Gateway upload limits / accepted types**

| Use                                               | Field   | Types               | Max   |
| ------------------------------------------------- | ------- | ------------------- | ----- |
| Record audio (visit/medication/lab/scan comments) | `audio` | mpeg, wav, mp3, ogg | 10 MB |
| Record image (lab/scan)                           | `image` | jpeg, jpg, png      | 5 MB  |
| ASR transcription                                 | `file`  | any `audio/*`       | 20 MB |
| OCR national ID                                   | `image` | jpeg, jpg, png, pdf | 5 MB  |

Uploaded audio/images for records are written to `ASR_TMP_DIR` (the shared `./tmp/asr_uploads` volume) so Doctor and Cloud‑Storage can read them; OCR images are kept in memory and sent as base64.

---

## End‑to‑end workflows

**Create a visit with dictated diagnosis (`POST /doctor/visit` with audio)**

1. Gateway authenticates (role `DOCTOR`), saves the audio under `ASR_TMP_DIR`, and `emit`s `doctor.visit.create` with the file path + the doctor's user id.
2. Doctor service reads the file, base64‑encodes it, and calls ASR (`asr.transcribeAudio`) → transcript becomes `diagnoses`.
3. Doctor uploads the audio via Cloud‑Storage (`cloud-storage.uploadVisitAudio`) → `diagnosesAudioUrl`, then `emit`s `cloud-storage.deleteTemporaryFile` to remove the temp file.
4. Doctor persists the `Visit` (resolving patient/clinic ids via RMQ to Auth/Super‑Admin).

**Onboard a patient from an ID card (`POST /ocr/process-id` → `POST /…/patient/create`)**

1. Gateway sends the ID image to OCR (60 s timeout) and receives `{ firstName, lastName, location, socialSecurityNumber }`.
2. The client pre‑fills the patient form; `POST /auth/patient/create` (or `/super-admin`) creates the `User` + `Patient`, deriving gender and date of birth from the national ID.

**Admin dashboards** — Super‑Admin endpoints mostly `send` to Auth (people) and Doctor (records), aggregate, translate `globalId ↔ id`, and reshape responses (e.g. relabelling `doctor` → `superAdmin`).

---

## Error handling

- **Global filter:** `libs/common/src/filters/catch-everything.filter.ts`, registered at the Gateway via `APP_FILTER`.
  - Detects NestJS `HttpException` (uses its status/message) **and** plain RMQ RPC error objects (shape `{ status: number, message: string }`), defaulting unknowns to HTTP 500, and returns a normalized HTTP response.
- **Why shape‑based:** RMQ errors frequently arrive as plain objects rather than `RpcException` instances, so the filter uses a structural guard. Microservices emit these via their `ValidationPipe` exception factory (`{ message, status: 400 }`) and `RpcException(ErrorResponse(message, status))` throughout the services (404 not‑found, 400 conflicts/validation, 500 I/O).

---

## Logging & observability

Shared Winston infrastructure in `libs/common`:

- **`LoggingService`** — `LoggerService` implementation; daily‑rotated files under `logs/<service>/` (`<date>.log` + `<date>-error.log`), Cairo timezone (`Africa/Cairo`), console output only when not production.
- **`LoggingInterceptor`** — RPC interceptor that logs `Class.handler - Success/Error - <ms>` per message.
- **`LoggingMiddleware`** — HTTP middleware that logs `method url - status - <ms> - ip` (IP from `X-Forwarded-For`), routing 5xx→error, 4xx→warn, else info.
- **RabbitMQ** logs to `/app/logs/rabbitmq/rabbitmq.log` (see `rabbitmq.conf`).

Logs are bind‑mounted to the host `./logs` directory in both compose files.

---

## Security & rate limiting

- **Helmet** secure headers on the Gateway.
- **Signed, HTTP‑only cookies** for the JWT (`secure` + `SameSite=None` in production).
- **CORS** restricted to `AUDIENCE` with configurable `METHODS`/`CREDENTIALS`.
- **Throttling** — `@nestjs/throttler`: **40 requests / 2 minutes**, then a **1‑minute** block.
- **Validation** — global `ValidationPipe` (`transform`, `whitelist`, `forbidUnknownValues`) rejects unknown/invalid payloads at both the Gateway and each microservice.
- **Passwords** — bcrypt (`ROUNDS` cost), stored only on staff entities; never on `User`.
- **TLS** — terminated at nginx (TLSv1.2/1.3) in production.

---

## Testing

```bash
npm test            # Jest unit tests (*.spec.ts under apps/ and libs/)
npm run test:watch  # watch mode
npm run test:cov    # coverage → ./coverage
npm run test:e2e    # e2e (apps/api-gateway/test/jest-e2e.json)
npm run lint        # ESLint (--fix)
npm run format      # Prettier
```

Example unit coverage: `apps/auth/src/auth.controller.spec.ts` exercises the login, doctor/patient creation, and user‑lookup message handlers with mocked repositories, `JwtService`, `ConfigService` and clients.

---

## CI/CD & deployment

GitHub Actions, two workflows:

### `dev.yml` — branch `development`

Triggers on push/PR to `development` (and manual dispatch) when `apps/**`, the workflow, or `package*.json` change. Single `test` job on Node 24: `npm ci` → `npm run build` → `npm run test`. No image build/deploy.

### `prod.yml` — branch `main`

Triggers on push/PR to `main` (and manual dispatch) for changes under `apps/**`, the workflow, `package*.json`, `docker-compose.prod.yml`, `nginx.conf`, `rabbitmq.conf`. Jobs:

1. **test** — Node 24: `npm ci` → build → test.
2. **build-and-push** (push only) — Docker Hub login, then `docker/build-push-action` builds and pushes each image: `auth-service`, `api-gateway`, `doctor-service`, `ocr-service`, `asr-service`, `cloud-storage-service`, `super-admin-service` (all `:latest`).
3. **deploy** (push only) — join **Tailscale**, SCP `docker-compose.prod.yml` + `rabbitmq.conf` + `nginx.conf` to the EC2 host (`~/app`), then over SSH: `docker compose -f docker-compose.prod.yml pull && up -d --remove-orphans && docker image prune -af`.
4. **health-check** (push only) — `curl --fail --retry` the deployed `/`, `/auth`, `/doctor`, `/ocr`, `/asr`, `/super-admin` over HTTPS.

**Required secrets:** `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `TAILSCALE_AUTHKEY`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `PROD_HOST`.

**Production topology:** internet → nginx (`code-blue-apis.me`, TLS via Let's Encrypt) → `127.0.0.1:5000` (API Gateway container) → RabbitMQ → microservices, with PostgreSQL via `DATABASE_URL` and media on Cloudinary. Containers restart `always`; GPU is reserved for ASR/OCR via the NVIDIA device reservation.

---

## Infrastructure files

| File                      | Purpose                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.dev.yml`  | Local dev — builds all services from source; Gateway on `4000`; shared `./logs` & `./tmp/asr_uploads`; GPU reserved for asr/ocr; model caches persisted. |
| `docker-compose.prod.yml` | Production — pulls `youssefhassanien1/*:latest`; Gateway on `5000`; `restart: always`; flat `*.env` files; mounts `rabbitmq.conf`.                       |
| `nginx.conf`              | Redirects HTTP→HTTPS and reverse‑proxies `https://code-blue-apis.me` to the Gateway on `127.0.0.1:5000` (TLSv1.2/1.3, Let's Encrypt certs).              |
| `rabbitmq.conf`           | Disables console logging; writes `/app/logs/rabbitmq/rabbitmq.log` at `info`.                                                                            |
| `nest-cli.json`           | Monorepo definition — library `common` + apps `api-gateway` (root), `auth`, `doctor`, `super-admin`, `cloud-storage` (webpack build).                    |
| `Dockerfiles`             | Node apps: multi‑stage `node:24-alpine` (builder → `npm ci --only=production` runtime). Python apps: `nvidia/cuda` bases running `run_consumer.py`.      |

---

## Conventions & gotchas

- **`globalId` (UUID) is the external id**; numeric `id` stays internal. Always address records across services by `globalId`.
- **Soft delete everywhere** — queries exclude `deletedAt` rows by default; use restore endpoints rather than hard deletes.
- **Doctors need approval** (`isApproved`) before they can log in; super‑admins are auto‑approved.
- **Keep `ISSUER`/`AUDIENCE`/`ACCESS_TOKEN_SECRET` in sync** between Auth and Gateway, and remember **token lifetime is in seconds** while **cookie lifetime is in milliseconds**.
- **Node services use a single `RABBIT_MQ_URL`; Python services use discrete `RABBITMQ_*` vars** — don't mix the two styles.
- **The `tmp/asr_uploads` volume must be shared** by Gateway, Doctor and Cloud‑Storage for media flows to work.
- **GPU required** for ASR; OCR will fall back to OpenVINO/CPU if no GPU is available.
- **Message‑pattern typos are intentional** (`auht.clinic.doctors`, `…SocilaSecurityNumber`) — match them exactly if you add handlers.

---

## License

MIT © 2025 Youssef Hassanien
