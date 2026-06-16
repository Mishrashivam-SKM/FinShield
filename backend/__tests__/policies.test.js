const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

describe('Policies API', () => {
  const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'test_secret');
  const staffToken = jwt.sign({ id: 3, username: 'staff', role: 'staff' }, process.env.JWT_SECRET || 'test_secret');

  it('should allow staff to fetch policies', async () => {
    const res = await request(app)
      .get('/api/policies')
      .set('Authorization', `Bearer ${staffToken}`);
      
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should deny staff from creating a policy', async () => {
    const res = await request(app)
      .post('/api/policies')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ policy_number: 'P123', holder_name: 'Test' });
      
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Insufficient permissions');
  });

  it('should allow admin to create a policy', async () => {
    const res = await request(app)
      .post('/api/policies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        policy_number: 'POL-T-001',
        holder_name: 'Test Test',
        policy_type: 'auto',
        premium_amount: 500,
        coverage_amount: 10000,
        start_date: '2026-01-01',
        end_date: '2027-01-01'
      });
      
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('Policy created successfully');
  });
});
