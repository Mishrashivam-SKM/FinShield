# FinShield Insurance Management Portal — Software Requirements Document (SRD)

---

## 1. Project Overview

| Field | Detail |
|---|---|
| **Project Name** | FinShield Insurance Operations Cloud |
| **Domain** | Insurance Technology & Risk Management |
| **Product** | Insurance Management Portal |
| **Scope** | Small-scale web application demonstrating cloud infrastructure concepts on AWS |
| **Deployment Target** | AWS (EC2, VPC, RDS/MariaDB, Docker) |

### 1.1 Objective

Build and deploy an **Insurance Management Portal** that provides:
- Centralized policy & claims management
- Role-based dashboards for Admins, Managers, and Staff
- Reporting & analytics with real-time KPIs
- Infrastructure pricing estimates
- Full AWS deployment demonstrating compute, networking, storage, monitoring, and automation

### 1.2 What This Is NOT

- Not a production-grade SaaS platform
- Not a payment-processing or real-underwriting system
- Focus is on **demonstrating cloud engineering skills** through a domain-relevant application

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (vanilla), JavaScript (vanilla) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8.0 / MariaDB 10.x |
| **Containerization** | Docker + Docker Compose |
| **Web Server / Reverse Proxy** | Nginx |
| **OS** | Ubuntu 22.04 LTS (EC2) |
| **Cloud Provider** | AWS (EC2, VPC, Security Groups, S3 optional) |
| **Monitoring** | htop, vmstat, custom shell scripts, app-level health endpoints |
| **Automation** | Bash shell scripts, cron jobs |
| **Version Control** | Git + GitHub |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────┐
│                   INTERNET                      │
│                      │                          │
│              ┌───────▼────────┐                 │
│              │   Nginx :80    │  (Reverse Proxy)│
│              └───────┬────────┘                 │
│                      │                          │
│              ┌───────▼────────┐                 │
│              │  Express :3000 │  (API Server)   │
│              └───────┬────────┘                 │
│                      │                          │
│              ┌───────▼────────┐                 │
│              │  MySQL :3306   │  (Database)     │
│              └────────────────┘                 │
│                                                 │
│         All inside Docker Compose               │
│         Running on AWS EC2 (Ubuntu)             │
│         Inside a custom VPC                     │
└─────────────────────────────────────────────────┘
```

---

## 4. Database Design

### 4.1 Tables

#### `users`
| Column | Type | Constraints |
|---|---|---|
| id | INT | PK, AUTO_INCREMENT |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | UNIQUE |
| role | ENUM('admin','manager','staff') | DEFAULT 'staff' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `policies`
| Column | Type | Constraints |
|---|---|---|
| id | INT | PK, AUTO_INCREMENT |
| policy_number | VARCHAR(20) | UNIQUE, NOT NULL |
| holder_name | VARCHAR(100) | NOT NULL |
| holder_email | VARCHAR(100) | |
| policy_type | ENUM('health','auto','life','property','business') | NOT NULL |
| premium_amount | DECIMAL(12,2) | NOT NULL |
| coverage_amount | DECIMAL(14,2) | NOT NULL |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |
| status | ENUM('active','expired','cancelled','pending') | DEFAULT 'pending' |
| region | VARCHAR(50) | |
| created_by | INT | FK → users.id |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `claims`
| Column | Type | Constraints |
|---|---|---|
| id | INT | PK, AUTO_INCREMENT |
| claim_number | VARCHAR(20) | UNIQUE, NOT NULL |
| policy_id | INT | FK → policies.id |
| claimant_name | VARCHAR(100) | NOT NULL |
| claim_type | ENUM('accident','theft','medical','natural_disaster','other') | NOT NULL |
| description | TEXT | |
| claim_amount | DECIMAL(12,2) | NOT NULL |
| status | ENUM('submitted','under_review','approved','rejected','settled') | DEFAULT 'submitted' |
| assigned_to | INT | FK → users.id (nullable) |
| submitted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| resolved_at | TIMESTAMP | NULLABLE |

#### `audit_log`
| Column | Type | Constraints |
|---|---|---|
| id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → users.id |
| action | VARCHAR(100) | NOT NULL |
| target_type | VARCHAR(50) | e.g. 'policy', 'claim', 'user' |
| target_id | INT | |
| details | TEXT | |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

## 5. API Endpoints

### 5.1 Authentication
| Method | Route | Description | Access |
|---|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT | Public |
| POST | `/api/auth/register` | Register new user | Admin only |
| GET | `/api/auth/me` | Get current user profile | Authenticated |

### 5.2 Policies
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/api/policies` | List all policies (filterable) | Staff+ |
| GET | `/api/policies/:id` | Get policy details | Staff+ |
| POST | `/api/policies` | Create new policy | Manager+ |
| PUT | `/api/policies/:id` | Update policy | Manager+ |
| DELETE | `/api/policies/:id` | Cancel/delete policy | Admin only |

