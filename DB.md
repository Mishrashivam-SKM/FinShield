# Database Documentation — FinShield Insurance Portal

## Overview

| Property | Value |
|---|---|
| **Engine** | MySQL 8.0 |
| **Database Name** | `finshield` |
| **Character Set** | UTF-8 (default) |
| **Container** | `finshield-db` (Docker) |
| **Port** | 3306 (internal), not exposed to public |
| **Credentials** | Root: `finshield_root_pass` / App: `finshield_user` : `finshield_pass` |

---

## Schema — 4 Tables

### `users` — Application Users
Stores admin, manager, and staff accounts with bcrypt-hashed passwords.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,       -- bcrypt hash, never plaintext
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role ENUM('admin','manager','staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Purpose |
|---|---|
| `password_hash` | Stored as bcrypt hash (e.g., `$2b$08$...`) — never raw passwords |
| `role` | Controls RBAC: Admin > Manager > Staff |

---

### `policies` — Insurance Policies
Stores all insurance policies with types, premiums (₹), coverage, regions, and lifecycle status.

```sql
CREATE TABLE policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  policy_number VARCHAR(20) UNIQUE NOT NULL,   -- e.g., POL-H-0001
  holder_name VARCHAR(100) NOT NULL,
  holder_email VARCHAR(100),
  policy_type ENUM('health','auto','life','property','business') NOT NULL,
  premium_amount DECIMAL(12,2) NOT NULL,       -- Annual premium in ₹
  coverage_amount DECIMAL(14,2) NOT NULL,      -- Max coverage in ₹
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active','expired','cancelled','pending') DEFAULT 'pending',
  region VARCHAR(50),                          -- Indian city
  created_by INT,                              -- FK → users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

| Column | Purpose |
|---|---|
| `policy_number` | Unique ID like `POL-H-0001` (prefix = type) |
| `premium_amount` | Annual premium in INR (₹8,900 – ₹1,35,000) |
| `coverage_amount` | Max payout in INR (₹3,00,000 – ₹2,00,00,000) |
| `region` | Indian city: Mumbai, Delhi, Bangalore, Chennai, Pune, Hyderabad |
| `status` | Lifecycle: pending → active → expired/cancelled |

---

### `claims` — Insurance Claims
Tracks claim submissions, approvals, and settlements linked to policies.

```sql
CREATE TABLE claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  claim_number VARCHAR(20) UNIQUE NOT NULL,    -- e.g., CLM-2026-0001
  policy_id INT NOT NULL,                      -- FK → policies.id
  claimant_name VARCHAR(100) NOT NULL,
  claim_type ENUM('accident','theft','medical','natural_disaster','other') NOT NULL,
  description TEXT,
  claim_amount DECIMAL(12,2) NOT NULL,         -- Claim value in ₹
  status ENUM('submitted','under_review','approved','rejected','settled') DEFAULT 'submitted',
  assigned_to INT,                             -- FK → users.id (nullable)
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (policy_id) REFERENCES policies(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

| Column | Purpose |
|---|---|
| `claim_type` | 5 categories: accident, theft, medical, natural_disaster, other |
| `status` | Workflow: submitted → under_review → approved/rejected → settled |
| `assigned_to` | Staff member handling the claim (set by manager) |
| `resolved_at` | Set when claim reaches terminal status |

---

### `audit_log` — Activity Trail
Records all significant system operations for compliance and auditing.

```sql
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,                                 -- FK → users.id
  action VARCHAR(100) NOT NULL,                -- e.g., POLICY_CREATE, USER_CREATE
  target_type VARCHAR(50),                     -- 'policy', 'claim', 'user', 'system'
  target_id INT,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Seed Data Summary

### Users (3)
| Username | Role | Password |
|---|---|---|
| `admin` | Admin | `admin123` |
| `manager` | Manager | `manager123` |
| `staff` | Staff | `staff123` |

### Policies (18)
| Type | Count | Premium Range (₹) | Coverage Range (₹) |
|---|---|---|---|
| Health | 4 | 15,000 – 32,000 | 3,00,000 – 10,00,000 |
| Auto | 4 | 8,900 – 14,800 | 3,50,000 – 6,00,000 |
| Life | 4 | 38,000 – 62,000 | 40,00,000 – 75,00,000 |
| Property | 3 | 22,000 – 42,000 | 18,00,000 – 35,00,000 |
| Business | 3 | 78,000 – 1,35,000 | 1,20,00,000 – 2,00,00,000 |

**Regions**: Mumbai (3), Delhi (3), Bangalore (3), Chennai (3), Pune (3), Hyderabad (3)

### Claims (12)
| Type | Count | Amount Range (₹) |
|---|---|---|
| Medical | 3 | 2,10,000 – 4,25,000 |
| Accident | 3 | 95,000 – 3,10,000 |
| Theft | 2 | 3,20,000 – 8,90,000 |
| Natural Disaster | 2 | 7,80,000 – 12,00,000 |
| Other | 2 | 14,50,000 – 15,00,000 |

### Audit Log (5)
System initialization, user creation events, and policy creation events.

---

## Useful SQL Queries

### Check total premiums by region
```sql
SELECT region, COUNT(*) AS policies, SUM(premium_amount) AS total_premiums
FROM policies WHERE status = 'active' GROUP BY region ORDER BY total_premiums DESC;
```

### Find high-value claims
```sql
SELECT c.claim_number, c.claimant_name, c.claim_amount, c.status, p.policy_number
FROM claims c JOIN policies p ON c.policy_id = p.id
WHERE c.claim_amount > 500000 ORDER BY c.claim_amount DESC;
```

### Revenue vs payout (profit analysis)
```sql
SELECT
  (SELECT SUM(premium_amount) FROM policies WHERE status = 'active') AS total_revenue,
  (SELECT SUM(claim_amount) FROM claims WHERE status = 'settled') AS total_payout;
```

### Claims pending review
```sql
SELECT c.claim_number, c.claimant_name, c.claim_type, c.claim_amount
FROM claims c WHERE c.status IN ('submitted', 'under_review')
ORDER BY c.submitted_at ASC;
```

---

## Backup & Recovery

### Manual Backup
```bash
docker exec finshield-db mysqldump -u root -pfinshield_root_pass finshield \
  > backups/finshield_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup
```bash
docker exec -i finshield-db mysql -u root -pfinshield_root_pass finshield \
  < backups/finshield_20260616_120000.sql
```

### Automated Daily Backup
Handled by `scripts/backup.sh` via cron (2 AM daily). See DEPLOY.md §13.

---

## Entity Relationship Diagram

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  users   │       │   policies   │       │  claims  │
├──────────┤       ├──────────────┤       ├──────────┤
│ id (PK)  │──┐    │ id (PK)      │──┐    │ id (PK)  │
│ username │  │    │ policy_number│  │    │ claim_no │
│ role     │  ├───→│ created_by   │  ├───→│ policy_id│
│ ...      │  │    │ holder_name  │  │    │ claimant │
└──────────┘  │    │ premium_amt  │  │    │ amount   │
              │    │ coverage_amt │  │    │ status   │
              │    │ region       │  │    │ assigned │←─┐
              │    └──────────────┘  │    └──────────┘  │
              │                     │                    │
              │    ┌──────────────┐ │                    │
              │    │  audit_log   │ │                    │
              │    ├──────────────┤ │                    │
              └───→│ user_id (FK) │ │                    │
                   │ action       │ │                    │
                   │ target_type  │ │                    │
                   │ target_id    │ │    users.id ───────┘
                   └──────────────┘
```

---

## Connecting to the Database

```bash
# From inside the Docker network
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield

# From host machine (if port is mapped)
mysql -h 127.0.0.1 -P 3307 -u root -pfinshield_root_pass finshield
```
