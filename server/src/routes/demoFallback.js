import { Router } from 'express';
import { demoUser, demoProject, demoTickets, demoComments } from '../services/demoStore.js';
import { generateAccessToken, verifyAccessToken, getRefreshCookieOptions } from '../utils/tokens.js';

const router = Router();

// In-memory data store keyed by ID
const users = new Map();
const refreshTokens = new Map();
const projects = new Map();
const tickets = new Map();
const comments = [];

// Seed initial demo data for Alex Owner ONLY
users.set(demoUser.id, { ...demoUser });
users.set(demoUser.email.toLowerCase(), { ...demoUser });
refreshTokens.set('demo-refresh-token', demoUser.id);
refreshTokens.set(`rtk_${demoUser.id}`, demoUser.id);

projects.set(demoProject.id, {
  ...demoProject,
  members: demoProject.members.map((m) => ({
    user: { ...m.user },
    role: m.role
  }))
});

for (const t of demoTickets) {
  tickets.set(t.id, { ...t });
}

for (const c of demoComments) {
  comments.push({ ...c });
}

// Authentication middleware to extract current user from Bearer token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);
    if (decoded && decoded.sub) {
      req.userId = decoded.sub;
      req.currentUser = users.get(decoded.sub) || null;
      return next();
    }
  }
  return next();
};

router.use(authenticate);

// Health check
router.get('/health', (req, res) => {
  return res.json({ status: 'ok', mode: 'demo', time: new Date().toISOString() });
});

// 1. Auth Routes
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (normalizedEmail === 'owner@demo.com' && password === 'Password123!') {
    const accessToken = generateAccessToken(demoUser.id);
    const refreshId = `rtk_${demoUser.id}`;
    refreshTokens.set(refreshId, demoUser.id);
    res.cookie('refreshToken', refreshId, getRefreshCookieOptions());
    return res.json({
      success: true,
      data: {
        accessToken,
        user: demoUser
      }
    });
  }

  // Look up registered user
  const foundUser = users.get(normalizedEmail);
  if (foundUser) {
    const accessToken = generateAccessToken(foundUser.id);
    const refreshId = `rtk_${foundUser.id}_${Date.now()}`;
    refreshTokens.set(refreshId, foundUser.id);
    res.cookie('refreshToken', refreshId, getRefreshCookieOptions());
    return res.json({
      success: true,
      data: {
        accessToken,
        user: foundUser
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password'
    }
  });
});

router.post('/auth/register', (req, res) => {
  const { name, email } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !name) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Name and email are required' }
    });
  }

  if (users.has(normalizedEmail)) {
    return res.status(409).json({
      success: false,
      error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' }
    });
  }

  // Brand-new user: Starts COMPLETELY EMPTY (0 projects, 0 tickets, 0 comments, 0 notifications)
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    email: normalizedEmail,
    avatarColor: ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED'][Math.floor(Math.random() * 5)],
    createdAt: new Date().toISOString()
  };

  users.set(newUser.id, newUser);
  users.set(newUser.email, newUser);

  const accessToken = generateAccessToken(newUser.id);
  const refreshId = `rtk_${newUser.id}_${Date.now()}`;
  refreshTokens.set(refreshId, newUser.id);
  res.cookie('refreshToken', refreshId, getRefreshCookieOptions());

  return res.status(201).json({
    success: true,
    data: {
      accessToken,
      user: newUser
    }
  });
});

router.post('/auth/refresh', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' }
    });
  }

  const userId = refreshTokens.get(token);
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' }
    });
  }

  const user = users.get(userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not found' }
    });
  }

  const accessToken = generateAccessToken(user.id);
  return res.json({
    success: true,
    data: {
      accessToken,
      user
    }
  });
});

router.post('/auth/logout', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    refreshTokens.delete(token);
  }
  res.clearCookie('refreshToken', getRefreshCookieOptions());
  return res.status(204).send();
});

