import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import './setup.js';

describe('Tickets & Comments Endpoints', () => {
  const app = createApp();

  let ownerToken;
  let devToken;
  let viewerToken;
  let projectId;

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
      email: 'dev@example.com',
      password: 'Password123!'
    });
    devToken = devRes.body.data.accessToken;

    // Register viewer
    const viewerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: 'Password123!'
    });
    viewerToken = viewerRes.body.data.accessToken;

    // Create project
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Bug Project', key: 'BUG' });
    projectId = projRes.body.data.id;

    // Add dev and viewer
    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'dev@example.com', role: 'developer' });

    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'viewer@example.com', role: 'viewer' });
  });

  it('generates sequential keys for tickets (BUG-1, BUG-2)', async () => {
    const t1 = await request(app)
      .post(`/api/v1/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'First Issue', priority: 'high', status: 'todo' });

    expect(t1.status).toBe(201);
    expect(t1.body.data.key).toBe('BUG-1');
    expect(t1.body.data.number).toBe(1);

    const t2 = await request(app)
      .post(`/api/v1/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Second Issue', priority: 'low', status: 'in_progress' });

    expect(t2.status).toBe(201);
    expect(t2.body.data.key).toBe('BUG-2');
    expect(t2.body.data.number).toBe(2);
  });

  it('retrieves board with tickets categorized by status', async () => {
    await request(app)
      .post(`/api/v1/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Task 1', status: 'todo' });

    await request(app)
      .post(`/api/v1/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Task 2', status: 'in_progress' });

    const boardRes = await request(app)
      .get(`/api/v1/projects/${projectId}/board`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(boardRes.status).toBe(200);
    expect(boardRes.body.data.todo.length).toBe(1);
    expect(boardRes.body.data.in_progress.length).toBe(1);
    expect(boardRes.body.data.done.length).toBe(0);
  });

  it('allows moving a ticket to another status', async () => {
    const t = await request(app)
      .post(`/api/v1/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Moveable Task', status: 'todo' });

    const ticketId = t.body.data.id;

    const moveRes = await request(app)
      .patch(`/api/v1/tickets/${ticketId}/move`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ status: 'done' });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.status).toBe('done');
    expect(moveRes.body.data.completedAt).toBeDefined();
  });

  it('rejects ticket creation by Viewer with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Unauthorized Ticket' });

    expect(res.status).toBe(403);
  });

  it('supports threaded comments and flattens replies to replies to single level', async () => {
    const t = await request(app)
      .post(`/api/v1/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Discussion Issue' });

    const ticketId = t.body.data.id;

    // Root comment
    const rootRes = await request(app)
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ body: 'Root discussion comment' });

    expect(rootRes.status).toBe(201);
    const rootId = rootRes.body.data.id;

    // First reply
    const reply1 = await request(app)
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ body: 'First reply', parentId: rootId });

    expect(reply1.status).toBe(201);
    const reply1Id = reply1.body.data.id;

    // Reply to reply -> must attach to rootId (flattening)
    const replyToReply = await request(app)
      .post(`/api/v1/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ body: 'Nested reply', parentId: reply1Id });

    expect(replyToReply.status).toBe(201);
    expect(replyToReply.body.data.parent).toBe(rootId);

    // Get comments list
    const commentsList = await request(app)
      .get(`/api/v1/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(commentsList.status).toBe(200);
    expect(commentsList.body.data.length).toBe(1); // 1 root comment
    expect(commentsList.body.data[0].replies.length).toBe(2); // 2 flattened replies under root
  });
});
