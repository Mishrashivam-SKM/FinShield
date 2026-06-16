const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

// GET /api/policies — List all
router.get('/', auth, async (req, res) => {
  try {
    const [policies] = await db.query('SELECT * FROM policies ORDER BY created_at DESC');
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policies', details: error.message });
  }
});

// GET /api/policies/:id — Single policy detail
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM policies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// POST /api/policies — Create (Manager+)
router.post('/', auth, rbac(['admin', 'manager']), async (req, res) => {
  try {
    const { policy_number, holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, region } = req.body;
    await db.query(
      `INSERT INTO policies (policy_number, holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, region, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [policy_number, holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, region, req.user.id]
    );
    res.status(201).json({ message: 'Policy created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create policy', details: error.message });
  }
});

// PUT /api/policies/:id — Update (Manager+)
router.put('/:id', auth, rbac(['admin', 'manager']), async (req, res) => {
  try {
    const { holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, status, region } = req.body;
    await db.query(
      `UPDATE policies SET holder_name=?, holder_email=?, policy_type=?, premium_amount=?, coverage_amount=?, start_date=?, end_date=?, status=?, region=? WHERE id=?`,
      [holder_name, holder_email, policy_type, premium_amount, coverage_amount, start_date, end_date, status, region, req.params.id]
    );
    res.json({ message: 'Policy updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

// DELETE /api/policies/:id — Cancel (Admin only)
router.delete('/:id', auth, rbac(['admin']), async (req, res) => {
  try {
    await db.query('UPDATE policies SET status = "cancelled" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Policy cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel policy' });
  }
});

module.exports = router;
