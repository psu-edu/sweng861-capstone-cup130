# SWENG 861: Campus Rental (Housing)

**Author:** Charles Patterson  
**Course:** SWENG 861 – Software Construction  
**Program:** Penn State University - Master of Software Engineering

## Project Overview

Campus Rental is a full-stack university housing application being developed for the SWENG 861 Course Capstone Project.

The application is designed around two primary users: Students and Housing Officers. Students can manage a housing application, submit residence hall and room-style preferences, request a known roommate or participate in AI-assisted roommate matching, and track the status of their housing workflow. Later workflow steps will allow Students to receive a housing assignment and complete the lease-signing process.

Housing Officers manage residence hall inventory, review student applications and housing preferences, maintain private application notes, approve applications, and will eventually use roommate information to make final room and bed assignments and manage the leasing workflow.

Students do not directly claim a specific room or bed. Instead, they submit housing preferences and Housing Officers make the final assignment based on available inventory and roommate information. Database constraints and backend transactions protect the assignment process from conflicting bed reservations.

AI-assisted roommate matching provides ranked, explainable roommate recommendations based primarily on structured lifestyle preferences with a smaller semantic free-text component. Recommendations are advisory and never automatically pair students or make housing assignments. Students must still send and accept a roommate request before a roommate pair is established.

## Project Status

The project currently includes the backend, database, Angular frontend, authentication and authorization foundation, Student Profile workflow, housing inventory management, housing applications and preferences, direct roommate requests, and AI-assisted roommate matching.

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
- Student housing preference selection by academic year, residence hall, and room style
- Student housing application draft creation and editing
- Housing application submission and status tracking
- Student application cancellation before housing assignment
- Housing Officer application list and review workflow
- Housing Officer-only internal application notes
- Housing Officer application approval and cancellation
- Application approval and cancellation audit information
- Academic-year selection and backend validation
- Backend enforcement of housing application lifecycle rules
- Protection against multiple unsecured housing applications for the same Student
- Student API responses that exclude Housing Officer-only notes and audit information
- Roommate Profile repository, service, controller, and API routes
- Twelve structured roommate lifestyle preferences with three optional weighted priorities
- Optional About Me and Looking For roommate profile text
- Student opt-in and opt-out for AI-assisted roommate discovery
- Same-gender roommate eligibility enforced by the backend
- Direct Student roommate search by name or student number
- Direct roommate request lifecycle with pending, accepted, declined, and cancelled states
- Mutual consent required before a roommate request becomes accepted
- Accepted direct roommate requests take priority over AI-assisted discovery for the same academic year
- AI compatibility provider abstraction with deterministic mock and remote OpenAI-compatible implementations
- Deterministic structured roommate compatibility scoring
- AI-assisted semantic compatibility analysis and concise explanations
- Combined compatibility percentage, category, strengths, and notable differences
- Remote AI fallback to the deterministic provider when the configured service is unavailable
- Candidate pre-ranking that limits AI analysis to the five strongest structured matches
- Gender and protected or sensitive characteristics excluded from AI compatibility scoring
- Roommate Matching, Roommate Profile, and Roommate Requests Angular screens
- AI recommendations remain advisory and never automatically create roommate requests or housing assignments
- Validation and user-friendly application, inventory, and roommate API errors
- Backend integration testing with Vitest and PostgreSQL
- Supertest API integration testing
- Unit testing for compatibility scoring and AI providers
- Consolidated backend and frontend verification commands

Final housing assignment, lease processing, and the remaining end-to-end workflow are planned for later feature branches.

## Repository Structure

The repository is organized so frontend, backend, infrastructure, project documentation, and automated tests remain clearly separated.

