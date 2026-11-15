import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { Comment } from '../models/Comment.js';
import { ApiError } from '../utils/ApiError.js';

export const getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({ 'members.user': userId })
      .populate('members.user', 'name email avatarColor')
      .sort({ updatedAt: -1 })
      .lean();

    const projectIds = projects.map((p) => p._id);

    // Aggregate ticket counts for each project
    const ticketCounts = await Ticket.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: { project: '$project', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    for (const item of ticketCounts) {
      const pId = item._id.project.toString();
      if (!countMap[pId]) {
        countMap[pId] = { todo: 0, in_progress: 0, done: 0 };
      }
      countMap[pId][item._id.status] = item.count;
    }

    const data = projects.map((p) => {
      const myMembership = p.members.find((m) => m.user?._id?.toString() === userId.toString());
      return {
        id: p._id.toString(),
        title: p.title,
        key: p.key,
        description: p.description,
        myRole: myMembership ? myMembership.role : 'viewer',
        memberCount: p.members.length,
        ticketCounts: countMap[p._id.toString()] || { todo: 0, in_progress: 0, done: 0 },
        members: p.members.slice(0, 4).map((m) => ({
          user: m.user ? {
            id: m.user._id.toString(),
            name: m.user.name,
            email: m.user.email,
            avatarColor: m.user.avatarColor
          } : null,
          role: m.role
        }))
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { title, key, description } = req.body;
    const existing = await Project.findOne({ key: key.toUpperCase() });
    if (existing) {
      throw new ApiError(409, 'KEY_TAKEN', 'Project key is already in use');
    }

    const project = await Project.create({
      title,
      key: key.toUpperCase(),
      description: description || '',
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          joinedAt: new Date()
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        ...project.toJSON(),
        myRole: 'owner'
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.project._id)
      .populate('members.user', 'name email avatarColor')
      .lean();

    const myMembership = project.members.find(
      (m) => m.user?._id?.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: {
        id: project._id.toString(),
        title: project.title,
        key: project.key,
        description: project.description,
        owner: project.owner.toString(),
        ticketSeq: project.ticketSeq,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        myRole: myMembership ? myMembership.role : 'viewer',
        members: project.members.map((m) => ({
          user: m.user ? {
            id: m.user._id.toString(),
            name: m.user.name,
            email: m.user.email,
            avatarColor: m.user.avatarColor
          } : null,
          role: m.role,
          joinedAt: m.joinedAt
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (title) req.project.title = title;
    if (description !== undefined) req.project.description = description;

    await req.project.save();

    res.json({
      success: true,
      data: {
        ...req.project.toJSON(),
        myRole: req.myRole
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const projectId = req.project._id;

    // Cascade delete
    await Comment.deleteMany({ project: projectId });
    await Ticket.deleteMany({ project: projectId });
    await Project.findByIdAndDelete(projectId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getProjectStats = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const userId = req.user._id;

    const tickets = await Ticket.find({ project: projectId }).lean();

    let total = tickets.length;
    let todo = 0;
    let in_progress = 0;
    let done = 0;
    let assignedToMe = 0;
    let overdue = 0;
    const now = new Date();

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    for (const t of tickets) {
      if (t.status === 'todo') todo++;
      if (t.status === 'in_progress') in_progress++;
      if (t.status === 'done') done++;

      if (t.assignee && t.assignee.toString() === userId.toString()) {
        assignedToMe++;
      }

      if (t.priority && byPriority[t.priority] !== undefined) {
        byPriority[t.priority]++;
      }

      if (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now) {
        overdue++;
      }
    }

    res.json({
      success: true,
      data: {
        total,
        todo,
        in_progress,
        done,
        assignedToMe,
        overdue,
        byPriority
      }
    });
  } catch (err) {
    next(err);
  }
};

export const checkKeyAvailable = async (req, res, next) => {
  try {
    const key = (req.query.key || '').trim().toUpperCase();
    if (!key || !/^[A-Z]{2,5}$/.test(key)) {
      return res.json({ success: true, data: { available: false } });
    }

    const existing = await Project.findOne({ key });
    res.json({
      success: true,
      data: {
        available: !existing
      }
    });
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (role === 'owner') {
      throw new ApiError(400, 'BAD_REQUEST', 'Cannot assign owner role');
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'No user with that email — ask them to register first');
    }

    const isMember = req.project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (isMember) {
      throw new ApiError(409, 'ALREADY_MEMBER', 'User is already a member of this project');
    }

    req.project.members.push({
      user: userToAdd._id,
      role,
      joinedAt: new Date()
    });

    await req.project.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userToAdd._id.toString(),
          name: userToAdd.name,
          email: userToAdd.email,
          avatarColor: userToAdd.avatarColor
        },
        role,
        joinedAt: new Date()
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const { role } = req.body;

    if (role === 'owner') {
      throw new ApiError(400, 'BAD_REQUEST', 'Cannot assign owner role');
    }

    const member = req.project.members.find(
      (m) => m.user.toString() === targetUserId
    );
    if (!member) {
      throw new ApiError(404, 'NOT_FOUND', 'Member not found');
    }

    if (member.role === 'owner') {
      throw new ApiError(403, 'FORBIDDEN', 'Cannot alter the project owner role');
    }

    member.role = role;
    await req.project.save();

    res.json({
      success: true,
      data: {
        userId: targetUserId,
        role: member.role
      }
    });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const isSelf = targetUserId === req.user._id.toString();

    const member = req.project.members.find(
      (m) => m.user.toString() === targetUserId
    );
    if (!member) {
      throw new ApiError(404, 'NOT_FOUND', 'Member not found');
    }

    if (member.role === 'owner') {
      throw new ApiError(400, 'BAD_REQUEST', 'Project owner cannot leave or be removed; project must be deleted');
    }

    // If not self, must be manager or owner
    if (!isSelf && !['owner', 'manager'].includes(req.myRole)) {
      throw new ApiError(403, 'FORBIDDEN', 'Only managers or owner can remove members');
    }

    req.project.members = req.project.members.filter(
      (m) => m.user.toString() !== targetUserId
    );
    await req.project.save();

    // Cascade: unassign user's tickets in this project
    await Ticket.updateMany(
      { project: req.project._id, assignee: targetUserId },
      { assignee: null }
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
