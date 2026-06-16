const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

describe('System and Users API', () => {
  const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'test_secret');
  const mockDb = require('../config/db');

  it('should return system metrics to admin', async () => {
    const res = await request(app).get('/api/system/metrics').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.cpu_cores).toBeDefined();
  });

  it('should allow admin to fetch users', async () => {
    mockDb.query.mockResolvedValueOnce([[{ id: 1, username: 'admin' }]]);
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(1);
  });
});
