# SWENG 861: Campus Rental (Housing)

**Author:** Charles Patterson  
**Course:** SWENG 861 – Software Construction  
**Program:** Penn State University - Master of Software Engineering

## Project Overview

Campus Rental is a full-stack university housing application being developed for the SWENG 861 Course Capstone Project.

The application is designed around two primary users: Students and Housing Officers. Students will be able to manage a housing application, submit residence hall and room-style preferences, request a known roommate or participate in AI-assisted roommate matching, receive a housing assignment, and complete the lease-signing process.

Housing Officers manage residence hall inventory, review student applications, consider housing preferences and roommate information, make final room and bed assignments, and manage the leasing workflow.

Students will not directly claim a specific room or bed. Instead, they will submit housing preferences and Housing Officers will make the final assignment based on available inventory and roommate information. Database constraints and backend transactions will protect the assignment process from conflicting bed reservations.

AI-assisted roommate matching is also part of the planned capstone functionality. The AI feature will provide explainable roommate recommendations but will not automatically pair students or make housing assignments.

## Project Status

The project currently includes the backend, database, Angular frontend, authentication and authorization foundation, Student Profile workflow, and housing inventory management.

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
- Complete ten-table Campus Rental domain schema
- Database constraints, foreign keys, indexes, and partial unique indexes
- Deterministic development/demo seed data
- Dedicated PostgreSQL integration test database
- Angular 22 frontend using TypeScript
- Angular routing with a shared application shell
- Campus Rental design tokens and responsive layout
- Local and Docker-specific Angular API proxy configuration
- Angular ESLint, Vitest, and production build tooling
- Full Angular, Express, and PostgreSQL Docker Compose development environment
- Auth0 Universal Login integration
- Auth0 JWT validation in the Express API
- External Auth0 identity resolution to local Campus Rental users
- Local `STUDENT` and `HOUSING_OFFICER` roles
- Backend role-based authorization middleware
- Authenticated current-user API
- Authenticated Angular application shell
- Role-specific Student and Housing Officer navigation
- Role-specific Student and Housing Officer dashboards
- Student Profile repository, service, controller, and API routes
- Student Profile Angular screen with retrieval, editing, validation, and error handling
- API authorization-boundary tests for Student Profile access and ownership
- Building, Room, and Bed inventory repository, service, controller, and API layers
- Housing Officer inventory management API
- Housing Officer Building → Room → Bed inventory management screen
- Inventory create, edit, activate, and deactivate operations
- Room-style handling for `SINGLE`, `DOUBLE`, `TRIPLE`, and `QUAD`
- Derived bed availability based on inventory state and active housing assignments
- Student-facing residence hall and room-style availability API
- Student housing-options view with general availability by hall and room style
- Validation and user-friendly inventory API errors
- Backend integration testing with Vitest and PostgreSQL
- Supertest API integration testing
- Consolidated backend and frontend verification commands

Housing application submission and preference saving, roommate matching, final housing assignment, lease processing, and the remaining end-to-end workflow are planned for later feature branches.

## Repository Structure

```text
/
├── docs/                       # Architecture and project documentation
├── src/
│   ├── client/                 # Angular frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/      # Shared config and frontend services
│   │   │   │   ├── layout/    # Shared authenticated application shell
│   │   │   │   └── pages/
│   │   │   │       ├── housing-inventory/
│   │   │   │       ├── housing-options/
│   │   │   │       └── student-profile/
│   │   │   └── styles.css     # Global styles and design tokens
│   │   ├── angular.json
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   ├── proxy.conf.json             # Local Angular API proxy
│   │   └── proxy.conf.docker.json      # Docker Compose API proxy
│   └── server/                 # Node.js / Express backend
│       ├── src/
│       │   ├── auth/           # Authentication and RBAC
│       │   ├── config/
│       │   ├── db/
│       │   │   ├── migrations/
│       │   │   └── seeds/
│       │   ├── modules/
│       │   │   ├── housing-inventory/
│       │   │   └── student-profile/
│       │   ├── app.ts
│       │   └── server.ts
│       ├── tests/
│       │   ├── integration/
│       │   └── setup/
│       ├── eslint.config.js
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── ops/
│   └── docker/
├── .env.example
├── .dockerignore
├── .gitignore
└── README.md
```

## Tech Stack

Campus Rental currently uses:

