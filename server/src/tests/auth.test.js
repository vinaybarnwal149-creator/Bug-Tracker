import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import './setup.js';

describe('Auth API Endpoints', () => {
  const app = createApp();

  const validUser = {
    name: 'Test Engineer',
    email: 'tester@example.com',
    password: 'Password123!'
  };

  it('registers a new user successfully and returns access token + cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.name).toBe('Test Engineer');
    expect(res.body.data.user.email).toBe('tester@example.com');
    expect(res.body.data.user.password).toBeUndefined(); // Password hash must never leak

    // Check refresh cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('refreshToken='))).toBe(true);
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('rejects duplicate email registration with 409', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects weak password with 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Weak User',
        email: 'weak@example.com',
        password: 'pass'
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in an existing user with correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: validUser.email,
        password: validUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('rejects login with wrong password with 401 generic message', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: validUser.email,
        password: 'WrongPassword123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('fetches current user profile with valid Bearer token', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const token = regRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('rejects unauthorized access without token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
