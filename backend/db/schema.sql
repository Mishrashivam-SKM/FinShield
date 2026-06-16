CREATE DATABASE IF NOT EXISTS finshield;
USE finshield;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role ENUM('admin','manager','staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  policy_number VARCHAR(20) UNIQUE NOT NULL,
  holder_name VARCHAR(100) NOT NULL,
  holder_email VARCHAR(100),
  policy_type ENUM('health','auto','life','property','business') NOT NULL,
  premium_amount DECIMAL(12,2) NOT NULL,
  coverage_amount DECIMAL(14,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active','expired','cancelled','pending') DEFAULT 'pending',
  region VARCHAR(50),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  claim_number VARCHAR(20) UNIQUE NOT NULL,
  policy_id INT,
  claimant_name VARCHAR(100) NOT NULL,
  claim_type ENUM('accident','theft','medical','natural_disaster','other') NOT NULL,
  description TEXT,
  claim_amount DECIMAL(12,2) NOT NULL,
  status ENUM('submitted','under_review','approved','rejected','settled') DEFAULT 'submitted',
  assigned_to INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (policy_id) REFERENCES policies(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
