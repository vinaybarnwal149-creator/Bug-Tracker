import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { Comment } from '../models/Comment.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { env } from '../config/env.js';

export const seedDatabase = async (isStandalone = true) => {
  if (env.NODE_ENV === 'production') {
    console.error('Refusing to seed database in production environment!');
    if (isStandalone) process.exit(1);
    return;
  }

  try {
    if (isStandalone) {
      console.log('Connecting to database...');
      await connectDB();
    }

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Ticket.deleteMany({}),
      Comment.deleteMany({}),
      RefreshToken.deleteMany({})
    ]);

    console.log('Creating demo users...');
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const users = await User.create([
      { name: 'Alex Owner', email: 'owner@demo.com', password: hashedPassword, avatarColor: '#4F46E5' },
      { name: 'Morgan Manager', email: 'manager@demo.com', password: hashedPassword, avatarColor: '#7C3AED' },
      { name: 'Devin Developer', email: 'dev@demo.com', password: hashedPassword, avatarColor: '#10B981' },
      { name: 'Val Viewer', email: 'viewer@demo.com', password: hashedPassword, avatarColor: '#F59E0B' }
    ]);

    const [alex, morgan, devin, val] = users;

    console.log('Creating demo projects...');
    const webProject = await Project.create({
      title: 'Website Revamp',
      key: 'WEB',
      description: 'Complete overhaul of marketing website and customer portal.',
      owner: alex._id,
      ticketSeq: 12,
      members: [
        { user: alex._id, role: 'owner', joinedAt: new Date() },
        { user: morgan._id, role: 'manager', joinedAt: new Date() },
        { user: devin._id, role: 'developer', joinedAt: new Date() },
        { user: val._id, role: 'viewer', joinedAt: new Date() }
      ]
    });

    const mobProject = await Project.create({
      title: 'Mobile App',
      key: 'MOB',
      description: 'iOS and Android client apps built with React Native.',
      owner: alex._id,
      ticketSeq: 6,
      members: [
        { user: alex._id, role: 'owner', joinedAt: new Date() },
        { user: devin._id, role: 'developer', joinedAt: new Date() }
      ]
    });

    console.log('Creating demo tickets...');
    const sampleTickets = [
      {
        project: webProject._id,
        number: 1,
        key: 'WEB-1',
        title: 'Fix mobile responsiveness in navigation header',
        description: 'The hamburger menu does not open reliably on Safari iOS 17.',
        type: 'bug',
        priority: 'high',
        status: 'in_progress',
        position: 1024,
        reporter: alex._id,
        assignee: devin._id,
        labels: ['frontend', 'mobile'],
        dueDate: new Date(Date.now() + 86400000 * 2),
        commentCount: 2
      },
      {
        project: webProject._id,
        number: 2,
        key: 'WEB-2',
        title: 'Implement Dark Mode toggle in user preferences',
        description: 'Add Tailwind dark variant classes and persist theme choice in localStorage.',
        type: 'feature',
        priority: 'medium',
        status: 'todo',
        position: 1024,
        reporter: morgan._id,
        assignee: devin._id,
        labels: ['frontend', 'ui'],
        dueDate: new Date(Date.now() + 86400000 * 7),
        commentCount: 1
      },
      {
        project: webProject._id,
        number: 3,
        key: 'WEB-3',
        title: 'Setup automated CI workflow with GitHub Actions',
        description: 'Run linter and vitest on every pull request to main branch.',
        type: 'task',
        priority: 'low',
        status: 'done',
        position: 1024,
        reporter: devin._id,
        assignee: devin._id,
        labels: ['devops'],
        completedAt: new Date(),
        commentCount: 0
      },
      {
        project: webProject._id,
        number: 4,
        key: 'WEB-4',
        title: 'Resolve memory leak in WebSocket connection listener',
        description: 'Listeners are not cleanly removed upon component unmount, causing CPU spikes.',
        type: 'bug',
        priority: 'critical',
        status: 'in_progress',
        position: 2048,
        reporter: alex._id,
        assignee: devin._id,
        labels: ['backend', 'performance'],
        dueDate: new Date(Date.now() + 86400000),
        commentCount: 2
      },
      {
        project: webProject._id,
        number: 5,
        key: 'WEB-5',
        title: 'Optimize image assets with WebP conversion',
        description: 'Reduce homepage bundle size by converting hero pngs to webp format.',
        type: 'task',
        priority: 'low',
        status: 'todo',
        position: 2048,
        reporter: morgan._id,
        assignee: null,
        labels: ['assets', 'performance'],
        commentCount: 0
      },
      {
        project: webProject._id,
        number: 6,
        key: 'WEB-6',
        title: 'Security audit on JWT cookie configuration',
        description: 'Verify httpOnly, Secure flag, and Lax/None SameSite settings across environments.',
        type: 'task',
        priority: 'critical',
        status: 'done',
        position: 2048,
        reporter: devin._id,
        assignee: devin._id,
        labels: ['security'],
        completedAt: new Date(),
        commentCount: 1
      },
      {
        project: webProject._id,
        number: 7,
        key: 'WEB-7',
        title: 'Add export to CSV capability on issue list view',
        description: 'Allow managers and owners to download filtered ticket data.',
        type: 'feature',
        priority: 'medium',
        status: 'todo',
        position: 3072,
        reporter: morgan._id,
        assignee: null,
        labels: ['export'],
        commentCount: 0
      },
      {
        project: webProject._id,
        number: 8,
        key: 'WEB-8',
        title: 'Add keyboard drag and drop accessibility support',
        description: 'Support Space to lift, arrow keys to move, and Space to drop using dnd-kit.',
        type: 'feature',
        priority: 'high',
        status: 'done',
        position: 3072,
        reporter: alex._id,
        assignee: devin._id,
        labels: ['a11y'],
        completedAt: new Date(),
        commentCount: 0
      }
    ];

    const createdTickets = await Ticket.create(sampleTickets);

    console.log('Creating demo comments...');
    const t1 = createdTickets[0];
    const rootComment1 = await Comment.create({
      ticket: t1._id,
      project: webProject._id,
      author: morgan._id,
      body: 'I reproduced this bug on an iPhone 15 running Safari 17.2.'
    });

    await Comment.create({
      ticket: t1._id,
      project: webProject._id,
      author: devin._id,
      body: 'Thanks for verifying Morgan, fixing the z-index and tap event handler now.',
      parent: rootComment1._id
    });

    const t4 = createdTickets[3];
    const rootComment2 = await Comment.create({
      ticket: t4._id,
      project: webProject._id,
      author: alex._id,
      body: 'Production telemetry triggered an alert for this. High priority.'
    });

    await Comment.create({
      ticket: t4._id,
      project: webProject._id,
      author: devin._id,
      body: 'Found the unhandled event listener in SocketProvider. PR incoming.',
      parent: rootComment2._id
    });

    console.log('Database seeded successfully!');
    console.log('Demo accounts (password for all: Password123!):');
    console.log(' - owner@demo.com (Alex Owner)');
    console.log(' - manager@demo.com (Morgan Manager)');
    console.log(' - dev@demo.com (Devin Developer)');
    console.log(' - viewer@demo.com (Val Viewer)');

    if (isStandalone) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('Seed error:', err);
    if (isStandalone) {
      await disconnectDB();
      process.exit(1);
    }
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(true);
}




