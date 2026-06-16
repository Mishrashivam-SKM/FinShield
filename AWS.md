# AWS Deployment Guide — FinShield Insurance Portal

> **Goal**: Take the FinShield app from your local machine to a live AWS EC2 instance accessible via public IP. This guide teaches you **what each AWS service does** and **why you need it** alongside each step.

---

## Table of Contents

1. [What You'll Learn](#what-youll-learn)
2. [Prerequisites](#prerequisites)
3. [Step 1 — AWS Account & IAM](#step-1--aws-account--iam)
4. [Step 2 — VPC & Networking](#step-2--vpc--networking)
5. [Step 3 — Launch EC2 Instance](#step-3--launch-ec2-instance)
6. [Step 4 — Linux Server Setup](#step-4--linux-server-setup)
7. [Step 5 — Transfer Code to EC2](#step-5--transfer-code-to-ec2)
8. [Step 6 — Docker on EC2](#step-6--docker-on-ec2)
9. [Step 7 — Verify the Deployment](#step-7--verify-the-deployment)
10. [Step 8 — Monitoring & Automation](#step-8--monitoring--automation)
11. [Step 9 — Security Hardening](#step-9--security-hardening)
12. [Troubleshooting](#troubleshooting)

---

## What You'll Learn

| AWS Concept | Where You'll Use It |
|---|---|
| **IAM** (Identity & Access Management) | Creating a deploy user with limited permissions |
| **VPC** (Virtual Private Cloud) | Creating an isolated network for your app |
| **Subnets** | Placing your server in a public subnet |
| **Internet Gateway** | Allowing internet traffic to reach your server |
| **Security Groups** | Firewall rules — which ports to open |
| **EC2** (Elastic Compute Cloud) | Your virtual server running Ubuntu |
| **Key Pairs** | SSH authentication (no passwords) |
| **Docker** | Running your app in containers on EC2 |

---

## Prerequisites

**On your local machine, verify:**
```bash
docker --version        # Docker Desktop installed
docker compose version  # Compose V2
git --version           # Git installed
```

**The app should work locally first:**
```bash
cd "/path/to/AWS"
docker compose up --build
# Open http://localhost — login works? Good. Proceed.
docker compose down
```

---

## Step 1 — AWS Account & IAM

### What is IAM?
IAM controls **who** can do **what** in your AWS account. Instead of using your root account (which has unlimited access), you create a limited user for deployments.

### Steps:

1. **Create an AWS account** at https://aws.amazon.com (free tier eligible)

2. **Create an IAM user** (Console → IAM → Users → Create User):
   - Username: `finshield-deployer`
   - Attach policies: `AmazonEC2FullAccess`, `AmazonVPCFullAccess`
   - Create access keys → Download the CSV

3. **Install & configure AWS CLI** on your Mac:
   ```bash
   brew install awscli     # or download from aws.amazon.com/cli
   aws configure
   # Enter: Access Key ID, Secret Key, Region: ap-south-1, Output: json
   ```

4. **Verify:**
   ```bash
   aws sts get-caller-identity
   # Should show your account ID and username
   ```

---

## Step 2 — VPC & Networking

### What is a VPC?
A VPC is your **private network inside AWS**. Think of it as your own data center. Nothing goes in or out unless you explicitly allow it.

### What you'll build:
```
┌─────────────────── FinShield-VPC (10.0.0.0/16) ───────────────────┐
│                                                                     │
│   ┌─── Public Subnet (10.0.1.0/24) ───┐                           │
│   │                                     │                           │
│   │   [EC2 Instance]                   │                           │
│   │    ├─ Port 22 (SSH)                │                           │
│   │    ├─ Port 80 (HTTP)               │                           │
│   │    └─ Port 443 (HTTPS)             │                           │
│   │                                     │                           │
│   └─────────────┬───────────────────────┘                           │
│                 │                                                    │
│          [Internet Gateway]  ←── connects VPC to the internet       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Steps:

**Create VPC:**
```bash
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=FinShield-VPC}]'
# Save the VpcId from output (e.g., vpc-0abc123...)
```

> **What is CIDR?** `10.0.0.0/16` means your VPC has 65,536 IP addresses (10.0.0.0 to 10.0.255.255). The `/16` means the first 16 bits are fixed.

**Create Public Subnet:**
```bash
aws ec2 create-subnet \
  --vpc-id <VpcId> \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ap-south-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=FinShield-Public}]'
# Save SubnetId
```

> **What is a Subnet?** A subnet is a smaller segment of your VPC. `/24` gives you 256 IPs. "Public" means instances here can get public IP addresses.

**Create & Attach Internet Gateway:**
```bash
# Create
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=FinShield-IGW}]'
# Save IgwId

# Attach to your VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id <IgwId> \
  --vpc-id <VpcId>
```

> **What is an IGW?** Without it, your VPC is completely isolated. The Internet Gateway is the bridge between your VPC and the public internet.

**Configure Route Table (so traffic can flow out):**
```bash
# Find the main route table
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<VpcId>" \
  --query 'RouteTables[0].RouteTableId' --output text
# Save RouteTableId

# Add default route to IGW
aws ec2 create-route \
  --route-table-id <RouteTableId> \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id <IgwId>

# Associate subnet with route table
aws ec2 associate-route-table \
  --route-table-id <RouteTableId> \
  --subnet-id <SubnetId>
```

**Enable auto-assign public IP:**
```bash
aws ec2 modify-subnet-attribute \
  --subnet-id <SubnetId> \
  --map-public-ip-on-launch
```

**Create Security Group (firewall):**
```bash
aws ec2 create-security-group \
  --group-name FinShield-SG \
  --description "FinShield firewall rules" \
  --vpc-id <VpcId>
# Save SgId

# Open SSH (port 22)
aws ec2 authorize-security-group-ingress \
  --group-id <SgId> --protocol tcp --port 22 --cidr 0.0.0.0/0

# Open HTTP (port 80)  
aws ec2 authorize-security-group-ingress \
  --group-id <SgId> --protocol tcp --port 80 --cidr 0.0.0.0/0

# Open HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id <SgId> --protocol tcp --port 443 --cidr 0.0.0.0/0
```

> **What is a Security Group?** It's a virtual firewall. By default, ALL traffic is blocked. These commands punch holes for SSH (remote access), HTTP (web traffic), and HTTPS (secure web traffic).

---

## Step 3 — Launch EC2 Instance

### What is EC2?
EC2 = Elastic Compute Cloud. It's a virtual server (VM) running in AWS. You choose the OS, CPU, RAM, and pay by the hour.

**Create SSH Key Pair:**
```bash
aws ec2 create-key-pair \
  --key-name FinShield-Key \
  --query 'KeyMaterial' --output text > FinShield-Key.pem

chmod 400 FinShield-Key.pem
```

> **Why chmod 400?** SSH requires private keys to be readable ONLY by the owner. `400` = owner can read, nobody else can do anything.

**Launch the Instance:**
```bash
aws ec2 run-instances \
  --image-id ami-0f5ee92e2d63afc18 \
  --instance-type t2.micro \
  --key-name FinShield-Key \
  --security-group-ids <SgId> \
  --subnet-id <SubnetId> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=FinShield-Server}]'
# Save InstanceId
```

> **AMI** = Amazon Machine Image (pre-built OS). This one is Ubuntu 22.04 for ap-south-1. For other regions, find yours at https://cloud-images.ubuntu.com/locator/ec2/

> **t2.micro** = 1 vCPU, 1 GB RAM. Free tier eligible for 12 months.

**Get the public IP:**
```bash
aws ec2 describe-instances \
  --instance-ids <InstanceId> \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
# Save this IP — this is how you access your server
```

**SSH into your server:**
```bash
ssh -i FinShield-Key.pem ubuntu@<PublicIP>
```

> If you see `The authenticity of host...` just type `yes`. You're now inside your cloud server! 🎉

---

## Step 4 — Linux Server Setup

**Update the system:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Create users & groups:**
```bash
sudo groupadd finshield
sudo useradd -m -s /bin/bash -g finshield finshield-app
sudo useradd -m -s /bin/bash -G finshield,sudo finshield-admin
```

> **Why create users?** Security best practice. Instead of running everything as `root`, each service gets its own user with limited permissions.

**Set up directories:**
```bash
sudo mkdir -p /opt/finshield /var/log/finshield
sudo chown -R finshield-app:finshield /opt/finshield
sudo chmod -R 750 /opt/finshield
```

**Install Docker:**
```bash
# Add Docker's official repository
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Let your user run Docker without sudo
sudo usermod -aG docker ubuntu
sudo usermod -aG docker finshield-app

# Log out and back in for group changes to take effect
exit
# Then SSH back in
```

**Install helpful tools:**
```bash
sudo apt install -y git htop net-tools tree mysql-client
```

**Verify:**
```bash
docker --version          # Should show Docker 2x.x
docker compose version    # Should show v2.x
```

---

## Step 5 — Transfer Code to EC2

### Option A: Git (Recommended)
```bash
cd /opt/finshield
sudo -u finshield-app git clone <your-github-repo-url> .
```

### Option B: SCP (Copy from local machine)
```bash
# Run this from YOUR MAC, not the EC2 instance
scp -i FinShield-Key.pem -r "/path/to/AWS/"* ubuntu@<PublicIP>:/tmp/finshield/

# Then on EC2:
sudo cp -r /tmp/finshield/* /opt/finshield/
sudo chown -R finshield-app:finshield /opt/finshield/
```

---

## Step 6 — Docker on EC2

**Build and start everything:**
```bash
cd /opt/finshield
docker compose up --build -d
```

> **What does `-d` do?** Runs in "detached" mode — containers run in the background so you can close your SSH session.

**Verify containers are running:**
```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                STATUS   PORTS                 NAMES
abc123...      aws-backend          Up       0.0.0.0:3000->3000    finshield-backend
def456...      nginx:alpine         Up       0.0.0.0:80->80        finshield-nginx
ghi789...      mysql:8.0            Up       3306/tcp              finshield-db
```

**Check logs if something goes wrong:**
```bash
docker logs finshield-backend --tail 50
docker logs finshield-db --tail 50
```

> **Tip**: The backend may fail to connect to MySQL on the first try because MySQL takes ~10 seconds to initialize. Docker's `restart: unless-stopped` policy automatically restarts it.

---

## Step 7 — Verify the Deployment

### From your local machine:

**Health check:**
```bash
curl http://<PublicIP>/api/health
# Should return: {"status":"ok","db_status":"connected",...}
```

**Login test:**
```bash
TOKEN=$(curl -s -X POST http://<PublicIP>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"
```

**Fetch policies (should return 18):**
```bash
curl -s -H "Authorization: Bearer $TOKEN" http://<PublicIP>/api/policies \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} policies loaded')"
```

**Open in browser:**
```
http://<PublicIP>
```

Login with `admin` / `admin123` and verify:
- ✅ Dashboard shows 4 KPI cards + 2 charts
- ✅ Policies table shows 18 rows with ₹ amounts
- ✅ Claims table shows 12 rows + submit form works
- ✅ Reports shows revenue by region
- ✅ Users, Audit Log, Pricing, System Monitor all load

---

## Step 8 — Monitoring & Automation

### System monitoring commands:
```bash
htop                     # Interactive CPU/memory monitor
free -h                  # Memory usage
df -h                    # Disk usage
docker stats --no-stream # Container resource usage
```

### Set up automated cron jobs:
```bash
crontab -e
# Add these lines:

# Database backup every day at 2:00 AM
0 2 * * * /opt/finshield/backend/scripts/backup.sh >> /var/log/finshield/backup.log 2>&1

# System monitoring every 5 minutes
*/5 * * * * /opt/finshield/backend/scripts/monitor.sh >> /var/log/finshield/monitor.log 2>&1

# Weekly maintenance on Sunday at 3:00 AM
0 3 * * 0 /opt/finshield/backend/scripts/maintenance.sh >> /var/log/finshield/maintenance.log 2>&1
```

**Verify cron is set:**
```bash
crontab -l
```

### Test the backup script manually:
```bash
mkdir -p /opt/finshield/backups
bash /opt/finshield/backend/scripts/backup.sh
ls -la /opt/finshield/backups/
# Should show a .sql file with today's date
```

---

## Step 9 — Security Hardening

**Disable password SSH login:**
```bash
sudo nano /etc/ssh/sshd_config
# Find and set: PasswordAuthentication no
sudo systemctl restart sshd
```

**Verify security group (from your Mac):**
```bash
aws ec2 describe-security-groups --group-ids <SgId> \
  --query 'SecurityGroups[0].IpPermissions[*].{Port:FromPort,Source:IpRanges[0].CidrIp}'
```

**Security already built into the app:**
| Layer | Protection |
|---|---|
| Network | Security Group blocks all ports except 22, 80, 443 |
| SSH | Key-based only (no password) |
| API | JWT token authentication on every protected route |
| Passwords | bcrypt hashed (never stored as plaintext) |
| Database | Not exposed to internet (Docker internal network only) |
| SQL | All queries use parameterized inputs (no injection) |
| RBAC | 3-tier role enforcement on every endpoint |
| Audit | All operations logged to `audit_log` table |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Connection refused` on SSH | Check Security Group has port 22 open. Check instance is running. |
| Backend shows `ECONNREFUSED` | MySQL is still starting. Wait 15 seconds, backend auto-restarts. |
| `curl: (7) Failed to connect` | Check Security Group has port 80 open. Check `docker ps`. |
| Login returns 401 | Database might not have seed data. Run `docker compose down -v && docker compose up --build -d` |
| Page loads but shows `--` | Check browser console (F12). Likely a CORS or API path issue. |
| `Permission denied` on scripts | Run `chmod +x /opt/finshield/backend/scripts/*.sh` |

---

## Cost Summary

| Service | Monthly (USD) | Monthly (₹ INR) |
|---|---|---|
| EC2 t2.micro | Free / ~$8.50 | Free / ~₹710 |
| EBS 20GB | ~$1.60 | ~₹134 |
| Data transfer | ~$0.90 | ~₹75 |
| **Total** | **~$11/month** | **~₹920/month** |

> 💡 **Free Tier**: EC2 t2.micro is free for 12 months. Your real cost during free tier is ~₹210/month.

---

## Quick Reference

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

# Manual backup
bash backend/scripts/backup.sh

# System check
docker stats --no-stream && free -h && df -h
```