```text
/
├── .github/
│   └── workflows/                    # GitHub Actions CI workflow definitions
│
├── docs/                             # Capstone planning, architecture, UI, and roadmap documents
│
├── ops/                              # Operational and deployment-related configuration
│   └── docker/                       # Dockerfiles and Docker Compose configuration
│
├── src/
│   ├── client/                       # Angular frontend application
│   │   ├── public/                   # Static frontend assets
│   │   │
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/            # Frontend configuration and shared application services
│   │   │   │   │   ├── config/      # Auth0 and other shared frontend configuration
│   │   │   │   │   └── services/    # Typed API clients and shared user/application services
│   │   │   │   │
│   │   │   │   ├── layout/          # Shared authenticated application layout
│   │   │   │   │   └── app-shell/   # Navigation, user information, logout, and page shell
│   │   │   │   │
│   │   │   │   ├── pages/           # Route-level Angular screens
│   │   │   │   │   ├── dashboard/              # Role-aware Student and Housing Officer dashboard
│   │   │   │   │   ├── housing-applications/   # Housing Officer application review and approval
│   │   │   │   │   ├── housing-inventory/      # Building → Room → Bed inventory administration
│   │   │   │   │   ├── housing-options/        # Student housing availability and preference selection
│   │   │   │   │   ├── login/                  # Public login and Auth0 entry page
│   │   │   │   │   ├── placeholder/            # Temporary screens for future roadmap features
│   │   │   │   │   ├── roommate-matching/      # AI-assisted roommate recommendations
│   │   │   │   │   ├── roommate-profile/       # Roommate lifestyle profile and AI opt-in
│   │   │   │   │   ├── roommate-requests/      # Direct roommate search and request management
│   │   │   │   │   ├── student-application/    # Student application status and lifecycle view
│   │   │   │   │   └── student-profile/        # Student Profile view and editing
│   │   │   │   │
│   │   │   │   ├── app.config.ts    # Angular application providers and Auth0 setup
│   │   │   │   ├── app.routes.ts    # Application route definitions
│   │   │   │   └── app.ts           # Angular root component
│   │   │   │
│   │   │   └── styles.css            # Global styles and Campus Rental design tokens
│   │   │
│   │   ├── angular.json              # Angular workspace and build configuration
│   │   ├── eslint.config.js          # Frontend ESLint configuration
│   │   ├── package.json              # Frontend dependencies and npm scripts
│   │   ├── proxy.conf.json           # Local Angular-to-Express development proxy
│   │   ├── proxy.conf.docker.json    # Docker Compose Angular-to-Express proxy
│   │   ├── tsconfig.app.json         # Angular application TypeScript configuration
│   │   ├── tsconfig.json             # Shared frontend TypeScript configuration
│   │   └── tsconfig.spec.json        # Frontend test TypeScript configuration
│   │
│   └── server/                       # Node.js / Express backend application
│       ├── src/
│       │   ├── auth/                 # Auth0 JWT validation, local identity resolution, and RBAC
│       │   │
│       │   ├── config/               # Environment-variable loading and validation
│       │   │
│       │   ├── db/                   # PostgreSQL connection, migration, and seed infrastructure
│       │   │   ├── migrations/       # Versioned immutable SQL schema migrations
│       │   │   └── seeds/            # Deterministic development/demo seed definitions
│       │   │
│       │   ├── modules/              # Domain-focused backend modules
│       │   │   ├── housing-application/  # Application lifecycle, preferences, approval, and notes
│       │   │   ├── housing-inventory/    # Building, Room, Bed, availability, and housing options
│       │   │   ├── roommate-matching/    # Direct roommate requests and AI-assisted matching
│       │   │   └── student-profile/      # Student Profile retrieval and editing
│       │   │
│       │   ├── app.ts                # Express application and route registration
│       │   └── server.ts             # Server startup and database connectivity check
│       │
│       ├── tests/
│       │   ├── integration/          # PostgreSQL and Express API integration tests
│       │   ├── setup/                # Shared Vitest/test-database setup and utilities
│       │   └── unit/                 # Compatibility-scoring and AI-provider unit tests
│       │
│       ├── eslint.config.js          # Backend ESLint configuration
│       ├── package.json              # Backend dependencies and npm scripts
│       ├── tsconfig.json             # Backend TypeScript configuration
│       └── vitest.config.ts          # Backend Vitest configuration
│
├── .dockerignore                     # Files excluded from Docker build contexts
├── .env.example                      # Template for required local environment variables
├── .gitignore                        # Files excluded from Git source control
└── README.md                         # Project setup, architecture, workflows, and current status
```

The backend `modules` directory follows the modular-monolith approach. Each domain module owns its controller, service, repository, routes, and related types rather than placing all controllers or repositories into application-wide folders.

The Angular `pages` directory contains route-level screens, while reusable API and application-state logic is kept under `core`. Placeholder pages are intentionally limited to workflow areas that have not yet reached their feature branch.

## Tech Stack

Campus Rental currently uses:

- **Frontend:** Angular with TypeScript
- **Backend:** Node.js with Express and TypeScript
- **Database:** PostgreSQL
- **Database Access:** `pg` PostgreSQL driver
- **Schema Management:** Explicit versioned SQL migrations
- **Authentication:** Auth0 Universal Login
- **Authorization:** Local Campus Rental role-based authorization
- **Testing:** Vitest, PostgreSQL integration tests, Supertest, and Angular testing
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
AI_PROVIDER
AI_BASE_URL
AI_MODEL
AI_API_KEY
AI_MAX_TOKENS
AI_TIMEOUT_MS
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

### AI Roommate Matching Configuration

Campus Rental supports a deterministic mock compatibility provider and a remote OpenAI-compatible AI provider.

For normal development, automated testing, and a repeatable demonstration:

```text
AI_PROVIDER=mock
```

The mock provider is deterministic and does not require an external service or API key.

To use a configured remote provider:

```text
AI_PROVIDER=remote
AI_BASE_URL=<OpenAI-compatible base URL>
AI_MODEL=<model name>
AI_API_KEY=<local API key>
AI_MAX_TOKENS=200
AI_TIMEOUT_MS=20000
```

The current Penn State DRIFT endpoint and model are represented in `.env.example`. A real API key belongs only in the local `.env` file and must never be committed.

When the remote provider is selected, Campus Rental uses the configured OpenAI-compatible `/v1/chat/completions` endpoint. If the remote provider cannot be used or a request fails, the application falls back to the deterministic provider so the roommate workflow can continue.

The course-provided DRIFT endpoint currently uses HTTP rather than HTTPS. This means credentials and profile text sent to that endpoint are not protected by TLS during transport. Campus Rental treats this as a limitation of the provided course service rather than adding unrelated infrastructure to the project.

The AI provider receives only the About Me and Looking For text needed for semantic analysis. Gender, Student number, academic information, and the structured roommate preference values are not sent to the AI provider.

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

Useful demo identities include:

```text
alex.morgan@campusrental.test
jordan.lee@campusrental.test
taylor.brooks@campusrental.test
casey.nguyen@campusrental.test
housing.officer@campusrental.test
```

Alex Morgan and Jordan Lee are seeded as male Students. Taylor Brooks and Casey Nguyen are seeded as female Students. These accounts provide two same-gender Student pairs for manually verifying roommate eligibility and mutual roommate requests.

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

The other seeded Student identities can be mapped using the same pattern.

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

Angular production builds currently report bundle and component-style budget warnings. These warnings do not fail the build. They are being retained for later frontend hardening rather than increasing the configured budgets simply to hide them.

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

Retrieve the authenticated Student's profile:

```text
GET /api/student/profile
```

Update the authenticated Student's profile:

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

The backend determines profile ownership from the authenticated Campus Rental user. A client-supplied `userId` is not used to choose which Student Profile is updated.

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

The Housing Preferences screen uses this endpoint to display general availability while allowing the Student to choose a preferred residence hall and room style.

Availability is informational. Selecting a preference does not reserve a bed or guarantee a placement.

Students do not select an exact room or bed from this screen.

### Student Housing Applications

The Student housing application API is restricted to the `STUDENT` role and operates on the currently authenticated Student.

Retrieve the Student's housing applications:

```text
GET /api/student/applications
```

Create a new draft application:

```text
POST /api/student/applications
```

Update an existing draft application:

```text
PUT /api/student/applications/:applicationId
```

Submit a draft application:

```text
POST /api/student/applications/:applicationId/submit
```

Cancel an eligible application:

```text
POST /api/student/applications/:applicationId/cancel
```

A housing application contains the Student's:

```text
Academic year
Preferred residence hall
Preferred room style
Application status
Lifecycle timestamps
```

Supported application statuses are:

```text
DRAFT
SUBMITTED
APPROVED
HOUSING_ASSIGNED
COMPLETED
CANCELLED
```

Students can modify their housing preferences while the application remains in `DRAFT`.

After the application is submitted, the housing preferences become read-only. A Housing Officer reviews the submitted application and can move it to `APPROVED`.

The current academic-year selector provides the current academic year and the next two academic years. The backend independently validates the submitted academic year so the Angular interface is not the only enforcement point.

A Student may have only one unsecured application at a time. Applications in the following states block creation of another unsecured application:

```text
DRAFT
SUBMITTED
APPROVED
```

The database also protects this rule with a partial unique index.

Student and Housing Officer cancellation is allowed during the pre-assignment portion of the workflow. Simple cancellation is not used once an application reaches `HOUSING_ASSIGNED`, because later housing-assignment processing must maintain assignment consistency.