- **Frontend:** Angular with TypeScript
- **Backend:** Node.js with Express and TypeScript
- **Database:** PostgreSQL
- **Database Access:** `pg` PostgreSQL driver
- **Schema Management:** Explicit versioned SQL migrations
- **Authentication:** Auth0 Universal Login
- **Authorization:** Local Campus Rental role-based authorization
- **Testing:** Vitest, PostgreSQL integration tests, and Supertest
- **AI Integration:** AI-assisted roommate compatibility behind a provider abstraction
- **Electronic Signature:** DocuSign behind an electronic-signature provider abstraction
- **Containerization:** Docker and Docker Compose
- **Source Control:** Git and GitHub
- **CI/CD:** GitHub Actions

The backend follows a modular monolith architecture. Domain modules use the following general layering:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL
```

Controllers handle HTTP concerns, services contain business rules and workflow logic, and repositories contain PostgreSQL access.

Authentication identity is kept separate from Campus Rental domain information. Auth0 authenticates the user, while the local PostgreSQL `users` table determines whether that identity belongs to Campus Rental and whether the user has the `STUDENT` or `HOUSING_OFFICER` role.

## Environment Setup

Campus Rental uses a repository-level `.env` file for local development.

From the repository root, create the local file from the provided example:

```powershell
Copy-Item .env.example .env
```

Update the values in `.env` for your local environment.

The `.env` file contains local credentials and configuration and must not be committed to source control.

The current environment variables are:

```text
SERVER_PORT
CLIENT_PORT
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_HOST_PORT
POSTGRES_TEST_DB
AUTH0_DOMAIN
AUTH0_AUDIENCE
```

`AUTH0_DOMAIN` should contain the Auth0 tenant domain without `https://`.

Example:

```text
AUTH0_DOMAIN=your-tenant.us.auth0.com
```

The Campus Rental API audience is:

```text
https://api.campus-rental.local
```

The automated integration tests use a dedicated PostgreSQL test database. If `POSTGRES_TEST_DB` is omitted, the test configuration defaults to `<POSTGRES_DB>_test`.

## Auth0 Configuration

Campus Rental uses Auth0 Universal Login for authentication.

Auth0 is responsible for authenticating users and issuing access tokens. Campus Rental does not use Auth0 roles as the application authorization source. After a token is validated, the backend resolves the Auth0 subject to a local record in the PostgreSQL `users` table.

### Auth0 API

Create an Auth0 API with:

```text
Name: Campus Rental API
Identifier: https://api.campus-rental.local
Signing Algorithm: RS256
```

The API identifier must match `AUTH0_AUDIENCE`.

### Auth0 Single Page Application

Create an Auth0 Single Page Application for the Angular frontend.

The current development URLs are:

```text
Allowed Callback URLs:
http://localhost:4200

Allowed Logout URLs:
http://localhost:4200
http://localhost:4200/login

Allowed Web Origins:
http://localhost:4200
```

The Angular Auth0 configuration is located in:

```text
src/client/src/app/core/config/auth.config.ts
```

The frontend configuration contains the Auth0 domain, SPA client ID, and API audience.

Auth0 SPA client IDs and tenant domains are public application identifiers. A client secret must not be stored in the Angular application or committed to the repository.

If a different Auth0 tenant or SPA application is used, update `auth.config.ts` to match that application.

### Authentication and Authorization Flow

The current authentication flow is:

```text
Angular
   ↓
Auth0 Universal Login
   ↓
Auth0 Access Token
   ↓
Express JWT Validation
   ↓
Auth0 subject (`sub`)
   ↓
Campus Rental `users.auth_subject`
   ↓
Local Campus Rental role
   ↓
STUDENT or HOUSING_OFFICER authorization
```

A missing or invalid access token returns HTTP `401 Unauthorized`.

A valid Auth0 identity that is not registered in the local Campus Rental `users` table returns HTTP `403 Forbidden`.

## Development Auth0 Users

The development seed uses deterministic placeholder authentication subjects such as:

```text
demo|alex-morgan
demo|housing-officer
```

These placeholders allow the database seed to remain independent of a specific Auth0 tenant.

To authenticate seeded users through Auth0, create corresponding users in the Auth0 database connection and then map their Auth0 User IDs to the seeded Campus Rental records.

For the current development flow, useful demo identities are:

```text
alex.morgan@campusrental.test
housing.officer@campusrental.test
```

Keep demo passwords outside the repository.

After running the development seed, update the local authentication subjects using the Auth0 User IDs created for those accounts.

Example SQL:

```sql
UPDATE users
SET
  auth_subject = '<ALEX_AUTH0_USER_ID>',
  updated_at = NOW()
WHERE email = 'alex.morgan@campusrental.test';

UPDATE users
SET
  auth_subject = '<HOUSING_OFFICER_AUTH0_USER_ID>',
  updated_at = NOW()
WHERE email = 'housing.officer@campusrental.test';
```