router.get('/auth/me', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    });
  }

  return res.json({
    success: true,
    data: {
      user: req.currentUser
    }
  });
});

// 2. User profile
router.get('/users/me', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    });
  }

  return res.json({
    success: true,
    data: {
      user: req.currentUser
    }
  });
});

router.patch('/users/me', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    });
  }

  const current = req.currentUser;
  Object.assign(current, req.body);
  users.set(current.id, current);
  users.set(current.email.toLowerCase(), current);
  return res.json({
    success: true,
    data: {
      user: current
    }
  });
});

router.patch('/users/me/password', (req, res) => {
  return res.json({ success: true, message: 'Password updated successfully' });
});

// Helper to check project membership
const checkProjectMembership = (project, userId) => {
  if (!project || !userId) return null;
  if (project.owner === userId) return 'owner';
  const member = project.members?.find((m) => {
    const mId = m.user?.id || m.user?._id || m.user;
    return mId === userId;
  });
  return member ? member.role : null;
};

// 3. Project routes
router.get('/projects', (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.json({ success: true, data: [] });
  }

  // Filter projects strictly by membership
  const userProjects = Array.from(projects.values()).filter((p) => {
    return Boolean(checkProjectMembership(p, userId));
  });

  const data = userProjects.map((p) => {
    const role = checkProjectMembership(p, userId) || 'viewer';
    return {
      ...p,
      myRole: role
    };
  });

  return res.json({ success: true, data });
});

router.post('/projects', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    });
  }

  const userId = req.currentUser.id;
  const user = req.currentUser;
  const { title, key, description } = req.body || {};

  const newProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: (title || 'New Project').trim(),
    key: (key || 'PRJ').trim().toUpperCase(),
    description: (description || '').trim(),
    owner: userId,
    myRole: 'owner',
    ticketSeq: 0,
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [{ user, role: 'owner', joinedAt: new Date().toISOString() }],
    ticketCounts: { todo: 0, in_progress: 0, done: 0 }
  };

  projects.set(newProject.id, newProject);
  return res.status(201).json({ success: true, data: newProject });
});

router.get('/projects/key-available', (req, res) => {
  const key = (req.query.key || '').trim().toUpperCase();
  const exists = Array.from(projects.values()).some((p) => p.key === key);
  return res.json({ success: true, data: { available: !exists } });
});

router.get('/projects/:projectId', (req, res) => {
  const userId = req.userId;
  const project = projects.get(req.params.projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const role = checkProjectMembership(project, userId);
  if (!role) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  return res.json({
    success: true,
    data: {
      ...project,
      myRole: role
    }
  });
});

router.get('/projects/:projectId/stats', (req, res) => {
  const userId = req.userId;
  const project = projects.get(req.params.projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const role = checkProjectMembership(project, userId);
  if (!role) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const projectTickets = Array.from(tickets.values()).filter((t) => t.project === req.params.projectId);
  let todo = 0, in_progress = 0, done = 0, assignedToMe = 0, overdue = 0;
  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };

  for (const t of projectTickets) {
    if (t.status === 'todo') todo++;
    if (t.status === 'in_progress') in_progress++;
    if (t.status === 'done') done++;
    if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
    const aId = t.assignee?.id || t.assignee?._id || t.assignee;
    if (aId === userId) assignedToMe++;
  }

  return res.json({
    success: true,
    data: {
      total: projectTickets.length,
      todo,
      in_progress,
      done,
      assignedToMe,
      overdue,
      byPriority
    }
  });
});

// 4. Board & Tickets
router.get('/projects/:projectId/board', (req, res) => {
  const userId = req.userId;
  const project = projects.get(req.params.projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const role = checkProjectMembership(project, userId);
  if (!role) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  let projectTickets = Array.from(tickets.values()).filter((t) => t.project === req.params.projectId);

  // Search and filter
  if (req.query.assignee === 'me') {
    projectTickets = projectTickets.filter((t) => {
      const aId = t.assignee?.id || t.assignee?._id || t.assignee;
      return aId === userId;
    });
  } else if (req.query.assignee === 'unassigned') {
    projectTickets = projectTickets.filter((t) => !t.assignee);
  }

  if (req.query.priority) {
    const pList = req.query.priority.split(',').map((p) => p.trim());
    projectTickets = projectTickets.filter((t) => pList.includes(t.priority));
  }

  if (req.query.type) {
    const tList = req.query.type.split(',').map((t) => t.trim());
    projectTickets = projectTickets.filter((t) => tList.includes(t.type));
  }

  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    projectTickets = projectTickets.filter((t) =>
      t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q)
    );
  }

  const todo = projectTickets.filter((t) => t.status === 'todo');
  const in_progress = projectTickets.filter((t) => t.status === 'in_progress');
  const done = projectTickets.filter((t) => t.status === 'done');

  return res.json({
    success: true,
    data: { todo, in_progress, done }
  });
});

