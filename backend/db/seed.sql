USE finshield;

-- Passwords are 'admin123', 'manager123', 'staff123' respectively.
-- These are bcrypt hashes for the initial seed data.
INSERT INTO users (username, password_hash, full_name, email, role) VALUES 
('admin', '$2b$08$aGLv1DcaxpQbtSTAfhF5Xeoz8GjlUUYEH6FZZc5IzoyWOIj3UbOue', 'System Admin', 'admin@finshield.com', 'admin'),
('manager', '$2b$08$geoqk5ZSDi6q.FpjjUVHhe5iXSXapjXfPjWbjfySXuz.a/L0Ee7U6', 'Branch Manager', 'manager@finshield.com', 'manager'),
('staff', '$2b$08$UrhJVFKT5v/IltCa0MYmEOC3EIAqQ6lsdsk3I4NO9oRQulDdOVMUG', 'Support Staff', 'staff@finshield.com', 'staff');

INSERT INTO policies (policy_number, holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, status, region, created_by) VALUES
('POL-H-0001', 'John Doe', 'john@example.com', 'health', 500.00, 100000.00, '2026-01-01', '2027-01-01', 'active', 'Mumbai', 2),
('POL-A-0002', 'Jane Smith', 'jane@example.com', 'auto', 1200.00, 50000.00, '2026-02-15', '2027-02-15', 'active', 'Delhi', 2);

INSERT INTO claims (claim_number, policy_id, claimant_name, claim_type, description, claim_amount, status, assigned_to) VALUES
('CLM-2026-0001', 1, 'John Doe', 'medical', 'Hospital stay', 15000.00, 'submitted', NULL),
('CLM-2026-0002', 2, 'Jane Smith', 'accident', 'Car accident', 5000.00, 'approved', 3);
