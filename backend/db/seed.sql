USE finshield;

-- Passwords: admin123, manager123, staff123
INSERT INTO users (username, password_hash, full_name, email, role) VALUES 
('admin', '$2b$08$aGLv1DcaxpQbtSTAfhF5Xeoz8GjlUUYEH6FZZc5IzoyWOIj3UbOue', 'System Admin', 'admin@finshield.com', 'admin'),
('manager', '$2b$08$geoqk5ZSDi6q.FpjjUVHhe5iXSXapjXfPjWbjfySXuz.a/L0Ee7U6', 'Branch Manager', 'manager@finshield.com', 'manager'),
('staff', '$2b$08$UrhJVFKT5v/IltCa0MYmEOC3EIAqQ6lsdsk3I4NO9oRQulDdOVMUG', 'Support Staff', 'staff@finshield.com', 'staff');

-- 18 Policies with realistic INR amounts
-- Health: premium ₹12k–45k/yr, coverage ₹3–10 lakh
-- Auto: premium ₹6k–18k/yr, coverage ₹2–8 lakh
-- Life: premium ₹25k–80k/yr, coverage ₹25–75 lakh
-- Property: premium ₹15k–50k/yr, coverage ₹15–50 lakh
-- Business: premium ₹40k–1.5L/yr, coverage ₹50L–2Cr
INSERT INTO policies (policy_number, holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, status, region, created_by) VALUES
('POL-H-0001', 'Rajesh Kumar',   'rajesh.kumar@gmail.com',    'health',   18500.00, 500000.00,   '2026-01-01', '2027-01-01', 'active',    'Mumbai',    2),
('POL-A-0002', 'Priya Sharma',   'priya.sharma@yahoo.com',    'auto',      8900.00, 350000.00,   '2026-02-15', '2027-02-15', 'active',    'Delhi',     2),
('POL-L-0003', 'Amit Patel',     'amit.patel@outlook.com',    'life',     45000.00, 5000000.00,  '2025-06-01', '2045-06-01', 'active',    'Bangalore', 2),
('POL-P-0004', 'Sunita Reddy',   'sunita.reddy@gmail.com',    'property', 28000.00, 2500000.00,  '2026-03-01', '2027-03-01', 'active',    'Chennai',   2),
('POL-B-0005', 'Vikram Singh',   'vikram.singh@hotmail.com',  'business', 95000.00, 15000000.00, '2026-01-15', '2027-01-15', 'active',    'Pune',      2),
('POL-H-0006', 'Anita Desai',    'anita.desai@gmail.com',     'health',   24000.00, 750000.00,   '2025-11-01', '2026-11-01', 'active',    'Hyderabad', 2),
('POL-A-0007', 'Rohit Mehra',    'rohit.mehra@rediffmail.com','auto',     12500.00, 450000.00,   '2025-09-01', '2026-09-01', 'expired',   'Mumbai',    2),
('POL-L-0008', 'Kavita Joshi',   'kavita.joshi@gmail.com',    'life',     62000.00, 7500000.00,  '2026-04-01', '2046-04-01', 'active',    'Delhi',     2),
('POL-P-0009', 'Deepak Nair',    'deepak.nair@yahoo.com',     'property', 22000.00, 1800000.00,  '2025-07-01', '2026-07-01', 'expired',   'Bangalore', 2),
('POL-B-0010', 'Meena Kapoor',   'meena.kapoor@gmail.com',    'business',135000.00, 20000000.00, '2026-05-01', '2027-05-01', 'active',    'Chennai',   2),
('POL-H-0011', 'Suresh Iyer',    'suresh.iyer@outlook.com',   'health',   15000.00, 300000.00,   '2026-02-01', '2027-02-01', 'pending',   'Pune',      2),
('POL-A-0012', 'Lakshmi Das',    'lakshmi.das@gmail.com',     'auto',     10200.00, 550000.00,   '2026-06-01', '2027-06-01', 'active',    'Hyderabad', 2),
('POL-L-0013', 'Manoj Tiwari',   'manoj.tiwari@gmail.com',    'life',     38000.00, 4000000.00,  '2026-01-01', '2046-01-01', 'cancelled', 'Mumbai',    1),
('POL-P-0014', 'Neha Gupta',     'neha.gupta@yahoo.com',      'property', 42000.00, 3500000.00,  '2026-03-15', '2027-03-15', 'active',    'Delhi',     2),
('POL-B-0015', 'Arjun Rao',      'arjun.rao@gmail.com',       'business', 78000.00, 12000000.00, '2026-04-01', '2027-04-01', 'active',    'Bangalore', 2),
('POL-H-0016', 'Pooja Verma',    'pooja.verma@hotmail.com',   'health',   32000.00, 1000000.00,  '2025-12-01', '2026-12-01', 'active',    'Chennai',   2),
('POL-A-0017', 'Kiran Bhat',     'kiran.bhat@gmail.com',      'auto',     14800.00, 600000.00,   '2026-05-15', '2027-05-15', 'pending',   'Pune',      2),
('POL-L-0018', 'Divya Menon',    'divya.menon@outlook.com',   'life',     55000.00, 6000000.00,  '2026-06-01', '2046-06-01', 'active',    'Hyderabad', 2);