Housing Officer-only notes and officer audit identifiers are intentionally omitted from Student application responses.

### Housing Officer Application Review

The Housing Officer application API is restricted to the `HOUSING_OFFICER` role.

Retrieve housing applications:

```text
GET /api/applications
```

Retrieve a specific housing application:

```text
GET /api/applications/:applicationId
```

Update internal Housing Officer notes:

```text
PUT /api/applications/:applicationId/notes
```

Approve a submitted application:

```text
POST /api/applications/:applicationId/approve
```

Cancel an eligible application:

```text
POST /api/applications/:applicationId/cancel
```

The Housing Officer application view includes Student context needed to review an application, including:

```text
Student number
Student name
Gender
Academic status
Major
Anticipated graduation
Academic year
Preferred residence hall
Preferred room style
Application status
Lifecycle information
Internal Housing Officer notes
```

Housing Officer notes are private administrative information and are not included in Student-facing API responses.

Internal notes are limited to 5,000 characters. The limit is enforced by both the Angular interface and backend service.

Only a `SUBMITTED` application can be approved.

Approval records both the approval timestamp and the Housing Officer responsible for the approval.

Cancellation records the cancellation timestamp and the user responsible for the cancellation.

### Student Roommate Matching

The roommate-matching API is restricted to the `STUDENT` role.

Retrieve the authenticated Student's roommate profile:

```text
GET /api/student/roommates/profile
```

Create or update the authenticated Student's roommate profile:

```text
PUT /api/student/roommates/profile
```

Search for eligible Students by name or student number:

```text
GET /api/student/roommates/search?q=<search>
```

Retrieve roommate requests involving the authenticated Student:

```text
GET /api/student/roommates/requests
```

Send a roommate request:

```text
POST /api/student/roommates/requests
```

Accept, decline, or cancel a request:

```text
POST /api/student/roommates/requests/:requestId/accept
POST /api/student/roommates/requests/:requestId/decline
POST /api/student/roommates/requests/:requestId/cancel
```

Retrieve AI-assisted recommendations for an academic year:

```text
GET /api/student/roommates/recommendations?academicYear=YYYY-YYYY
```

Direct roommate requests do not require AI opt-in. They do require both Students to satisfy the roommate eligibility rules.

Campus Rental currently requires both Students to have the same configured gender, either `MALE` or `FEMALE`. A Student whose gender remains `UNSPECIFIED` must update the Student Profile before participating in roommate matching.

Gender is a deterministic eligibility rule only. It is not included in the compatibility score, sent to the AI provider, or returned as part of the Student roommate recommendation data. The backend also rechecks eligibility when a pending request is accepted so changes made after the request was created cannot bypass the rule.

A direct request begins as `PENDING`. The requested Student may accept or decline it, while the requesting Student may cancel a pending outgoing request. An accepted request cannot be cancelled through the normal pending-request cancellation workflow.

AI-assisted discovery requires a saved roommate profile and explicit opt-in. The roommate profile contains twelve structured lifestyle preferences, up to three priority preferences, and optional About Me and Looking For text.

Structured preferences provide 80% of the final compatibility score. Semantic analysis of the free-text profile fields provides the remaining 20%. Structured compatibility is calculated locally before any remote AI call is made.

Campus Rental first ranks all eligible candidates using the structured score. Only the five strongest candidates continue to semantic AI analysis, which keeps the remote-provider workload small and predictable.

Protected and sensitive characteristics are not part of the compatibility scoring criteria. The semantic-analysis prompt also instructs the remote provider not to infer, score, or mention protected or sensitive traits.

Recommendations include:

```text
Candidate name
Academic context
Compatibility percentage
Compatibility category
Major compatibility strengths
Notable differences
Short compatibility explanation
```

Viewing a recommendation does not create a roommate request. A Student must explicitly send a request, and the other Student must accept it before the request becomes an accepted roommate relationship.

An accepted direct roommate request takes priority over AI-assisted recommendations for the same academic year.

