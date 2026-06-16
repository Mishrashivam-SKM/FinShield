const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

// GET /api/dashboard/stats — KPIs for all roles
router.get('/stats', auth, async (req, res) => {
  try {
    const [[{ total_policies }]] = await db.query('SELECT COUNT(*) as total_policies FROM policies');
    const [[{ active_claims }]] = await db.query("SELECT COUNT(*) as active_claims FROM claims WHERE status IN ('submitted','under_review','approved')");
    const [[{ total_premiums }]] = await db.query("SELECT COALESCE(SUM(premium_amount),0) as total_premiums FROM policies WHERE status = 'active'");
    const [[{ total_claims_amount }]] = await db.query('SELECT COALESCE(SUM(claim_amount),0) as total_claims_amount FROM claims');

    res.json({ total_policies, active_claims, total_premiums, total_claims_amount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/charts — Chart data (Manager+)
router.get('/charts', auth, rbac(['admin', 'manager']), async (req, res) => {
  try {
    const [claimsByType] = await db.query('SELECT claim_type, COUNT(*) as count FROM claims GROUP BY claim_type');
    const [policiesByRegion] = await db.query('SELECT region, COUNT(*) as count FROM policies GROUP BY region');
    const [policiesByStatus] = await db.query('SELECT status, COUNT(*) as count FROM policies GROUP BY status');

    res.json({ claims_by_type: claimsByType, policies_by_region: policiesByRegion, policies_by_status: policiesByStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

module.exports = router;
