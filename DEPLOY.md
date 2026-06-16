# FinShield Insurance Management Portal — Deployment & Testing Guide

> This document is a **step-by-step walkthrough** for deploying, testing, and understanding the entire cloud infrastructure. Follow it in order. Each section maps to a graded deliverable.

## Problem Statement

**FinShield Insurance Operations Cloud** is experiencing rapid growth across multiple operational regions. Existing operations rely on disconnected systems, spreadsheets, manual workflows, and isolated reporting environments. The organization requires a **centralized cloud platform** capable of supporting operational management, analytics, reporting, secure access control, monitoring, and future expansion requirements.

This guide walks through building and deploying the **Insurance Management Portal** — a small-scale web application that demonstrates:
- Scalable cloud architecture (compute, storage, networking)
- Linux server administration and security
- Docker containerization and multi-container orchestration
- MySQL database management with backup/recovery
- VPC networking with security groups and firewalls
- Real-time monitoring, resource management, and automation
- Role-based access control and operational dashboards
- Infrastructure pricing analysis for Insurance Technology operations

### Deliverable → Section Mapping

| Deliverable | Section(s) |
|---|---|
| Cloud Architecture | §3 (IAM), §4 (VPC), §5 (EC2), Architecture Diagram |
| Linux Administration | §6 (Users, Groups, Permissions, Packages, Logs) |
| Cloud VM Deployment | §5 (EC2 Launch), §7 (SCP/Git), §10 (Nginx) |
| Cloud Databases | §9 (MySQL, Schema, Queries, Backup, Recovery) |
| Docker & Containerization | §8 (Build, Lifecycle, Multi-container, Docker Hub) |
| Cloud Networking | §4 (VPC, Subnet, IGW, Security Groups, Routes) |
| Monitoring & Resource Mgmt | §12 (htop, vmstat, docker stats, Health API) |
| Automation | §13 (backup.sh, monitor.sh, deploy.sh, Cron Jobs) |
| Operational Dashboards | §11.3 (Dashboard with KPI cards and Chart.js) |
| Role-Based Access | §11.2 (RBAC verification with 3-tier roles) |
| Reporting & Analytics | §11.3 (Reports page, Executive portal) |
| Pricing Strategy | §16 (Compute, Storage, Network, DR, Multi-region) |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [AWS Account & IAM Setup](#3-aws-account--iam-setup)
4. [VPC & Networking (Cloud Networking)](#4-vpc--networking)
5. [EC2 Instance Launch (Cloud VM Deployment)](#5-ec2-instance-launch)
6. [Linux Server Configuration (Linux Administration)](#6-linux-server-configuration)
7. [Deploy Code to EC2 (Git + SCP)](#7-deploy-code-to-ec2)
8. [Docker & Containerization](#8-docker--containerization)
9. [Database Setup & Verification (Cloud Databases)](#9-database-setup--verification)
10. [Nginx & Web Server (Cloud VM Deployment)](#10-nginx--web-server)
11. [Application Testing](#11-application-testing)
12. [Monitoring & Resource Management](#12-monitoring--resource-management)
13. [Automation Scripts & Cron Jobs](#13-automation-scripts--cron-jobs)
14. [Backup & Disaster Recovery](#14-backup--disaster-recovery)
15. [Security Hardening](#15-security-hardening)
16. [Pricing Estimates](#16-pricing-estimates)
17. [Verification Checklist](#17-verification-checklist)

---

## 1. Prerequisites

### On Your Local Machine
```bash
# Ensure these are installed
node --version          # v18+ recommended
npm --version           # v9+
docker --version        # v24+
docker compose version  # v2+
git --version           # v2+
mysql --version         # Client only (optional, for direct DB access)
```

### AWS Requirements
- An AWS account (free tier eligible)
- AWS CLI installed and configured (`aws configure`)
- An SSH key pair (`.pem` file) — will be created in Step 5

---

## 2. Local Development Setup

> **Purpose**: Verify the app works on your machine before deploying to AWS.

### 2.1 Clone / Navigate to the Project
```bash
cd "/Users/shivammishra/Desktop/untitled folder/AWS"
```

### 2.2 Start Everything with Docker Compose
```bash
docker compose up --build
```

This starts 3 containers:
| Container | Port | Service |
|---|---|---|
| `finshield-nginx` | 80 | Nginx reverse proxy |
| `finshield-backend` | 3000 | Express.js API |
| `finshield-db` | 3306 | MySQL database |

### 2.3 Verify Locally
```bash
# Health check
curl http://localhost/api/health

# Open in browser
open http://localhost
```

### 2.4 Default Login Credentials
| Role | Username | Password |
|---|---|---|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Staff | staff | staff123 |

### 2.5 Stop Local Environment
```bash
docker compose down           # Stop & remove containers
docker compose down -v        # Also remove database volume (full reset)
```

---

## 3. AWS Account & IAM Setup

> **Deliverable**: Cloud Architecture — understanding IAM and access control.

### 3.1 Create an IAM User (if not already done)
1. Go to **AWS Console → IAM → Users → Create User**
2. Username: `finshield-deployer`
3. Attach policy: `AmazonEC2FullAccess`, `AmazonVPCFullAccess`
4. Download the access key CSV

### 3.2 Configure AWS CLI
```bash
aws configure
# AWS Access Key ID: <from CSV>
# AWS Secret Access Key: <from CSV>
# Default region: ap-south-1 (Mumbai) or us-east-1
# Default output format: json
```

### 3.3 Verify
```bash
aws sts get-caller-identity
```

---

## 4. VPC & Networking

> **Deliverable**: Cloud Networking — VPC, subnets, security groups, firewalls.

### 4.1 Create a VPC
```bash
# Create VPC with CIDR 10.0.0.0/16
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=FinShield-VPC}]'

# Note the VpcId from output (e.g., vpc-0abc123...)
```

### 4.2 Create a Public Subnet
```bash
aws ec2 create-subnet \
  --vpc-id <VpcId> \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ap-south-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=FinShield-Public-Subnet}]'
```

### 4.3 Create & Attach Internet Gateway
```bash
# Create IGW
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=FinShield-IGW}]'

# Attach to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id <IgwId> \
  --vpc-id <VpcId>
```

### 4.4 Configure Route Table
```bash
# Get the main route table
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<VpcId>"

# Add route to IGW for internet access
aws ec2 create-route \
  --route-table-id <RouteTableId> \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id <IgwId>

# Associate subnet with route table
aws ec2 associate-route-table \
  --route-table-id <RouteTableId> \
  --subnet-id <SubnetId>
```

### 4.5 Enable Auto-Assign Public IP
```bash
aws ec2 modify-subnet-attribute \
  --subnet-id <SubnetId> \
  --map-public-ip-on-launch
```

### 4.6 Create Security Group
```bash
aws ec2 create-security-group \
  --group-name FinShield-SG \
  --description "Security group for FinShield Insurance Portal" \
  --vpc-id <VpcId>

# Allow SSH (port 22)
aws ec2 authorize-security-group-ingress \
  --group-id <SgId> \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-id <SgId> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id <SgId> \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### 4.7 Understand What You Built
```
┌─────────────────────────────────────────────┐
│            FinShield-VPC (10.0.0.0/16)      │
│                                             │
│  ┌────────────────────────────────────┐     │
│  │  Public Subnet (10.0.1.0/24)      │     │
│  │                                    │     │
│  │  ┌──────────────┐                 │     │
│  │  │   EC2 (web)  │ ←── SG: 22,80  │     │
│  │  └──────────────┘                 │     │
│  └──────────┬─────────────────────────┘     │
│             │                               │
│      ┌──────▼──────┐                        │
│      │     IGW     │ ←── Internet Access    │
│      └─────────────┘                        │
└─────────────────────────────────────────────┘
```

---

## 5. EC2 Instance Launch

> **Deliverable**: Cloud VM Deployment — launching and connecting to a cloud VM.

### 5.1 Create Key Pair
```bash
aws ec2 create-key-pair \
  --key-name FinShield-Key \
  --query 'KeyMaterial' \
  --output text > FinShield-Key.pem

chmod 400 FinShield-Key.pem
```

### 5.2 Launch EC2 Instance
```bash
aws ec2 run-instances \
  --image-id ami-0f5ee92e2d63afc18 \
  --instance-type t2.micro \
  --key-name FinShield-Key \
  --security-group-ids <SgId> \
  --subnet-id <SubnetId> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=FinShield-Server}]'

# Note the InstanceId from output
```

> **Note**: The AMI ID above is for Ubuntu 22.04 in ap-south-1. For other regions, find the correct AMI at https://cloud-images.ubuntu.com/locator/ec2/

### 5.3 Get Public IP
```bash
aws ec2 describe-instances \
  --instance-ids <InstanceId> \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

### 5.4 Connect via SSH
```bash
ssh -i FinShield-Key.pem ubuntu@<PublicIP>
```

---

## 6. Linux Server Configuration

> **Deliverable**: Linux Administration — users, groups, permissions, packages, processes, logs.

### 6.1 System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 6.2 Create Users & Groups
```bash
# Create a group for the FinShield team
sudo groupadd finshield

# Create application user
sudo useradd -m -s /bin/bash -g finshield finshield-app
sudo passwd finshield-app

# Create admin user
sudo useradd -m -s /bin/bash -G finshield,sudo finshield-admin
sudo passwd finshield-admin

# Verify
cat /etc/group | grep finshield
id finshield-app
id finshield-admin
```

### 6.3 Set Up Directory Permissions
```bash
# Create app directory
sudo mkdir -p /opt/finshield
sudo chown -R finshield-app:finshield /opt/finshield
sudo chmod -R 750 /opt/finshield

# Create log directory
sudo mkdir -p /var/log/finshield
sudo chown -R finshield-app:finshield /var/log/finshield
sudo chmod -R 770 /var/log/finshield

# Verify permissions
ls -la /opt/finshield
ls -la /var/log/finshield
```

### 6.4 Install Required Packages
```bash
# Install Docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker ubuntu
sudo usermod -aG docker finshield-app

# Install Git and other utilities
sudo apt install -y git htop net-tools tree mysql-client

# Verify installations
docker --version
docker compose version
git --version
htop --version
```

### 6.5 Process Monitoring Commands
```bash
# Check running processes
ps aux | head -20

# Monitor in real-time
htop

# Check system resources
free -h              # Memory
df -h                # Disk
uptime               # Load average
vmstat 1 5           # CPU/memory/IO stats
```

### 6.6 View System Logs
```bash
# System logs
sudo journalctl -xe --no-pager | tail -50

# Auth logs
sudo tail -20 /var/log/auth.log

# Docker logs (after deployment)
docker logs finshield-backend --tail 50
docker logs finshield-db --tail 50
```

---

## 7. Deploy Code to EC2

> **Deliverable**: Cloud VM Deployment — using SCP and Git for deployment.

### Method A: Git (Recommended)
```bash
# On EC2 instance
cd /opt/finshield
sudo -u finshield-app git clone <your-github-repo-url> .
```

### Method B: SCP (Alternative)
```bash
# From your local machine
scp -i FinShield-Key.pem -r "/Users/shivammishra/Desktop/untitled folder/AWS/"* ubuntu@<PublicIP>:/tmp/finshield/

# On EC2
sudo cp -r /tmp/finshield/* /opt/finshield/
sudo chown -R finshield-app:finshield /opt/finshield/
```

---

## 8. Docker & Containerization

> **Deliverable**: Docker — containers, images, lifecycle, multi-container orchestration.

### 8.1 Build & Start Containers on EC2
```bash
cd /opt/finshield
docker compose up --build -d
```

### 8.2 Verify Containers Are Running
```bash
docker ps

# Expected output:
# CONTAINER ID  IMAGE              STATUS   PORTS                 NAMES
# abc123...     finshield-nginx    Up       0.0.0.0:80->80/tcp    finshield-nginx
# def456...     finshield-backend  Up       3000/tcp              finshield-backend
# ghi789...     mysql:8.0          Up       3306/tcp              finshield-db
```

### 8.3 Container Lifecycle Management
```bash
# View logs
docker logs finshield-backend -f
docker logs finshield-db --tail 20

# Restart a single container
docker compose restart backend

# Stop all containers
docker compose stop

# Start all containers
docker compose start

# Rebuild after code changes
docker compose up --build -d

# Remove everything (including volumes)
docker compose down -v

# Inspect a container
docker inspect finshield-backend

# Execute command inside container
docker exec -it finshield-backend sh
docker exec -it finshield-db mysql -u root -p
```

### 8.4 Docker Hub (Pulling Images)
```bash
# The docker-compose.yml uses these images:
docker pull mysql:8.0
docker pull nginx:alpine

# List local images
docker images
```

---

## 9. Database Setup & Verification

> **Deliverable**: Cloud Databases — MySQL, operational records, backup/recovery.

### 9.1 Verify Database Is Running
```bash
docker exec -it finshield-db mysql -u root -pfinshield_root_pass -e "SHOW DATABASES;"
```

### 9.2 Verify Tables Were Created
```bash
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield -e "SHOW TABLES;"

# Expected:
# +---------------------+
# | Tables_in_finshield |
# +---------------------+
# | audit_log           |
# | claims              |
# | policies            |
# | users               |
# +---------------------+
```

### 9.3 Verify Seed Data
```bash
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield -e "
  SELECT username, role FROM users;
  SELECT COUNT(*) as total_policies FROM policies;
  SELECT COUNT(*) as total_claims FROM claims;
"
```

### 9.4 Run a Sample Query
```bash
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield -e "
  SELECT p.policy_number, p.holder_name, p.policy_type, p.status, p.premium_amount
  FROM policies p
  WHERE p.status = 'active'
  ORDER BY p.premium_amount DESC
  LIMIT 5;
"
```

### 9.5 Manual Backup
```bash
docker exec finshield-db mysqldump -u root -pfinshield_root_pass finshield > /opt/finshield/backups/finshield_$(date +%Y%m%d_%H%M%S).sql
```

### 9.6 Manual Restore (Disaster Recovery)
```bash
# Restore from a backup file
docker exec -i finshield-db mysql -u root -pfinshield_root_pass finshield < /opt/finshield/backups/finshield_20260616_120000.sql
```

---

## 10. Nginx & Web Server

> **Deliverable**: Cloud VM Deployment — Apache/Nginx web services, service management.

### 10.1 Verify Nginx Is Serving the App
```bash
curl -I http://localhost

# Expected: HTTP/1.1 200 OK
```

### 10.2 Nginx Configuration Explained
The `nginx/default.conf` file does:
- Serves static frontend files from `/usr/share/nginx/html`
- Proxies `/api/*` requests to the Express backend at `backend:3000`
- Handles SPA routing (returns `index.html` for all non-API, non-file routes)

### 10.3 Service Management with systemctl (Alternative non-Docker setup)
```bash
# If Nginx were installed directly (not in Docker):
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo systemctl enable nginx    # Start on boot
```

### 10.4 Test from Public Internet
```bash
# From your local machine (not EC2)
curl http://<EC2-Public-IP>/api/health

# Open in browser
open http://<EC2-Public-IP>
```

---

## 11. Application Testing

> **Purpose**: Verify all features work end-to-end after deployment.

### 11.1 API Tests (run from local machine or EC2)
```bash
BASE_URL="http://<EC2-Public-IP>"

# 1. Health check
curl $BASE_URL/api/health

# 2. Login as admin
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"

# 3. Get dashboard stats
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/dashboard/stats | python3 -m json.tool

# 4. List policies
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/policies | python3 -m json.tool

# 5. Create a new policy
curl -s -X POST $BASE_URL/api/policies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_number": "POL-A-9999",
    "holder_name": "Test User",
    "holder_email": "test@example.com",
    "policy_type": "auto",
    "premium_amount": 12500.00,
    "coverage_amount": 500000.00,
    "start_date": "2026-01-01",
    "end_date": "2027-01-01",
    "region": "Mumbai"
  }' | python3 -m json.tool

# 6. List claims
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/claims | python3 -m json.tool

# 7. Submit a new claim
curl -s -X POST $BASE_URL/api/claims \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": 1,
    "claimant_name": "Test Claimant",
    "claim_type": "accident",
    "description": "Minor fender bender on NH48",
    "claim_amount": 75000.00
  }' | python3 -m json.tool

# 8. Get system metrics (admin only)
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/system/metrics | python3 -m json.tool

# 9. Get audit log
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/system/audit-log | python3 -m json.tool
```

### 11.2 RBAC Test
```bash
# Login as staff
STAFF_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"staff","password":"staff123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Staff should NOT be able to create policies (expect 403)
curl -s -X POST $BASE_URL/api/policies \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"holder_name":"Blocked","policy_type":"auto","premium_amount":100,"coverage_amount":1000,"start_date":"2026-01-01","end_date":"2027-01-01"}' | python3 -m json.tool

# Staff should NOT access user management (expect 403)
curl -s -H "Authorization: Bearer $STAFF_TOKEN" $BASE_URL/api/users | python3 -m json.tool
```

### 11.3 Frontend Testing (Browser)
Open `http://<EC2-Public-IP>` and test:

| # | Test | Expected |
|---|---|---|
| 1 | Load login page | Login form displayed |
| 2 | Login as admin/admin123 | Redirect to dashboard |
| 3 | Dashboard shows KPI cards | Total policies, claims, premiums, etc. |
| 4 | Dashboard shows charts | Pie/bar charts with data |
| 5 | Navigate to Policies | Table of policies with search/filter |
| 6 | Create a new policy | Form submits, policy appears in list |
| 7 | Navigate to Claims | Table of claims |
| 8 | Submit a new claim | Claim created successfully |
| 9 | Navigate to Reports | Analytics charts load |
| 10 | Navigate to Executive Portal | Aggregated data visible |
| 11 | Navigate to User Management | User list with role controls |
| 12 | Navigate to Audit Log | Activity entries visible |
| 13 | Navigate to Pricing | AWS cost breakdown displayed |
| 14 | Navigate to System Monitor | Server metrics displayed |
| 15 | Logout and login as Staff | Sidebar hides admin-only links |
| 16 | Staff cannot create policies | Create button hidden or disabled |

---

## 12. Monitoring & Resource Management

> **Deliverable**: Monitoring — CPU, memory, storage, logs, performance metrics.

### 12.1 System Commands (On EC2)
```bash
# CPU and memory overview
top -bn1 | head -20
htop

# Memory usage
free -h

# Disk usage
df -h
du -sh /opt/finshield/*

# Network connections
sudo netstat -tlnp
ss -tulpn

# System uptime and load
uptime
cat /proc/loadavg
```

### 12.2 Docker Container Monitoring
```bash
# Resource usage per container
docker stats --no-stream

# Container logs
docker logs finshield-backend --tail 50 -f
docker logs finshield-db --tail 50

# Container health
docker inspect --format='{{.State.Health.Status}}' finshield-backend
```

### 12.3 Application Health Endpoint
```bash
# Returns: uptime, DB status, memory usage, timestamp
curl http://localhost/api/health | python3 -m json.tool
```

### 12.4 System Metrics Endpoint (Admin)
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/system/metrics | python3 -m json.tool
# Returns: CPU %, memory %, disk %, active connections, container status
```

### 12.5 Using the Monitor Script
```bash
# Run the monitoring script manually
bash /opt/finshield/scripts/monitor.sh

# Or tail the monitor log
tail -f /var/log/finshield/monitor.log
```

---

## 13. Automation Scripts & Cron Jobs

> **Deliverable**: Automation — shell scripts for deployments, backups, configurations, maintenance.

### 13.1 Available Scripts

| Script | Purpose | Usage |
|---|---|---|
| `scripts/backup.sh` | Automated database backup | `bash scripts/backup.sh` |
| `scripts/deploy.sh` | Pull latest code, rebuild, restart | `bash scripts/deploy.sh` |
| `scripts/monitor.sh` | Log CPU, memory, disk, container status | `bash scripts/monitor.sh` |
| `scripts/maintenance.sh` | Clean logs, prune Docker, rotate backups | `bash scripts/maintenance.sh` |

### 13.2 Set Up Cron Jobs
```bash
# Edit crontab
crontab -e

# Add these entries:
# ┌───── Minute (0-59)
# │ ┌───── Hour (0-23)
# │ │ ┌───── Day of Month (1-31)
# │ │ │ ┌───── Month (1-12)
# │ │ │ │ ┌───── Day of Week (0-7, 0 or 7 = Sunday)
# │ │ │ │ │

# Database backup every day at 2:00 AM
0 2 * * * /opt/finshield/scripts/backup.sh >> /var/log/finshield/backup.log 2>&1

# System monitoring every 5 minutes
*/5 * * * * /opt/finshield/scripts/monitor.sh >> /var/log/finshield/monitor.log 2>&1

# Weekly maintenance on Sunday at 3:00 AM
0 3 * * 0 /opt/finshield/scripts/maintenance.sh >> /var/log/finshield/maintenance.log 2>&1
```

### 13.3 Verify Cron Jobs
```bash
crontab -l

# Check cron execution logs
grep CRON /var/log/syslog | tail -10
```

---

## 14. Backup & Disaster Recovery

> **Deliverable**: Cloud Databases — backup procedures and recovery strategies.

### 14.1 Backup Strategy
| Type | Frequency | Retention | Method |
|---|---|---|---|
| Full DB dump | Daily (2 AM) | 7 days | `mysqldump` via `backup.sh` |
| Manual backup | On-demand | Until deleted | Manual `mysqldump` |

### 14.2 RPO / RTO Targets (Demo)
| Metric | Target | Explanation |
|---|---|---|
| **RPO** (Recovery Point Objective) | 24 hours | Max data loss = 1 day (daily backups) |
| **RTO** (Recovery Time Objective) | 1 hour | Time to restore from backup |

### 14.3 Disaster Recovery Test
```bash
# Step 1: Take a backup
bash /opt/finshield/scripts/backup.sh

# Step 2: Simulate disaster (drop a table)
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield -e "DROP TABLE claims;"

# Step 3: Verify data is gone
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield -e "SHOW TABLES;"

# Step 4: Restore from backup
LATEST_BACKUP=$(ls -t /opt/finshield/backups/*.sql | head -1)
docker exec -i finshield-db mysql -u root -pfinshield_root_pass finshield < $LATEST_BACKUP

# Step 5: Verify recovery
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield -e "SELECT COUNT(*) FROM claims;"
```

---

## 15. Security Hardening

> **Deliverable**: Cloud Networking — firewall rules, security groups, secure access.

### 15.1 Security Measures in Place
| Layer | Measure |
|---|---|
| **Network** | Security group restricts to ports 22, 80, 443 only |
| **SSH** | Key-based authentication (no password login) |
| **Application** | JWT tokens for API auth, bcrypt for password hashing |
| **Database** | Not exposed to public internet (Docker internal network) |
| **RBAC** | Three-tier role enforcement on every API endpoint |
| **Audit** | All write operations logged to `audit_log` table |
| **SQL Injection** | Parameterized queries throughout |

### 15.2 Disable Password-Based SSH (Optional)
```bash
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 15.3 Verify Security Group
```bash
aws ec2 describe-security-groups \
  --group-ids <SgId> \
  --query 'SecurityGroups[0].IpPermissions'
```

---

## 16. Pricing Estimates

> **Deliverable**: Pricing Strategy — compute, storage, networking, monitoring costs.

### 16.1 Single-Region Deployment (ap-south-1 — Mumbai)

| Resource | Spec | Monthly Cost (USD) | Monthly Cost (₹ INR) |
|---|---|---|---|
| **EC2 Instance** | t2.micro (1 vCPU, 1GB RAM) | $0 (free tier) / ~$8.50 | ₹0 / ~₹710 |
| **EBS Storage** | 20 GB gp3 | ~$1.60 | ~₹134 |
| **Data Transfer** | 10 GB outbound | ~$0.90 | ~₹75 |
| **Elastic IP** | 1 static IP | ~$3.65 | ~₹305 |
| **S3 (Backups)** | 5 GB storage | ~$0.12 | ~₹10 |
| | | | |
| **Total (Free Tier)** | | **~$6.27/month** | **~₹524/month** |
| **Total (Post Free Tier)** | | **~$14.77/month** | **~₹1,234/month** |

### 16.2 Production Scale Estimates

| Tier | Instances | Storage | DB | Monthly Cost |
|---|---|---|---|---|
| **Starter** | 1× t3.small | 50GB EBS | db.t3.micro RDS | ~$45/mo |
| **Growth** | 2× t3.medium + ALB | 200GB EBS | db.t3.small RDS Multi-AZ | ~$180/mo |
| **Enterprise** | 3× t3.large + ALB + Auto Scaling | 500GB EBS + S3 | db.r5.large RDS Multi-AZ | ~$650/mo |

### 16.3 Multi-Region Deployment (2 Regions)

| Component | Cost Multiplier | Notes |
|---|---|---|
| Compute | 2× | Duplicate instances in each region |
| Database | 2.5× | Cross-region replication overhead |
| Data Transfer | +$0.02/GB | Inter-region transfer costs |
| Total Estimate | ~1.8-2.2× | Of single-region cost |

### 16.4 Backup & DR Costs
| Service | Config | Monthly Cost |
|---|---|---|
| Automated DB Snapshots | 7-day retention | ~$2.30 |
| S3 Cross-Region Replication | 10 GB | ~$0.50 |
| Total DR | | **~$2.80/month** |

### 16.5 Optimization Recommendations
1. **Use Reserved Instances** — Save 30-60% on 1-3 year commitments
2. **Right-size instances** — Monitor usage, downgrade if underutilized
3. **Use S3 Intelligent-Tiering** — Auto-optimize storage costs
4. **Enable auto-scaling** — Pay only for what you use during peak hours
5. **Use Spot Instances** — For non-critical batch workloads (up to 90% savings)

---

## 17. Verification Checklist

Use this checklist to confirm all deliverables are demonstrated:

### Infrastructure
- [ ] VPC created with correct CIDR
- [ ] Public subnet with internet access
- [ ] Security group with proper rules (22, 80, 443)
- [ ] EC2 instance running Ubuntu 22.04
- [ ] SSH access working with key pair

### Linux Administration
- [ ] Users and groups created (finshield-app, finshield-admin)
- [ ] Directory permissions set correctly
- [ ] Docker and Git installed
- [ ] Can demonstrate `ps`, `top`, `htop`, `free`, `df` commands
- [ ] Can view system logs with `journalctl` and `/var/log/`

### Docker
- [ ] 3 containers running (nginx, backend, db)
- [ ] `docker ps` shows all healthy
- [ ] Can pull images from Docker Hub
- [ ] Can manage container lifecycle (start/stop/restart/logs)
- [ ] `docker compose up/down` works

### Database
- [ ] MySQL running in container
- [ ] Tables created (users, policies, claims, audit_log)
- [ ] Seed data loaded
- [ ] Can run queries against the DB
- [ ] Backup script works
- [ ] Restore/recovery tested

### Application
- [ ] Login works for all 3 roles
- [ ] Dashboard shows real data with charts
- [ ] CRUD operations for policies
- [ ] CRUD operations for claims
- [ ] RBAC enforced (staff cannot do admin actions)
- [ ] Reports page shows analytics
- [ ] Executive portal accessible to admin
- [ ] Pricing page displays cost estimates
- [ ] Audit log records actions

### Monitoring
- [ ] Health endpoint returns status
- [ ] System metrics endpoint works
- [ ] `monitor.sh` captures resource usage
- [ ] System monitor page displays metrics in UI

### Automation
- [ ] `backup.sh` runs successfully
- [ ] `deploy.sh` runs successfully
- [ ] `monitor.sh` runs successfully
- [ ] `maintenance.sh` runs successfully
- [ ] Cron jobs configured and visible in `crontab -l`

### Networking & Security
- [ ] App accessible via public IP on port 80
- [ ] DB NOT accessible from outside
- [ ] JWT authentication working
- [ ] Passwords hashed with bcrypt
- [ ] Security group rules correct

### Documentation
- [ ] TASK.md (SRD) complete
- [ ] DEPLOY.md (this file) complete
- [ ] Architecture diagram present
- [ ] Pricing estimates documented

---

## Quick Reference Card

```bash
# SSH into server
ssh -i FinShield-Key.pem ubuntu@<PublicIP>

# Start app
cd /opt/finshield && docker compose up -d

# Stop app
docker compose down

# View logs
docker logs finshield-backend -f

# DB access
docker exec -it finshield-db mysql -u root -pfinshield_root_pass finshield

# Backup now
bash scripts/backup.sh

# Check system
docker stats --no-stream && free -h && df -h
```