router.get('/projects/:projectId/tickets', (req, res) => {
  const userId = req.userId;
  const project = projects.get(req.params.projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const role = checkProjectMembership(project, userId);
  if (!role) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  let projectTickets = Array.from(tickets.values()).filter((t) => t.project === req.params.projectId);

  if (req.query.status) {
    const sList = req.query.status.split(',').map((s) => s.trim());
    projectTickets = projectTickets.filter((t) => sList.includes(t.status));
  }

  if (req.query.priority) {
    const pList = req.query.priority.split(',').map((p) => p.trim());
    projectTickets = projectTickets.filter((t) => pList.includes(t.priority));
  }

  if (req.query.type) {
    const tList = req.query.type.split(',').map((t) => t.trim());
    projectTickets = projectTickets.filter((t) => tList.includes(t.type));
  }

  if (req.query.assignee === 'me') {
    projectTickets = projectTickets.filter((t) => {
      const aId = t.assignee?.id || t.assignee?._id || t.assignee;
      return aId === userId;
    });
  }

  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    projectTickets = projectTickets.filter((t) =>
      t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    data: projectTickets,
    meta: { page: 1, limit: 20, total: projectTickets.length, totalPages: 1 }
  });
});

router.post('/projects/:projectId/tickets', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    });
  }

  const userId = req.currentUser.id;
  const user = req.currentUser;
  const project = projects.get(req.params.projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const role = checkProjectMembership(project, userId);
  if (!role) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const { title, description, type, priority, status } = req.body || {};
  project.ticketSeq = (project.ticketSeq || 0) + 1;
  const ticketStatus = status || 'todo';

  const newTicket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    project: req.params.projectId,
    number: project.ticketSeq,
    key: `${project.key}-${project.ticketSeq}`,
    title: (title || '').trim(),
    description: (description || '').trim(),
    type: type || 'bug',
    priority: priority || 'medium',
    status: ticketStatus,
    position: (tickets.size + 1) * 1024,
    reporter: user,
    assignee: null,
    labels: [],
    dueDate: null,
    attachments: [],
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tickets.set(newTicket.id, newTicket);

  if (!project.ticketCounts) project.ticketCounts = { todo: 0, in_progress: 0, done: 0 };
  project.ticketCounts[ticketStatus] = (project.ticketCounts[ticketStatus] || 0) + 1;

  return res.status(201).json({ success: true, data: newTicket });
});

