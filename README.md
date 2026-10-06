# SWENG 861: Campus Rental (Housing)

**Author:** Charles Patterson  
**Course:** SWENG 861 – Software Construction  
**Program:** Penn State University - Master of Software Engineering

## Project Overview

Campus Rental is a full-stack university housing application being developed for the SWENG 861 Course Capstone Project.

The application is designed around two primary users: Students and Housing Officers. Students will be able to manage a housing application, submit residence hall and room-style preferences, request a known roommate or participate in AI-assisted roommate matching, receive a housing assignment, and complete the lease-signing process.

Housing Officers will manage residence hall inventory, review student applications, consider housing preferences and roommate information, make final room and bed assignments, and manage the leasing workflow.

Students will not directly claim a specific room or bed. Instead, they will submit housing preferences and Housing Officers will make the final assignment based on available inventory and roommate information. Database constraints and backend transactions will protect the assignment process from conflicting bed reservations.

AI-assisted roommate matching is also part of the planned capstone functionality. The AI feature will provide explainable roommate recommendations but will not automatically pair students or make housing assignments.

## Project Status

The initial backend and database foundation is complete.

Currently implemented:

- Node.js and Express backend using TypeScript
- Strict TypeScript configuration
- ESLint configuration
- Docker and Docker Compose development environment
- PostgreSQL container with persistent storage and health checks
- Centralized backend environment configuration
- PostgreSQL access using the `pg` driver
- Shared PostgreSQL connection pool
- Database-aware API health endpoint
- Explicit SQL migration framework
- Migration history tracking using `schema_migrations`
- Migration checksum validation
- Transactional migration execution
- Database migration status command
- Combined lint, typecheck, and build verification command

The Angular frontend and Campus Rental domain tables will be added in later feature branches.

## Repository Structure

```text
/
├── .github/
│   └── workflows/              # CI/CD workflows
├── docs/                       # Architecture and project documentation
├── src/
│   ├── client/                 # Angular frontend
│   └── server/                 # Node.js / Express backend
│       ├── src/
│       │   ├── config/         # Environment and application configuration
│       │   ├── db/             # PostgreSQL connection and migrations
│       │   │   └── migrations/ # Versioned SQL migration files
│       │   ├── app.ts
│       │   └── server.ts
│       ├── eslint.config.js
│       ├── package.json
│       └── tsconfig.json
├── ops/
│   ├── docker/                 # Dockerfiles and Docker Compose configuration
│   └── observability/          # Observability configuration and artifacts
├── tests/                      # End-to-end test suites
├── .env.example                # Example local environment configuration
├── .dockerignore
├── .gitignore
└── README.md
```

## Tech Stack

The planned technology stack for Campus Rental includes:

- **Frontend:** Angular with TypeScript
- **Backend:** Node.js with Express and TypeScript
- **Database:** PostgreSQL
- **Database Access:** `pg` PostgreSQL driver
- **Schema Management:** Explicit versioned SQL migrations
- **Authentication:** External identity provider with Campus Rental role-based authorization
- **AI Integration:** AI-assisted roommate compatibility behind a provider abstraction
- **Electronic Signature:** DocuSign behind an electronic-signature provider abstraction
- **Containerization:** Docker and Docker Compose
- **Source Control:** Git and GitHub
- **CI/CD:** GitHub Actions

The backend follows a modular monolith architecture. Domain modules will use the following general layering:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL
```

Controllers will handle HTTP concerns, services will contain business rules and workflow logic, and repositories will contain PostgreSQL access.

## Environment Setup

Campus Rental uses a repository-level `.env` file for local development.

From the repository root, create the local file from the provided example:

```powershell
Copy-Item .env.example .env
```

Update the values in `.env` as needed for your local environment.

The `.env` file contains local credentials and must not be committed to source control.

The current environment variables are:

```text
SERVER_PORT
CLIENT_PORT
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_HOST_PORT
```

The Docker Compose environment maps the PostgreSQL values into the database configuration used by the Express backend.

## Backend Local Development

Backend commands should be run from:

```text
src/server
```

Install dependencies:

```powershell
npm install
```

### Start PostgreSQL

From the repository root:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml up -d db
```