-- 12 Claims with realistic INR amounts
-- Medical claims: ₹50k–5L
-- Accident claims: ₹30k–3L
-- Property/disaster: ₹2L–10L
-- Theft: ₹80k–4L
-- Business interruption: ₹5L–15L
INSERT INTO claims (claim_number, policy_id, claimant_name, claim_type, description, claim_amount, status, assigned_to) VALUES
('CLM-2026-0001', 1,  'Rajesh Kumar',  'medical',          'Emergency hospitalization — cardiac episode at Lilavati Hospital', 285000.00,  'submitted',    NULL),
('CLM-2026-0002', 2,  'Priya Sharma',  'accident',         'Rear-end collision on NH48 near Manesar toll plaza',               145000.00,  'approved',     3),
('CLM-2026-0003', 4,  'Sunita Reddy',  'natural_disaster', 'Flood damage to ground floor — Chennai Dec 2025 rains',            780000.00,  'under_review', 3),
('CLM-2026-0004', 5,  'Vikram Singh',  'theft',            'Office laptops and server equipment stolen during break-in',        320000.00,  'settled',      3),
('CLM-2026-0005', 6,  'Anita Desai',   'medical',          'Planned knee replacement surgery at Apollo Hospital',              425000.00,  'approved',     3),
('CLM-2026-0006', 7,  'Rohit Mehra',   'accident',         'Multi-vehicle pileup on Mumbai-Pune Expressway, total loss',        310000.00,  'rejected',     3),
('CLM-2026-0007', 3,  'Amit Patel',    'other',            'Critical illness diagnosis — cancer treatment at Tata Memorial',   1500000.00, 'submitted',    NULL),
('CLM-2026-0008', 10, 'Meena Kapoor',  'theft',            'Warehouse inventory theft — Ambattur Industrial Estate',            890000.00,  'under_review', 3),
('CLM-2026-0009', 14, 'Neha Gupta',    'natural_disaster', 'Earthquake structural damage to commercial property in Joshimath', 1200000.00, 'submitted',    NULL),
('CLM-2026-0010', 12, 'Lakshmi Das',   'accident',         'Side-impact collision at Jubilee Hills intersection',               95000.00,  'approved',     3),
('CLM-2026-0011', 16, 'Pooja Verma',   'medical',          'Maternity and neonatal ICU care at Fortis Hospital',                210000.00,  'settled',      3),
('CLM-2026-0012', 15, 'Arjun Rao',     'other',            'Business interruption due to electrical fire at Whitefield unit',  1450000.00, 'under_review', 3);

-- Audit log entries
INSERT INTO audit_log (user_id, action, target_type, target_id, details) VALUES
(1, 'SYSTEM_INIT',   'system', NULL, 'Database initialized with seed data — 18 policies, 12 claims'),
(1, 'USER_CREATE',   'user',   2,    'Created manager account (Branch Manager)'),
(1, 'USER_CREATE',   'user',   3,    'Created staff account (Support Staff)'),
(2, 'POLICY_CREATE', 'policy', 1,    'Created health policy POL-H-0001 for Rajesh Kumar — ₹5,00,000 coverage'),
(2, 'POLICY_CREATE', 'policy', 5,    'Created business policy POL-B-0005 for Vikram Singh — ₹1,50,00,000 coverage');
