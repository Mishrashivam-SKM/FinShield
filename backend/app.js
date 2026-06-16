const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Health check with DB status and uptime
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (e) { /* keep disconnected */ }
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db_status: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Route imports
const authRoutes = require('./routes/auth');
const policyRoutes = require('./routes/policies');
const dashboardRoutes = require('./routes/dashboard');
const claimsRoutes = require('./routes/claims');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const systemRoutes = require('./routes/system');

app.use('/api/auth', authRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/system', systemRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
