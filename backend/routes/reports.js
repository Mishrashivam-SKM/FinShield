const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

// GET /api/reports/executive - Admin only aggregated insights
router.get('/executive', auth, rbac(['admin']), async (req, res) => {
  try {
    const [[{ total_revenue }]] = await db.query('SELECT SUM(premium_amount) as total_revenue FROM policies WHERE status = "active"');
    const [[{ total_payout }]] = await db.query('SELECT SUM(claim_amount) as total_payout FROM claims WHERE status = "settled"');
    const [regionBreakdown] = await db.query('SELECT region, COUNT(*) as count, SUM(premium_amount) as revenue FROM policies GROUP BY region');
    
    res.json({
      total_revenue: total_revenue || 0,
      total_payout: total_payout || 0,
      region_breakdown: regionBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate executive report' });
  }
});

// GET /api/reports/claims - Manager+ claims analytics
router.get('/claims', auth, rbac(['admin', 'manager']), async (req, res) => {
  try {
    const [claimsByType] = await db.query('SELECT claim_type, COUNT(*) as count FROM claims GROUP BY claim_type');
    const [claimsByStatus] = await db.query('SELECT status, COUNT(*) as count FROM claims GROUP BY status');
    
    res.json({
      by_type: claimsByType,
      by_status: claimsByStatus
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate claims report' });
  }
});

module.exports = router;
