const request = require('supertest');
const app = require('../app');

describe('Auth API', () => {
  it('should return 401 for invalid login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'invalid', password: 'wrongpassword' });
      
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBe('Invalid username or password');
  });

  it('should authenticate admin and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('admin');
  });
});