An Auth0 database user ID normally begins with:

```text
auth0|
```

The Auth0 user ID is an identity identifier, not a password or access token.

The local PostgreSQL role remains the authorization source. Auth0 roles or permissions do not need to be configured for the current Campus Rental implementation.

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

### Load Development Data

From `src/server`:

```powershell
npm run db:seed
```

If Auth0 development users are being used, map their Auth0 User IDs to the seeded local users after the seed has been loaded.

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

## Frontend Local Development

Frontend commands should be run from:

```text
src/client
```

Install dependencies:

```powershell
npm install
```

Start the Angular development server:

```powershell
npm start
```

The frontend is available at:

```text
http://localhost:4200
```

During local development, Angular proxies `/health` and `/api` requests to the Express API running at:

```text
http://localhost:3000
```

The backend and PostgreSQL should therefore be running when testing authenticated frontend functionality.

### Frontend Verification

Run ESLint:

```powershell
npm run lint
```

Run the frontend unit tests once:

```powershell
npm test
```

Run the tests in watch mode during development:

```powershell
npm run test:watch
```

Run the production Angular build:

```powershell
npm run build
```

Run lint, tests, and the production build together:

```powershell
npm run verify
```

## Authentication and Application APIs

### Current User

```text
GET /api/auth/me
```

This endpoint requires a valid Auth0 access token and a matching local Campus Rental user.

Example successful response:

```json
{
  "authenticated": true,
  "user": {
    "id": "2",
    "email": "alex.morgan@campusrental.test",
    "role": "STUDENT"
  }
}
```

The Auth0 subject is used internally for identity resolution and is not returned to the Angular client.

### Student Profile

The Student Profile API is restricted to the `STUDENT` role.

Retrieve the authenticated student's profile:

```text
GET /api/student/profile
```

Update the authenticated student's profile:

```text
PUT /api/student/profile
```

The profile currently supports:

```text
Student number
First name
Last name
Gender
Academic status
Major
Anticipated graduation semester
Anticipated graduation year
```

The backend determines profile ownership from the authenticated Campus Rental user. A client-supplied `userId` is not used to choose which student profile is updated.

A Housing Officer attempting to access the Student Profile API receives HTTP `403 Forbidden`.

### Housing Officer Inventory

The Housing Inventory API is restricted to the `HOUSING_OFFICER` role.

Retrieve the complete Building → Room → Bed inventory hierarchy:

```text
GET /api/inventory
```

Create a building:

```text
POST /api/inventory/buildings
```

Update, activate, or deactivate a building:

```text
PUT /api/inventory/buildings/:buildingId
```

Create a room in a building:

```text
POST /api/inventory/buildings/:buildingId/rooms
```

Update, activate, or deactivate a room:

```text
PUT /api/inventory/rooms/:roomId
```

Create a bed in a room:

```text
POST /api/inventory/rooms/:roomId/beds
```

Update, activate, or deactivate a bed:

```text
PUT /api/inventory/beds/:bedId
```

Inventory records are normally activated or deactivated rather than deleted. This preserves inventory relationships and historical housing data.

Room styles currently support:

```text
SINGLE
DOUBLE
TRIPLE
QUAD
```

Room style is a classification used by the housing workflow. Physical room capacity is derived from the Bed records associated with the room rather than being stored separately as a capacity field.

The Housing Officer interface provides a confirmation warning when an officer attempts to add more beds than the room style normally represents. The warning is advisory and does not replace the Bed records as the physical capacity source of truth.

### Bed Availability

Bed availability is derived rather than stored as a separate status field.

A bed is considered available when:

```text
Building is active
AND Room is active
AND Bed is active
AND the Bed does not have a RESERVED or CONFIRMED Housing Assignment
```

`CANCELLED` and `SUPERSEDED` assignments do not keep a bed unavailable.

This same derived availability behavior is used by the Housing Officer inventory view and the Student housing-options summary.

### Student Housing Options

The Student housing-options API is restricted to the `STUDENT` role.

Retrieve active residence halls and general availability:

```text
GET /api/student/housing-options
```

The Student response includes:

```text
Building name
Address
Description
Total active bed count
Available bed count
Room styles
Total beds by room style
Available beds by room style
```

The Student response does not expose room numbers or bed labels.

The current Housing Preferences route uses this endpoint as a read-only housing-options view. Students can review residence halls and room-style availability, but preference submission is intentionally deferred to the housing application/preferences feature.

Students do not claim a specific room or bed from this screen.

## Health Check

The health endpoint is:

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

Authentication is not required for the health endpoint.

## Database Migrations

