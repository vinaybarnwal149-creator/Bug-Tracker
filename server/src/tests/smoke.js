import http from 'http';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';

const runSmokeTest = async () => {
  console.log('--- Starting TrackFlow Smoke Test ---');
  await connectDB();
  const app = createApp();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const request = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = { ...options.headers };
    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, headers: res.headers, data };
  };

  try {
    // 1. Health
    console.log('Testing /health...');
    const health = await fetch(`http://localhost:${port}/health`).then(r => r.json());
    if (health.status !== 'ok') throw new Error('Health check failed');
    console.log('✓ Health check passed');

    // 2. Register Owner
    console.log('Testing Register Owner...');
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Smoke Owner', email: `smoke_${Date.now()}@test.com`, password: 'Password123!' }
    });
    if (regRes.status !== 201) throw new Error(`Register failed with status ${regRes.status}`);
    const token = regRes.data.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('✓ Register passed');

    // 3. Me
    console.log('Testing /auth/me...');
    const meRes = await request('/auth/me', { headers: authHeaders });
    if (meRes.status !== 200 || !meRes.data.data.user) throw new Error('Auth me failed');
    console.log('✓ Auth /me passed');

    // 4. Create Project
    console.log('Testing Create Project...');
    const projRes = await request('/projects', {
      method: 'POST',
      headers: authHeaders,
      body: { title: 'Smoke Project', key: 'SMK' }
    });
    if (projRes.status !== 201) {
      console.error('Create project response:', JSON.stringify(projRes.data));
      throw new Error('Create project failed');
    }
    const projectId = projRes.data.data.id;
    console.log(`✓ Create project passed (id: ${projectId})`);

    // 5. List Projects
    console.log('Testing List Projects...');
    const listProjRes = await request('/projects', { headers: authHeaders });
    if (listProjRes.status !== 200 || listProjRes.data.data.length === 0) throw new Error('List projects failed');
    console.log(`✓ List projects passed (${listProjRes.data.data.length} projects)`);

    // 6. Create Ticket
    console.log('Testing Create Ticket...');
    const ticketRes = await request(`/projects/${projectId}/tickets`, {
      method: 'POST',
      headers: authHeaders,
      body: { title: 'Smoke Ticket 1', type: 'bug', priority: 'critical', status: 'todo' }
    });
    if (ticketRes.status !== 201) throw new Error('Create ticket failed');
    const ticketId = ticketRes.data.data.id;
    console.log(`✓ Create ticket passed (${ticketRes.data.data.key})`);

    // 7. Board
    console.log('Testing Kanban Board...');
    const boardRes = await request(`/projects/${projectId}/board`, { headers: authHeaders });
    if (boardRes.status !== 200 || boardRes.data.data.todo.length !== 1) throw new Error('Board query failed');
    console.log('✓ Kanban board query passed');

    // 8. Move Ticket
    console.log('Testing Move Ticket...');
    const moveRes = await request(`/tickets/${ticketId}/move`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'in_progress' }
    });
    if (moveRes.status !== 200 || moveRes.data.data.status !== 'in_progress') throw new Error('Move ticket failed');
    console.log('✓ Move ticket passed');

    // 9. Add Comment
    console.log('Testing Add Comment...');
    const cmtRes = await request(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: authHeaders,
      body: { body: 'This is a smoke test comment' }
    });
    if (cmtRes.status !== 201) throw new Error('Add comment failed');
    console.log('✓ Add comment passed');

    // 10. Get Comments
    console.log('Testing Get Comments...');
    const cmtsRes = await request(`/tickets/${ticketId}/comments`, { headers: authHeaders });
    if (cmtsRes.status !== 200 || cmtsRes.data.data.length !== 1) throw new Error('Get comments failed');
    console.log('✓ Get comments passed');

    // 11. Project Stats
    console.log('Testing Project Stats...');
    const statsRes = await request(`/projects/${projectId}/stats`, { headers: authHeaders });
    if (statsRes.status !== 200 || statsRes.data.data.total !== 1) throw new Error('Stats query failed');
    console.log('✓ Project stats passed');

    console.log('\nAll 11 Smoke Test checks passed with 100% success!');
  } finally {
    server.close();
    await disconnectDB();
  }
};

runSmokeTest().catch((err) => {
  console.error('Smoke test failure:', err);
  process.exit(1);
});
