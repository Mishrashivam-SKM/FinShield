const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

describe('Claims API', () => {
  const staffToken = jwt.sign({ id: 3, username: 'staff', role: 'staff' }, process.env.JWT_SECRET || 'test_secret');
  const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'test_secret');
  const mockDb = require('../config/db');

  beforeEach(() => {
    mockDb.query.mockClear();
  });

  it('should allow staff to fetch claims', async () => {
    mockDb.query.mockResolvedValueOnce([[{ id: 1, claim_number: 'CLM-001' }]]);
    const res = await request(app).get('/api/claims').set('Authorization', `Bearer ${staffToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should allow staff to submit a claim', async () => {
    mockDb.query.mockResolvedValueOnce([]);
    const res = await request(app).post('/api/claims').set('Authorization', `Bearer ${staffToken}`)
      .send({ claim_number: 'CLM-002', policy_id: 1, claimant_name: 'Test', claim_type: 'medical', claim_amount: 1000 });
    expect(res.statusCode).toEqual(201);
  });

  it('should reject staff from updating status', async () => {
    const res = await request(app).put('/api/claims/1').set('Authorization', `Bearer ${staffToken}`).send({ status: 'approved' });
    expect(res.statusCode).toEqual(403);
  });

  it('should allow admin to update claim status', async () => {
    mockDb.query.mockResolvedValueOnce([]);
    const res = await request(app).put('/api/claims/1').set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });
    expect(res.statusCode).toEqual(200);
  });
});
