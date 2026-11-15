import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import './setup.js';

describe('Projects API Endpoints & RBAC', () => {
  const app = createApp();

  let ownerToken;
  let devToken;
  let devEmail = 'dev@example.com';

  beforeEach(async () => {
    // Register owner
    const ownerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'Password123!'
    });
    ownerToken = ownerRes.body.data.accessToken;

    // Register dev
    const devRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Dev User',
      email: devEmail,
      password: 'Password123!'
    });
    devToken = devRes.body.data.accessToken;
  });

  it('allows authenticated user to create a project and assigns owner role', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Alpha Project',
        key: 'ALP',
        description: 'First test project'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.key).toBe('ALP');
    expect(res.body.data.myRole).toBe('owner');
  });

  it('rejects duplicate project keys with 409', async () => {
    await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Alpha', key: 'ALP' });

    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Another Alpha', key: 'ALP' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('KEY_TAKEN');
  });

  it('prevents non-members from accessing a project (returns 404 to avoid leaking existence)', async () => {
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Secret Project', key: 'SEC' });

    const projectId = projRes.body.data.id;

    // Developer tries to access before being added
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${devToken}`);

    expect(res.status).toBe(404);
  });

  it('allows owner to add a registered member by email', async () => {
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Team Project', key: 'TEAM' });

    const projectId = projRes.body.data.id;

    const addRes = await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: devEmail, role: 'developer' });

    expect(addRes.status).toBe(201);
    expect(addRes.body.data.role).toBe('developer');

    // Dev can now view project
    const devAccessRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${devToken}`);

    expect(devAccessRes.status).toBe(200);
    expect(devAccessRes.body.data.myRole).toBe('developer');
  });

  it('rejects adding an unregistered email with 404 USER_NOT_FOUND', async () => {
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Open Project', key: 'OPN' });

    const projectId = projRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'nonexistent@nowhere.com', role: 'developer' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });
});