router.get('/tickets/:ticketId', (req, res) => {
  const userId = req.userId;
  const ticket = Array.from(tickets.values()).find(
    (t) => t.id === req.params.ticketId || t.key === req.params.ticketId
  );
  if (!ticket) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const project = projects.get(ticket.project);
  if (!project || !checkProjectMembership(project, userId)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  return res.json({ success: true, data: ticket });
});

router.patch('/tickets/:ticketId/move', (req, res) => {
  const userId = req.userId;
  const { status } = req.body || {};
  const ticket = Array.from(tickets.values()).find(
    (t) => t.id === req.params.ticketId || t.key === req.params.ticketId
  );
  if (!ticket) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const project = projects.get(ticket.project);
  if (!project || !checkProjectMembership(project, userId)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  if (status) {
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
  }
  return res.json({
    success: true,
    data: ticket,
    meta: { rebalanced: false }
  });
});

router.patch('/tickets/:ticketId', (req, res) => {
  const userId = req.userId;
  const ticket = Array.from(tickets.values()).find(
    (t) => t.id === req.params.ticketId || t.key === req.params.ticketId
  );
  if (!ticket) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const project = projects.get(ticket.project);
  if (!project || !checkProjectMembership(project, userId)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  Object.assign(ticket, req.body);
  ticket.updatedAt = new Date().toISOString();
  return res.json({ success: true, data: ticket });
});

router.delete('/tickets/:ticketId', (req, res) => {
  const userId = req.userId;
  const ticket = Array.from(tickets.values()).find(
    (t) => t.id === req.params.ticketId || t.key === req.params.ticketId
  );
  if (!ticket) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const project = projects.get(ticket.project);
  if (!project || !checkProjectMembership(project, userId)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  tickets.delete(ticket.id);
  return res.status(204).send();
});

// 5. Members
router.post('/projects/:projectId/members', (req, res) => {
  const project = projects.get(req.params.projectId);
  return res.status(201).json({ success: true, data: project?.members || [] });
});

router.patch('/projects/:projectId/members/:userId', (req, res) => {
  const project = projects.get(req.params.projectId);
  return res.json({ success: true, data: project?.members || [] });
});

router.delete('/projects/:projectId/members/:userId', (req, res) => {
  return res.status(204).send();
});

// 6. Comments
router.get('/tickets/:ticketId/comments', (req, res) => {
  const userId = req.userId;
  const ticket = Array.from(tickets.values()).find(
    (t) => t.id === req.params.ticketId || t.key === req.params.ticketId
  );
  if (!ticket) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const project = projects.get(ticket.project);
  if (!project || !checkProjectMembership(project, userId)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const ticketComments = comments.filter((c) => c.ticket === req.params.ticketId);
  return res.json({ success: true, data: ticketComments });
});

router.post('/tickets/:ticketId/comments', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    });
  }

  const userId = req.currentUser.id;
  const user = req.currentUser;
  const ticket = Array.from(tickets.values()).find(
    (t) => t.id === req.params.ticketId || t.key === req.params.ticketId
  );
  if (!ticket) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const project = projects.get(ticket.project);
  if (!project || !checkProjectMembership(project, userId)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const { body, parentId } = req.body || {};
  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ticket: req.params.ticketId,
    author: user,
    body: (body || '').trim(),
    createdAt: new Date().toISOString(),
    replies: []
  };

  if (parentId) {
    const parent = comments.find((c) => c.id === parentId);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push(newComment);
      return res.status(201).json({ success: true, data: newComment });
    }
  }

  comments.push(newComment);
  return res.status(201).json({ success: true, data: newComment });
});

// 7. Attachments & Assignee
router.put('/tickets/:ticketId/assignee', (req, res) => {
  const userId = req.userId;
  const ticket = Array.from(tickets.values()).find(
    (t) => t.id === req.params.ticketId || t.key === req.params.ticketId
  );
  if (!ticket) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  const project = projects.get(ticket.project);
  if (!project || !checkProjectMembership(project, userId)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
  }

  return res.json({ success: true, data: ticket });
});

router.post('/tickets/:ticketId/attachments', (req, res) => {
  return res.status(201).json({ success: true, data: [] });
});

router.delete('/tickets/:ticketId/attachments/:attachmentId', (req, res) => {
  return res.status(204).send();
});

export default router;
