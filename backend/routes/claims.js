const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

// GET /api/claims - List all claims
router.get('/', auth, async (req, res) => {
  try {
    const [claims] = await db.query('SELECT * FROM claims');
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// GET /api/claims/:id - Get single claim details
router.get('/:id', auth, async (req, res) => {
  try {
    const [claims] = await db.query('SELECT * FROM claims WHERE id = ?', [req.params.id]);
    if(claims.length === 0) return res.status(404).json({ error: 'Claim not found' });
    res.json(claims[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// POST /api/claims - Submit new claim
router.post('/', auth, async (req, res) => {
  try {
    const { claim_number, policy_id, claimant_name, claim_type, description, claim_amount } = req.body;
    await db.query(
      `INSERT INTO claims (claim_number, policy_id, claimant_name, claim_type, description, claim_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [claim_number, policy_id, claimant_name, claim_type, description, claim_amount]
    );
    res.status(201).json({ message: 'Claim submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

// PUT /api/claims/:id - Update claim status (manager/admin)
router.put('/:id', auth, rbac(['admin', 'manager']), async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE claims SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Claim updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

// PUT /api/claims/:id/assign - Assign claim to staff (manager/admin)
router.put('/:id/assign', auth, rbac(['admin', 'manager']), async (req, res) => {
  try {
    const { assigned_to } = req.body;
    await db.query('UPDATE claims SET assigned_to = ? WHERE id = ?', [assigned_to, req.params.id]);
    res.json({ message: 'Claim assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign claim' });
  }
});

module.exports = router;