Campus Rental uses explicit PostgreSQL SQL migrations rather than an ORM.

Migration files are stored in:

```text
src/server/src/db/migrations
```

Migration filenames use a sequential numeric prefix and descriptive name.

Migrations are applied in filename order.

Successfully applied migrations are tracked in:

```text
schema_migrations
```

The table stores:

```text
filename
checksum
applied_at
```

Each migration runs inside a PostgreSQL transaction. If a migration fails, the transaction is rolled back and the migration is not recorded as applied.

A SHA-256 checksum is stored for every applied migration. If an already-applied migration file is modified later, the migration tooling detects the change.

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

The current domain migrations are:

```text
0001_create_users_and_student_profiles.sql
0002_create_housing_inventory.sql
0003_create_housing_workflow.sql
0004_create_roommate_matching.sql
```

Together, these migrations create the current Campus Rental domain schema for users, student profiles, housing inventory, housing applications, assignments, leases, roommate profiles, and roommate requests.

## Backend Verification

The backend includes separate commands for linting, TypeScript verification, testing, and building.

Run ESLint:

```powershell
npm run lint
```

Run production TypeScript type checking:

```powershell
npm run typecheck
```

Run the test TypeScript configuration:

```powershell
npx tsc -p tests/tsconfig.json --noEmit
```

Run the PostgreSQL and API integration test suite:

```powershell
npm test
```

Run the production TypeScript build:

```powershell
npm run build
```

Run lint, production type checking, and build together:

```powershell
npm run check
```

Run the complete backend verification sequence:

```powershell
npm run verify
```

The `verify` script runs:

```text
ESLint
Production TypeScript type checking
Test TypeScript type checking
Vitest integration tests
Production TypeScript build
```

The automated backend tests currently cover areas including:

- Database connectivity
- Migrations and schema constraints
- Housing inventory constraints
- Building → Room → Bed inventory persistence
- Supported room styles
- Inventory uniqueness and foreign-key constraints
- Restrictive inventory deletion behavior
- Derived bed availability
- Reserved and confirmed assignment availability behavior
- Cancelled assignment availability behavior
- Student housing availability summaries
- Housing Officer inventory API operations
- Inventory validation and conflict responses
- Inventory role authorization
- Housing workflow constraints
- Roommate matching constraints
- Deterministic development seed behavior
- Authenticated local-user resolution
- Student Profile retrieval and updates
- Student Profile validation
- Student Profile API role authorization
- Student ownership boundaries

The authorization tests exercise real Express routes, role middleware, controllers, services, repositories, and the PostgreSQL database while replacing the external Auth0 authentication step with deterministic test identity data.

Real Auth0 authentication is also verified manually during development using the Angular application and API.

## Continuous Integration

The repository includes a GitHub Actions backend CI workflow that installs dependencies, runs ESLint, performs TypeScript type checking, executes the PostgreSQL integration test suite, and builds the backend.

GitHub Actions are currently disabled on the university-hosted GitHub instance. The workflow is therefore validated locally using `act`, which runs the GitHub Actions workflow through Docker.

From the repository root:

```powershell
act pull_request -W .github/workflows/backend-ci.yml -j backend
```

Local workflow validation requires Docker to be running and port `5432` to be available for the temporary PostgreSQL service container.

Additional frontend CI validation is planned for the later CI and observability feature branch.

## Docker

The current Docker environment supports the Angular frontend, Express backend, and PostgreSQL database.

From the repository root, build and start all services:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml up -d --build
```

Check container status:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml ps
```

The PostgreSQL and Express containers should report healthy, and the Angular client should report as running:

```text
campus-rental-db
campus-rental-server
campus-rental-client
```

Open the Angular application at:

```text
http://localhost:4200
```

The Angular client uses a Docker-specific proxy configuration to reach the Express service through the Compose network.

The client proxies:

```text
/health
/api
```

to the backend service.

### Full Docker Refresh

When validating application or dependency changes against a freshly rebuilt development stack, use:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml down
```

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml build
```

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml up -d
```

Do not add `-v` unless the PostgreSQL data volume is intentionally being deleted.

### Database Commands Inside Docker

Check migration status:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml exec server npm run db:status
```

Apply pending migrations:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml exec server npm run db:migrate
```

Test the containerized health endpoint:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Stop the environment:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml down
```

Removing the PostgreSQL volume permanently deletes the local database data.