### 5.3 Claims
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/api/claims` | List all claims (filterable) | Staff+ |
| GET | `/api/claims/:id` | Get claim details | Staff+ |
| POST | `/api/claims` | Submit new claim | Staff+ |
| PUT | `/api/claims/:id` | Update claim status | Manager+ |
| PUT | `/api/claims/:id/assign` | Assign claim to staff | Manager+ |

### 5.4 Dashboard & Analytics
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/api/dashboard/stats` | KPIs (total policies, claims, premiums) | Staff+ |
| GET | `/api/dashboard/charts` | Chart data (claims by type, policies by region) | Manager+ |
| GET | `/api/reports/executive` | Executive summary report | Admin only |
| GET | `/api/reports/claims` | Claims analytics report | Manager+ |

### 5.5 Users (Admin)
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/api/users` | List all users | Admin only |
| PUT | `/api/users/:id/role` | Change user role | Admin only |
| DELETE | `/api/users/:id` | Deactivate user | Admin only |

### 5.6 System / Monitoring
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/api/health` | Health check (uptime, DB status) | Public |
| GET | `/api/system/metrics` | CPU, memory, disk usage | Admin only |
| GET | `/api/audit-log` | Audit trail | Admin only |

---

## 6. Frontend Pages

| # | Page | Route | Role | Description |
|---|---|---|---|---|
| 1 | **Login** | `/login` | Public | Authentication page |
| 2 | **Dashboard** | `/` | All roles | KPI cards, charts, recent activity |
| 3 | **Policies** | `/policies` | Staff+ | List, search, filter policies |
| 4 | **Policy Detail** | `/policies/:id` | Staff+ | View/edit single policy |
| 5 | **Claims** | `/claims` | Staff+ | List, search, filter claims |
| 6 | **Claim Detail** | `/claims/:id` | Staff+ | View/update claim |
| 7 | **Reports** | `/reports` | Manager+ | Analytics charts, export options |
| 8 | **Executive Portal** | `/executive` | Admin | Aggregated insights, region-wise breakdown |
| 9 | **User Management** | `/users` | Admin | Manage users and roles |
| 10 | **Audit Log** | `/audit` | Admin | System activity trail |
| 11 | **Pricing** | `/pricing` | All | AWS infrastructure cost estimates |
| 12 | **System Monitor** | `/monitor` | Admin | Server health, resource usage |

### 6.1 Design Requirements

- **Theme**: Dark professional theme with accent color `#00D4AA` (teal-green)
- **Typography**: Inter (Google Fonts)
- **Layout**: Sidebar navigation + top header bar
- **Responsive**: Desktop-first, basic mobile support
- **Charts**: Chart.js for dashboard visualizations
- **Animations**: Subtle hover effects, card transitions, loading skeletons

---

## 7. Role-Based Access Control (RBAC)

| Feature | Staff | Manager | Admin |
|---|---|---|---|
| View Dashboard | ✅ | ✅ | ✅ |
| View Policies | ✅ | ✅ | ✅ |
| Create/Edit Policies | ❌ | ✅ | ✅ |
| Delete Policies | ❌ | ❌ | ✅ |
| View Claims | ✅ | ✅ | ✅ |
| Submit Claims | ✅ | ✅ | ✅ |
| Approve/Reject Claims | ❌ | ✅ | ✅ |
| View Reports | ❌ | ✅ | ✅ |
| Executive Portal | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Audit Log | ❌ | ❌ | ✅ |
| System Monitor | ❌ | ❌ | ✅ |
| Pricing Page | ✅ | ✅ | ✅ |

---

## 8. Seed Data

