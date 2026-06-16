# FinShield Insurance Management Portal

> A full-stack Insurance Management Portal built with Node.js, Express, MySQL, and vanilla JavaScript — containerized with Docker and designed for AWS deployment.

---

## Quick Start (Local)

```bash
# Clone and run
docker compose up --build

# Open in browser
open http://localhost
```

### Default Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Staff | `staff` | `staff123` |

---

## Architecture

```
Internet → Nginx (:80) → Express API (:3000) → MySQL (:3306)
           [Reverse Proxy]  [Backend]            [Database]
                    ─── All inside Docker Compose ───
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Chart.js |
| Backend | Node.js + Express.js |
| Database | MySQL 8.0 |
| Containerization | Docker + Docker Compose |
| Web Server | Nginx (reverse proxy) |
| Authentication | JWT + bcrypt |
| Deployment | AWS EC2, VPC, Security Groups |

## Features

- **Dashboard** — Real-time KPI cards + Chart.js visualizations (claims by type, policies by region)
- **Policy Management** — Full CRUD with 18 seed policies across 5 types and 6 Indian regions
- **Claims Processing** — Submit, review, approve/reject workflow with 12 seed claims
- **Reports & Analytics** — Revenue tracking, regional breakdown, claims analytics
- **User Management** — Admin panel for user roles and access control
- **Audit Log** — Complete activity trail for compliance
- **System Monitor** — Live CPU, memory, and load metrics
- **Pricing Calculator** — AWS infrastructure cost estimates (₹ INR)
- **Role-Based Access Control** — 3-tier (Staff/Manager/Admin) enforced on every API endpoint

## API Endpoints

| Group | Count | Routes |
|---|---|---|
| Auth | 3 | Login, Register, Profile |
| Policies | 5 | List, Detail, Create, Update, Delete |
| Claims | 5 | List, Detail, Submit, Update, Assign |
| Dashboard | 2 | Stats, Charts |
| Reports | 2 | Executive, Claims Analytics |
| Users | 3 | List, Role Change, Deactivate |
| System | 3 | Health, Metrics, Audit Log |

## Project Structure

```
AWS/
├── TASK.md              # Software Requirements Document
├── DEPLOY.md            # Deployment & Testing Guide
├── AWS.md               # AWS Deployment Learning Guide
├── README.md            # This file
├── docker-compose.yml   # Multi-container orchestration
├── nginx/               # Nginx reverse proxy config
├── backend/             # Express.js API server
│   ├── routes/          # API routes (auth, policies, claims, etc.)
│   ├── middleware/      # JWT auth + RBAC middleware
│   ├── db/              # Schema + seed SQL
│   └── scripts/         # Automation (backup, deploy, monitor)
├── frontend/            # Vanilla HTML/CSS/JS SPA
│   ├── css/             # Dark theme styles
│   └── js/              # Modular JavaScript
└── docs/                # Architecture diagrams + pricing
```

## Documentation

| File | Purpose |
|---|---|
| [TASK.md](TASK.md) | Software Requirements Document (SRD) |
| [DEPLOY.md](DEPLOY.md) | Step-by-step deployment & testing guide |
| [AWS.md](AWS.md) | AWS deployment learning walkthrough |

## Testing

```bash
# Run Jest tests
cd backend && npm test

# API test (after docker compose up)
curl http://localhost/api/health
```

---

**Built for demonstrating cloud engineering skills through a domain-relevant Insurance Technology application.**