Roommate matching does not create a housing assignment. Final room and bed placement remains part of the later Housing Officer assignment workflow.

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
Vitest unit and integration tests
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
- Roommate Profile creation, updating, validation, and opt-out behavior
- Same-gender roommate eligibility and unspecified-gender rejection
- Direct roommate search privacy
- Roommate request creation, acceptance, decline, and cancellation
- Mutual-consent and request-ownership boundaries
- Roommate request role authorization
- Deterministic structured compatibility scoring
- AI provider mock behavior
- Generic remote AI provider behavior
- AI provider fallback behavior
- AI recommendation ranking
- AI candidate-limit behavior
- AI recommendation privacy safeguards
- Accepted direct-request precedence
- Verification that AI recommendations do not automatically create roommate requests
- Deterministic development seed behavior
- Authenticated local-user resolution
- Student Profile retrieval and updates
- Student Profile validation
- Student Profile API role authorization
- Student ownership boundaries
- Student housing application creation
- Draft housing application updates
- Housing application submission
- Housing application cancellation
- Academic-year validation
- Residence hall and room-style preference validation
- One-unsecured-application enforcement
- Housing application lifecycle restrictions
- Student application ownership boundaries
- Student application response privacy
- Housing Officer application retrieval
- Housing Officer internal note persistence
- Housing Officer application approval
- Housing Officer application cancellation
- Application approval and cancellation audit data
- Student and Housing Officer application role authorization

The authorization tests exercise real Express routes, role middleware, controllers, services, repositories, and the PostgreSQL database while replacing the external Auth0 authentication step with deterministic test identity data.

Real Auth0 authentication is also verified manually during development using the Angular application and API.

The complete roommate workflow has also been manually verified through the Angular application using separate Student Auth0 identities. The manual workflow covers same-gender eligibility, direct request creation and cancellation, AI-assisted discovery, conversion of a recommendation into a pending request, mutual acceptance, accepted-request precedence, and confirmation that roommate matching does not automatically create a housing assignment.

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

AI provider configuration is passed to the server container through the repository-level `.env` file. The default configuration uses the deterministic mock provider unless `AI_PROVIDER=remote` is explicitly selected.

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

The seeded roommate data includes Alex Morgan and Jordan Lee as male Students and Taylor Brooks and Casey Nguyen as female Students. This provides predictable same-gender eligibility data for development and demonstrations.

The seed includes a pending Alex → Jordan roommate request and an accepted Taylor → Casey roommate request for the seeded academic year.

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

Frontend navigation improves usability but is not treated as a security boundary. Protected backend endpoints independently enforce authentication, local user resolution, and role authorization.

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

#### Housing Preferences

The Housing Preferences screen displays active residence halls and general room-style availability.

Students choose:

```text
Academic year
Preferred residence hall
Preferred room style
```

The academic-year field is presented as a controlled list containing the current academic year and the next two academic years.

Saving preferences creates or updates a `DRAFT` housing application.

Before submission, the Student receives a confirmation view showing:

```text
Residence hall
Room style
Academic year
Roommate option
```

The roommate option indicates that roommate selection is completed through the separate Roommates workflow.

Students may continue editing a draft before submission.

After submission, the preference fields become read-only.

Housing preferences do not reserve a room or bed and do not guarantee placement.

#### My Application

The My Application screen displays the Student's current housing application and application history.

The screen shows information including:

```text
Application status
Academic year
Preferred residence hall
Preferred room style
Submitted date
Approved date
Housing-assigned date
Completed date
Cancelled date
Next workflow step
```

Students can cancel applications that remain in an eligible pre-assignment state.

When an application is approved, the Student can continue from the application page to the Roommates workflow.

Housing Officer internal notes are intentionally not displayed to Students.

#### Roommates

The Roommates workflow provides two clearly separated paths.

Students who already know who they want to live with can search by Student name or Student number and send a direct roommate request. Direct requests do not require the Student to opt into AI-assisted discovery.

Incoming requests can be accepted or declined. Pending outgoing requests can be cancelled. A roommate request does not become accepted until the requested Student explicitly agrees.

Students may also create a Roommate Profile and opt into AI-assisted discovery. The profile includes:

```text
Sleep schedule
Wake schedule
Cleanliness
Study environment
Noise tolerance
Social preference
Guest frequency
Typical room use
Shared belongings preference
Temperature preference
Communication style
Conflict-resolution preference
Up to three top priorities
About Me
Looking For
```

The main Roommate Matching screen allows an opted-in Student to request ranked recommendations for an academic year.

AI-assisted recommendation cards display:

```text
Student name
Academic context
Compatibility percentage
Compatibility category
Major compatibility strengths
Notable differences
Compatibility explanation
Send Roommate Request action
```

The recommendation process uses deterministic eligibility filtering before compatibility scoring. Students must have Student Profile gender set to `MALE` or `FEMALE`, and roommate candidates must have the same configured gender.

Gender is not displayed as part of a recommendation and does not affect the compatibility score.

