const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const os = require('os');

const router = express.Router();

// GET /api/system/metrics - Admin only system resource usage
router.get('/metrics', auth, rbac(['admin']), (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const metrics = {
      cpu_arch: os.arch(),
      cpu_cores: os.cpus().length,
      total_memory_mb: (totalMem / 1024 / 1024).toFixed(2),
      free_memory_mb: (freeMem / 1024 / 1024).toFixed(2),
      load_average: os.loadavg(),
      uptime_seconds: os.uptime()
    };
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve system metrics' });
  }
});

// GET /api/audit-log - Admin only audit trail viewer
router.get('/audit-log', auth, rbac(['admin']), async (req, res) => {
  try {
    const [logs] = await db.query('SELECT a.*, u.username FROM audit_log a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.timestamp DESC LIMIT 100');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
