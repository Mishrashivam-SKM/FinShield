const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const [[{ total_policies }]] = await db.query('SELECT COUNT(*) as total_policies FROM policies');
    const [[{ active_claims }]] = await db.query('SELECT COUNT(*) as active_claims FROM claims WHERE status = "submitted" OR status = "approved"');
    
    res.json({ total_policies, active_claims });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
