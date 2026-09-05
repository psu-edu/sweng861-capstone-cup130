# SWENG 861: Campus Rental (Housing)

**Author:** Charles Patterson  
**Course:** SWENG 861 – Software Construction  
**Program:** Penn State University - Master of Software Engineering

## Project Overview

Campus Rental is a full-stack housing management application designed to support university dormitory room selection, lease management, and roommate matching. Housing officers will manage room and bed availability, while students will be able to view available housing, select a unit, and complete the leasing process. The application will support a "Secure Room" workflow that reserves bed inventory, generates a lease document, and integrates with DocuSign for electronic signatures.

The application will be developed throughout SWENG 861 as the Course Capstone Project.

## 📂 Repository Structure

```text
/
├── .github/
│   └── workflows/          # [DevOps] CI/CD Pipelines (Build, Test, Deploy)
├── docs/                   # [Documentation] Architecture diagrams, Proposal
├── src/
│   ├── client/             # [Frontend] React / Vue / Mobile App source code
│   └── server/             # [Backend] API / Microservices source code
├── ops/                    # [SRE & Infrastructure]
│   ├── docker/             # Docker Compose & Container configs
│   └── observability/      # [Dashboard] Prometheus.yml, Grafana Dashboards, Screenshots
├── tests/                  # End-to-End (E2E) Test Suites
└── README.md               # The Main Project Documentation
```

| Folder | Purpose |
| :--- | :--- |
| **`.github/workflows`** | **DevOps:** Place your CI/CD YAML files here (e.g., `ci.yml`). |
| **`src/client`** | **Frontend:** Your Web or Mobile application code (React, Vue, Flutter). |
| **`src/server`** | **Backend:** Your API and Database logic (Node, Python, Java). |
| **`ops/docker`** | **Infrastructure:** Dockerfiles and `docker-compose.yml` to run the stack. |
| **`ops/observability`** | **SRE/Dashboard:** Prometheus configs, Grafana JSON exports, or screenshots of your monitoring dashboard. |
| **`docs/`** | **Design:** Your Week 2 Proposal and Architecture diagrams. |

## Tech Stack

The planned technology stack for the project includes:

* **Frontend:** TBD
* **Backend:** Node.js with Express
* **Database:** TBD
* **Services:** Inventory Service, Application Service, Lease Service
* **External Integration:** DocuSign API
* **Containerization:** Docker and Docker Compose
* **Source Control:** Git and GitHub

The technology stack will be refined as the project architecture and requirements are finalized.


## 🚀 How to Start

The application is currently in the initial project setup phase. Local and Docker execution instructions will be updated as the frontend and backend components are implemented.

### Local Development

```bash
# Installation and startup commands will be added as development begins.
```

### Docker

The completed application will support containerized local execution using Docker Compose.

```bash
# Docker Compose startup instructions will be added as containers are implemented.
```

## AI Use

Generative AI was used to assist with project documentation and project planning.

---

*This repository is for academic use as part of Penn State University's SWENG 861 – Software Construction course.*
