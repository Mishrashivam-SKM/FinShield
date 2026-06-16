USE finshield;

-- Passwords: admin123, manager123, staff123
INSERT INTO users (username, password_hash, full_name, email, role) VALUES 
('admin', '$2b$08$aGLv1DcaxpQbtSTAfhF5Xeoz8GjlUUYEH6FZZc5IzoyWOIj3UbOue', 'System Admin', 'admin@finshield.com', 'admin'),
('manager', '$2b$08$geoqk5ZSDi6q.FpjjUVHhe5iXSXapjXfPjWbjfySXuz.a/L0Ee7U6', 'Branch Manager', 'manager@finshield.com', 'manager'),
('staff', '$2b$08$UrhJVFKT5v/IltCa0MYmEOC3EIAqQ6lsdsk3I4NO9oRQulDdOVMUG', 'Support Staff', 'staff@finshield.com', 'staff');

-- 18 Policies across types, statuses, and regions
INSERT INTO policies (policy_number, holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, status, region, created_by) VALUES
('POL-H-0001', 'Rajesh Kumar', 'rajesh@example.com', 'health', 500.00, 100000.00, '2026-01-01', '2027-01-01', 'active', 'Mumbai', 2),
('POL-A-0002', 'Priya Sharma', 'priya@example.com', 'auto', 1200.00, 50000.00, '2026-02-15', '2027-02-15', 'active', 'Delhi', 2),
('POL-L-0003', 'Amit Patel', 'amit@example.com', 'life', 3500.00, 500000.00, '2025-06-01', '2045-06-01', 'active', 'Bangalore', 2),
('POL-P-0004', 'Sunita Reddy', 'sunita@example.com', 'property', 2200.00, 250000.00, '2026-03-01', '2027-03-01', 'active', 'Chennai', 2),
('POL-B-0005', 'Vikram Singh', 'vikram@example.com', 'business', 5000.00, 750000.00, '2026-01-15', '2027-01-15', 'active', 'Pune', 2),
('POL-H-0006', 'Anita Desai', 'anita@example.com', 'health', 800.00, 200000.00, '2025-11-01', '2026-11-01', 'active', 'Hyderabad', 2),
('POL-A-0007', 'Rohit Mehra', 'rohit@example.com', 'auto', 950.00, 45000.00, '2025-09-01', '2026-09-01', 'expired', 'Mumbai', 2),
('POL-L-0008', 'Kavita Joshi', 'kavita@example.com', 'life', 4200.00, 600000.00, '2026-04-01', '2046-04-01', 'active', 'Delhi', 2),
('POL-P-0009', 'Deepak Nair', 'deepak@example.com', 'property', 1800.00, 180000.00, '2025-07-01', '2026-07-01', 'expired', 'Bangalore', 2),
('POL-B-0010', 'Meena Kapoor', 'meena@example.com', 'business', 6500.00, 900000.00, '2026-05-01', '2027-05-01', 'active', 'Chennai', 2),
('POL-H-0011', 'Suresh Iyer', 'suresh@example.com', 'health', 650.00, 150000.00, '2026-02-01', '2027-02-01', 'pending', 'Pune', 2),
('POL-A-0012', 'Lakshmi Das', 'lakshmi@example.com', 'auto', 1100.00, 55000.00, '2026-06-01', '2027-06-01', 'active', 'Hyderabad', 2),
('POL-L-0013', 'Manoj Tiwari', 'manoj@example.com', 'life', 2800.00, 400000.00, '2026-01-01', '2046-01-01', 'cancelled', 'Mumbai', 1),
('POL-P-0014', 'Neha Gupta', 'neha@example.com', 'property', 3100.00, 350000.00, '2026-03-15', '2027-03-15', 'active', 'Delhi', 2),
('POL-B-0015', 'Arjun Rao', 'arjun@example.com', 'business', 4800.00, 680000.00, '2026-04-01', '2027-04-01', 'active', 'Bangalore', 2),
('POL-H-0016', 'Pooja Verma', 'pooja@example.com', 'health', 720.00, 175000.00, '2025-12-01', '2026-12-01', 'active', 'Chennai', 2),
('POL-A-0017', 'Kiran Bhat', 'kiran@example.com', 'auto', 1350.00, 60000.00, '2026-05-15', '2027-05-15', 'pending', 'Pune', 2),
('POL-L-0018', 'Divya Menon', 'divya@example.com', 'life', 3000.00, 450000.00, '2026-06-01', '2046-06-01', 'active', 'Hyderabad', 2);

-- 12 Claims across types, statuses
INSERT INTO claims (claim_number, policy_id, claimant_name, claim_type, description, claim_amount, status, assigned_to) VALUES
('CLM-2026-0001', 1, 'Rajesh Kumar', 'medical', 'Emergency hospitalization for cardiac event', 15000.00, 'submitted', NULL),
('CLM-2026-0002', 2, 'Priya Sharma', 'accident', 'Rear-end collision on NH48', 5000.00, 'approved', 3),
('CLM-2026-0003', 4, 'Sunita Reddy', 'natural_disaster', 'Flood damage to ground floor property', 45000.00, 'under_review', 3),
('CLM-2026-0004', 5, 'Vikram Singh', 'theft', 'Office equipment stolen during break-in', 12000.00, 'settled', 3),
('CLM-2026-0005', 6, 'Anita Desai', 'medical', 'Planned surgery — knee replacement', 25000.00, 'approved', 3),
('CLM-2026-0006', 7, 'Rohit Mehra', 'accident', 'Multi-vehicle pileup, total loss', 42000.00, 'rejected', 3),
('CLM-2026-0007', 3, 'Amit Patel', 'other', 'Critical illness diagnosis', 80000.00, 'submitted', NULL),
('CLM-2026-0008', 10, 'Meena Kapoor', 'theft', 'Warehouse inventory theft', 35000.00, 'under_review', 3),
('CLM-2026-0009', 14, 'Neha Gupta', 'natural_disaster', 'Earthquake structural damage', 55000.00, 'submitted', NULL),
('CLM-2026-0010', 12, 'Lakshmi Das', 'accident', 'Side-impact collision at intersection', 8500.00, 'approved', 3),
('CLM-2026-0011', 16, 'Pooja Verma', 'medical', 'Maternity and neonatal care', 18000.00, 'settled', 3),
('CLM-2026-0012', 15, 'Arjun Rao', 'other', 'Business interruption due to fire', 95000.00, 'under_review', 3);

-- Audit log entries from seed operations
INSERT INTO audit_log (user_id, action, target_type, target_id, details) VALUES
(1, 'SYSTEM_INIT', 'system', NULL, 'Database initialized with seed data'),
(1, 'USER_CREATE', 'user', 2, 'Created manager account'),
(1, 'USER_CREATE', 'user', 3, 'Created staff account'),
(2, 'POLICY_CREATE', 'policy', 1, 'Created health policy POL-H-0001'),
(2, 'POLICY_CREATE', 'policy', 5, 'Created business policy POL-B-0005');