A full reset should only be performed intentionally:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml down -v
```

After a volume reset, migrations, seed data, and any Auth0-to-local-user mappings must be recreated.

## Development / Demo Seed Data

Campus Rental includes deterministic development data that can be loaded after all database migrations have been applied.

From `src/server`:

```powershell
npm run db:seed
```

The seed creates fictional development records across the Campus Rental domain, including:

- Users
- Student profiles
- Housing inventory
- Housing applications
- Housing assignments
- Leases
- Roommate profiles
- Roommate requests

The seed is designed to be repeatable. Running `npm run db:seed` again does not duplicate the predefined demo records.

To create a fresh development database from an empty Docker volume:

```powershell
docker compose --env-file .env -f ops/docker/docker-compose.yml down -v
docker compose --env-file .env -f ops/docker/docker-compose.yml up -d db
```

Then from `src/server`:

```powershell
npm run db:migrate
npm run db:seed
```

After a fresh seed, map any Auth0 development identities to the appropriate local Campus Rental users before testing authenticated workflows.

## Current Angular Application Behavior

The Angular application includes a public login page at:

```text
http://localhost:4200/login
```

Authenticated users are redirected through Auth0 Universal Login and then enter the shared Campus Rental application shell.

The shell loads the current local Campus Rental user using:

```text
GET /api/auth/me
```

Navigation is then adjusted using the local role.

### Student Navigation

```text
Dashboard
Housing Preferences
My Application
My Housing
Roommates
My Lease
My Profile
```

The Housing Preferences route currently displays active residence halls and general availability by room style.

This view is read-only during the housing-inventory feature. Students cannot select an exact room or bed and cannot yet save housing preferences.

The following Student workflow pages remain placeholders until their planned feature branches are implemented:

```text
My Application
My Housing
Roommates
My Lease
```

### Housing Officer Navigation

```text
Dashboard
Housing Inventory
Applications
Assignments
```

Housing Inventory is implemented as an administrative Building → Room → Bed hierarchy.

Housing Officers can:

```text
Add and edit buildings
Activate or deactivate buildings
Add and edit rooms
Activate or deactivate rooms
Add and edit beds
Activate or deactivate beds
Review derived bed availability
```

The interface uses activation/deactivation rather than destructive delete operations.

When adding beds, the interface warns the Housing Officer if the number of existing beds already meets the normal count represented by the room style. The officer can still continue because physical capacity is derived from Bed records.

The Applications and Assignments routes remain placeholders for their later feature branches.

Frontend navigation improves usability but is not treated as a security boundary. Protected backend endpoints continue to enforce authentication and role authorization independently.

## Planned Campus Rental Features

The current implementation roadmap includes:

0. Backend and Docker foundation
1. Database foundation
2. Campus Rental domain schema
3. Angular frontend foundation
4. Authentication, role-based authorization, and Student Profile
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

Authentication is handled by Auth0, while Campus Rental authorization remains in the local PostgreSQL database.

The application does not store passwords, password hashes, access tokens, or refresh tokens in PostgreSQL.

Important business rules and authorization boundaries are enforced by the backend and PostgreSQL rather than relying only on frontend behavior.

Student Profile ownership is derived from the authenticated local Campus Rental user rather than from a client-supplied user ID.

Housing inventory follows a Building → Room → Bed hierarchy.

Buildings, rooms, and beds are normally activated or deactivated rather than physically deleted so historical housing data can remain intact.

Room style is stored as `SINGLE`, `DOUBLE`, `TRIPLE`, or `QUAD`, but physical room capacity is derived from the number of Bed records rather than stored as a separate capacity field.

Bed availability is derived from active inventory and active Housing Assignments instead of storing duplicate availability state directly on Bed records.

A bed is unavailable when the building, room, or bed is inactive, or when the bed has an active `RESERVED` or `CONFIRMED` Housing Assignment.

Students review general residence hall and room-style availability rather than exact room or bed inventory.

Students will submit residence hall and room-style preferences rather than selecting a specific room or bed. Housing Officers will make final assignments.

Roommate matching will support both direct mutual roommate requests and opt-in AI-assisted recommendations. AI recommendations will remain advisory and will not automatically pair students or make housing assignments.

External integrations such as DocuSign and the AI compatibility provider will be placed behind provider abstractions so the system can use deterministic mock implementations during testing and demonstrations.

## AI Use

Generative AI is being used during development to assist with planning, design discussion, implementation guidance, troubleshooting, code review, testing ideas, and documentation.

AI-generated suggestions are reviewed before being incorporated into the project. Generated code and design recommendations may be modified, rejected, or replaced when they do not fit the project requirements or established architecture.

The AI-assisted roommate matching feature planned for Campus Rental is separate from the use of generative AI as a software-development tool.

---

*This repository is for academic use as part of Penn State University's SWENG 861 – Software Construction course.*