AI-assisted recommendations are advisory. Viewing a recommendation does not automatically create a roommate request, establish a roommate pair, or make a housing assignment.

Selecting `Send Roommate Request` converts the Student's decision into the same mutual-consent request workflow used for direct roommate requests.

Once an accepted direct roommate request exists for an academic year, that request takes priority and normal AI-assisted discovery is no longer offered for that housing cycle.

#### Student Placeholder Routes

The following Student workflow areas remain placeholders until their planned feature branches are implemented:

```text
My Housing
My Lease
```

### Housing Officer Navigation

```text
Dashboard
Housing Inventory
Applications
Assignments
```

#### Housing Inventory

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

#### Applications

The Applications screen allows Housing Officers to review Student housing applications.

The Housing Officer can:

```text
View the application list
Review Student Profile context
Review housing preferences
View application status
Maintain private internal notes
Approve submitted applications
Cancel eligible pre-assignment applications
```

Housing Officer notes remain private and are not exposed through Student APIs or Student pages.

#### Housing Officer Placeholder Routes

The following Housing Officer workflow area remains a placeholder until its planned feature branch is implemented:

```text
Assignments
```

## Housing Application Workflow

The application lifecycle is:

```text
DRAFT
  ↓
SUBMITTED
  ↓
APPROVED
  ↓
HOUSING_ASSIGNED
  ↓
COMPLETED
```

`CANCELLED` is available where appropriate before the later assignment and completion workflows take control.

The currently implemented housing-application workflow covers:

```text
Student creates a DRAFT application
        ↓
Student selects housing preferences
        ↓
Student reviews and submits the application
        ↓
Application becomes SUBMITTED
        ↓
Housing Officer reviews the application
        ↓
Housing Officer can save private notes
        ↓
Housing Officer approves the application
        ↓
Application becomes APPROVED
        ↓
Student can review roommate options
```

The Roommates workflow operates alongside the approved housing application and establishes roommate consent without changing the application to `HOUSING_ASSIGNED`.

The later `HOUSING_ASSIGNED` and `COMPLETED` transitions belong to the housing-assignment and lease feature branches rather than being simulated in the current application workflow.

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

Features 0 through 7 are currently represented in the implementation.

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

Students submit residence hall and room-style preferences rather than selecting a specific room or bed. Housing Officers make final assignments.

Student housing preferences remain editable while the application is in `DRAFT` and become read-only after submission.

The backend and database prevent a Student from maintaining multiple unsecured housing applications at the same time.

Housing Officer notes are private administrative information and are excluded from Student-facing application responses.

Application approval and cancellation maintain actor and timestamp information so administrative actions remain traceable.

Roommate matching supports both direct mutual roommate requests and opt-in AI-assisted recommendations.

Roommate eligibility is deterministic and separate from compatibility scoring. Campus Rental currently requires same-gender roommate eligibility, while Students with `UNSPECIFIED` gender must update their Student Profile before using roommate matching.

Gender is not part of AI compatibility scoring and is not sent to the AI provider.

AI-assisted compatibility uses an 80% deterministic structured score and a 20% semantic free-text score. Structured compatibility is calculated for all eligible candidates before the strongest five candidates continue to semantic analysis.

AI recommendations remain advisory. They do not automatically pair Students, create housing assignments, or replace mutual consent.

Accepted direct roommate requests take priority over AI-assisted discovery for the same academic year.

The AI compatibility provider is isolated behind a provider abstraction. The implementation supports a deterministic mock provider, a generic remote OpenAI-compatible provider, and deterministic fallback behavior when the remote provider is unavailable.

DocuSign will follow a similar provider-abstraction pattern during the later lease-workflow branch so the external integration does not become tightly coupled to the Campus Rental domain model.

## AI Use

Generative AI is being used during development to assist with planning, design discussion, implementation guidance, troubleshooting, code review, testing ideas, and documentation.

AI-generated suggestions are reviewed before being incorporated into the project. Generated code and design recommendations may be modified, rejected, or replaced when they do not fit the project requirements or established architecture.

The AI-assisted roommate matching feature implemented in Campus Rental is separate from the use of generative AI as a software-development tool. The application feature uses an explicit provider abstraction, deterministic structured scoring, constrained semantic analysis, privacy safeguards, and fallback behavior so the housing workflow does not depend entirely on a generative AI response.

---

*This repository is for academic use as part of Penn State University's SWENG 861 – Software Construction course.*