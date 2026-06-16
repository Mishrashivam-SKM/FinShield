const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [policies] = await db.query('SELECT * FROM policies');
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policies', details: error.message });
  }
});

router.post('/', auth, rbac(['admin', 'manager']), async (req, res) => {
  try {
    const { policy_number, holder_name, policy_type, premium_amount, coverage_amount, start_date, end_date } = req.body;
    
    await db.query(
      `INSERT INTO policies (policy_number, holder_name, policy_type, premium_amount, coverage_amount, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [policy_number, holder_name, policy_type, premium_amount, coverage_amount, start_date, end_date, req.user.id]
    );
    res.status(201).json({ message: 'Policy created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create policy', details: error.message });
  }
});

module.exports = router;