Check the container status:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml ps
```

The PostgreSQL container should report a healthy status before starting the backend.

### Run Database Migrations

From `src/server`:

```powershell
npm run db:migrate
```

### Start the Backend

From `src/server`:

```powershell
npm run dev
```

The API is available at:

```text
http://localhost:3000
```

The backend verifies PostgreSQL connectivity before it begins accepting requests.

## Health Check

The current health endpoint is:

```text
GET /health
```

Example:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

A healthy response returns:

```json
{
  "status": "ok",
  "service": "campus-rental-server",
  "database": "connected"
}
```

The health endpoint performs a PostgreSQL query rather than only checking whether the Express process is running.

If the database cannot be reached, the endpoint returns a degraded response with HTTP status `503`.

## Database Migrations

Campus Rental uses explicit PostgreSQL SQL migrations rather than an ORM.

Migration files are stored in:

```text
src/server/src/db/migrations
```

Migration filenames will use a sequential numeric prefix and descriptive name.

Example:

```text
0001_create_users.sql
0002_create_housing_inventory.sql
0003_create_housing_applications.sql
```

Migrations are applied in filename order.

Successfully applied migrations are tracked in the infrastructure table:

```text
schema_migrations
```

The table stores:

```text
filename
checksum
applied_at
```

Each migration runs inside a PostgreSQL transaction. If the migration fails, the transaction is rolled back and the migration is not recorded as applied.

A SHA-256 checksum is also stored for every applied migration. If an already-applied migration file is modified later, the migration tooling will detect the change.

Applied migration files should therefore remain immutable. Database changes should be made through a new migration instead of editing an existing applied migration.

### Check Migration Status

From `src/server`:

```powershell
npm run db:status
```

### Apply Pending Migrations

From `src/server`:

```powershell
npm run db:migrate
```

At the current development stage there are no Campus Rental domain migrations yet. The `schema_migrations` infrastructure table exists and is ready for the domain schema work planned in the next feature branch.

## Backend Verification

The backend includes separate commands for linting, TypeScript verification, and building.

Run ESLint:

```powershell
npm run lint
```

Run TypeScript type checking without generating build output:

```powershell
npm run typecheck
```

Run the production TypeScript build:

```powershell
npm run build
```

Run all three checks together:

```powershell
npm run check
```

The `check` command runs:

```text
ESLint
   ↓
TypeScript Type Check
   ↓
Production Build
```

This command should be run before completing a feature branch or preparing a Pull Request.

## Docker

The current Docker environment supports the Express backend and PostgreSQL database.

From the repository root, build and start both services:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml up -d --build db server
```

Check container status:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml ps
```

Both of the following should report healthy:

```text
campus-rental-db
campus-rental-server
```

Test the containerized API:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Check database migration status from inside the server container:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml exec server npm run db:status
```

Apply migrations from inside the server container:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml exec server npm run db:migrate
```

Stop the environment:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml down
```

Removing the PostgreSQL volume is normally unnecessary and will delete the local database data. During early development, a complete reset can be performed with:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml down -v
```

This should only be used when intentionally resetting the local development database.

## Planned Campus Rental Features

The current implementation roadmap includes:

1. Database foundation
2. Campus Rental domain schema
3. Angular frontend foundation
4. Authentication, role-based authorization, and student profiles
5. Housing inventory management
6. Housing applications and housing preferences
7. Direct roommate requests and AI-assisted roommate matching
8. Housing Officer room and bed assignment
9. Lease generation and electronic signature
10. End-to-end testing and hardening
11. CI/CD and observability
12. Final project documentation and presentation preparation

The roadmap is a working plan and may be adjusted as implementation reveals better sequencing or technical needs.

## Key Design Decisions

Campus Rental uses a modular monolith rather than separate microservices. This keeps the project manageable while still providing clear module boundaries.

Important business rules will be enforced by the backend and PostgreSQL rather than relying only on frontend behavior.

Bed availability will be derived from active housing assignments instead of storing duplicate availability state directly on bed records.

Students will submit residence hall and room-style preferences rather than selecting a specific room or bed. Housing Officers will make final assignments.

Roommate matching will support both direct mutual roommate requests and opt-in AI-assisted recommendations. AI recommendations will remain advisory and will not automatically pair students or make housing assignments.

External integrations such as DocuSign and the AI compatibility provider will be placed behind provider abstractions so the system can use deterministic mock implementations during testing and demonstrations.

## AI Use

Generative AI is being used during development to assist with planning, design discussion, implementation guidance, troubleshooting, code review, testing ideas, and documentation.

AI-generated suggestions are reviewed before being incorporated into the project. Generated code and design recommendations may be modified, rejected, or replaced when they do not fit the project requirements or established architecture.

The AI-assisted roommate matching feature planned for Campus Rental is separate from the use of generative AI as a software-development tool.

---

*This repository is for academic use as part of Penn State University's SWENG 861 – Software Construction course.*