Pre-populate the database with:
- **3 users**: 1 admin, 1 manager, 1 staff
- **15–20 policies**: Mix of types, statuses, regions
- **10–15 claims**: Various statuses and types
- **Audit log entries**: From seed operations

Default credentials:
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Staff | `staff` | `staff123` |

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Response Time** | API responses < 500ms |
| **Availability** | Single EC2 instance (demo scope) |
| **Security** | JWT auth, bcrypt passwords, parameterized SQL queries |
| **Backup** | Automated daily DB backup via cron + shell script |
| **Logging** | Application logs + audit trail in DB |
| **Containerization** | Full app runs via `docker-compose up` |
| **Monitoring** | Health endpoint + system metrics endpoint |

---

## 10. File/Folder Structure

```
AWS/
├── TASK.md                          # This SRD document
├── DEPLOY.md                        # Deployment & testing guide
├── docker-compose.yml               # Multi-container orchestration
├── nginx/
│   └── default.conf                 # Nginx reverse proxy config
├── backend/
│   ├── Dockerfile                   # Backend container image
│   ├── package.json
│   ├── server.js                    # Express entry point
│   ├── .env.example                 # Environment variables template
│   ├── config/
│   │   └── db.js                    # MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── rbac.js                  # Role-based access middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── policies.js
│   │   ├── claims.js
│   │   ├── dashboard.js
│   │   ├── reports.js
│   │   ├── users.js
│   │   └── system.js
│   ├── db/
│   │   ├── schema.sql               # Table creation scripts
│   │   └── seed.sql                 # Seed data
│   └── scripts/
│       ├── backup.sh                # Database backup script
│       ├── deploy.sh                # Server deployment automation
│       ├── monitor.sh               # System resource monitor
│       └── maintenance.sh           # Routine maintenance script
├── frontend/
│   ├── index.html                   # SPA entry point
│   ├── css/
│   │   └── style.css                # All styles
│   └── js/
│       ├── app.js                   # Router & app init
│       ├── api.js                   # API client helper
│       ├── auth.js                  # Login/logout logic
│       ├── dashboard.js             # Dashboard page
│       ├── policies.js              # Policies page
│       ├── claims.js                # Claims page
│       ├── reports.js               # Reports & charts
│       ├── executive.js             # Executive portal
│       ├── users.js                 # User management
│       ├── audit.js                 # Audit log viewer
│       ├── pricing.js               # AWS pricing estimates
│       ├── monitor.js               # System monitor page
│       └── components.js            # Reusable UI components
└── docs/
    ├── architecture-diagram.png     # Cloud architecture diagram
    ├── vpc-diagram.png              # Network topology
    └── pricing-breakdown.md         # Detailed cost analysis
```

---

## 11. Deliverable Mapping

This table maps each academic deliverable to where it is demonstrated in the project:

| Deliverable | Where Demonstrated |
|---|---|
| Cloud Architecture | `docs/architecture-diagram.png`, VPC setup, multi-AZ concepts in DEPLOY.md |
| Linux Administration | EC2 user/group setup, permissions, cron jobs, logs — documented in DEPLOY.md |
| Cloud VM Deployment | EC2 instance setup, Nginx, SSH, SCP, Git — documented in DEPLOY.md |
| Cloud Databases | MySQL in Docker, `schema.sql`, `seed.sql`, backup scripts |
| Docker & Containerization | `Dockerfile`, `docker-compose.yml`, multi-container setup |
| Cloud Networking | VPC, subnets, security groups, SSH access — documented in DEPLOY.md |
| Monitoring & Resource Management | `/api/health`, `/api/system/metrics`, `monitor.sh`, `/monitor` page |
| Automation | `backup.sh`, `deploy.sh`, `monitor.sh`, `maintenance.sh`, cron setup |
| Operational Dashboards | `/` dashboard with KPI cards and charts |
| Role-Based Access | JWT + RBAC middleware, 3-tier roles |
| Reporting & Analytics | `/reports` page, `/executive` portal, Chart.js visualizations |
| Workflow Management | Claim assignment, status transitions, approval chain |
| Monitoring Dashboards | `/monitor` page with live server metrics |
| Database-Backed Records | All CRUD operations + `audit_log` table |
| Executive Reporting | `/executive` portal with aggregated insights |
| Pricing Strategy | `/pricing` page with AWS cost breakdown |
