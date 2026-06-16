const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

describe('Reports API', () => {
  const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'test_secret');
  const staffToken = jwt.sign({ id: 3, username: 'staff', role: 'staff' }, process.env.JWT_SECRET || 'test_secret');
  const mockDb = require('../config/db');

  it('should deny staff from accessing executive reports', async () => {
    const res = await request(app).get('/api/reports/executive').set('Authorization', `Bearer ${staffToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should allow admin to access executive reports', async () => {
    mockDb.query.mockResolvedValueOnce([[{ total_revenue: 1000 }]]);
    mockDb.query.mockResolvedValueOnce([[{ total_payout: 500 }]]);
    mockDb.query.mockResolvedValueOnce([[{ region: 'Mumbai', count: 1, revenue: 1000 }]]);
    
    const res = await request(app).get('/api/reports/executive').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.total_revenue).toBeDefined();
  });
});
