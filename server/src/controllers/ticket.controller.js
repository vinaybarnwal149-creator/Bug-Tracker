import { Ticket } from '../models/Ticket.js';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';
import { ApiError } from '../utils/ApiError.js';
import { calculatePosition, POSITION_STEP } from '../utils/position.js';
import { can } from '../services/permissions.js';

// Helper to build MongoDB query filters from request query params
const buildTicketFilter = (projectId, query, currentUserId) => {
  const filter = { project: projectId };

  if (query.status) {
    const statuses = query.status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) filter.status = { $in: statuses };
  }

  if (query.priority) {
    const priorities = query.priority.split(',').map((p) => p.trim()).filter(Boolean);
    if (priorities.length > 0) filter.priority = { $in: priorities };
  }

  if (query.type) {
    const types = query.type.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length > 0) filter.type = { $in: types };
  }

  if (query.assignee) {
    if (query.assignee === 'me') {
      filter.assignee = currentUserId;
    } else if (query.assignee === 'unassigned') {
      filter.assignee = null;
    } else if (/^[0-9a-fA-F]{24}$/.test(query.assignee)) {
      filter.assignee = query.assignee;
    }
  }

  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { key: regex },
      { title: regex },
      { description: regex }
    ];
  }

  return filter;
};

export const getBoard = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const filter = buildTicketFilter(projectId, req.query, req.user._id);

    const tickets = await Ticket.find(filter)
      .sort({ position: 1 })
      .populate('reporter', 'name email avatarColor')
      .populate('assignee', 'name email avatarColor')
      .lean();

    const board = {
      todo: [],
      in_progress: [],
      done: []
    };

    for (const t of tickets) {
      t.id = t._id.toString();
      if (board[t.status]) {
        board[t.status].push(t);
      }
    }

    res.json({ success: true, data: board });
  } catch (err) {
    next(err);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const filter = buildTicketFilter(projectId, req.query, req.user._id);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Sorting
    let sortOption = { createdAt: -1 };
    if (req.query.sort) {
      const field = req.query.sort.startsWith('-') ? req.query.sort.substring(1) : req.query.sort;
      const order = req.query.sort.startsWith('-') ? -1 : 1;
      sortOption = { [field]: order };
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('reporter', 'name email avatarColor')
        .populate('assignee', 'name email avatarColor')
        .lean(),
      Ticket.countDocuments(filter)
    ]);

    const formatted = tickets.map((t) => {
      t.id = t._id.toString();
      return t;
    });

    res.json({
      success: true,
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const { title, description, type, priority, status, assigneeId, labels, dueDate } = req.body;

    // Validate assignee is member
    let assignee = null;
    if (assigneeId) {
      const isMember = req.project.members.some(
        (m) => m.user.toString() === assigneeId
      );
      if (!isMember) {
        throw new ApiError(400, 'BAD_REQUEST', 'Assignee must be a member of this project');
      }
      assignee = assigneeId;
    }

    // Atomic increment project ticketSeq
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { ticketSeq: 1 } },
      { new: true }
    );
    const number = updatedProject.ticketSeq;
    const key = `${req.project.key}-${number}`;

    const targetStatus = status || 'todo';

    // Position at bottom of the target status column
    const highestTicket = await Ticket.findOne({ project: projectId, status: targetStatus })
      .sort({ position: -1 })
      .lean();
    const position = highestTicket ? highestTicket.position + POSITION_STEP : POSITION_STEP;

    const ticket = await Ticket.create({
      project: projectId,
      number,
      key,
      title,
      description: description || '',
      type: type || 'bug',
      priority: priority || 'medium',
      status: targetStatus,
      position,
      reporter: req.user._id,
      assignee,
      labels: labels || [],
      dueDate: dueDate ? new Date(dueDate) : null,
      completedAt: targetStatus === 'done' ? new Date() : null
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('reporter', 'name email avatarColor')
      .populate('assignee', 'name email avatarColor');

    res.status(201).json({
      success: true,
      data: populated.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const getTicket = async (req, res, next) => {
  try {
    const ticketIdOrKey = req.params.ticketId;
    let ticket;

    if (/^[0-9a-fA-F]{24}$/.test(ticketIdOrKey)) {
      ticket = await Ticket.findById(ticketIdOrKey);
    } else {
      ticket = await Ticket.findOne({ key: ticketIdOrKey });
    }

    if (!ticket) {
      throw new ApiError(404, 'NOT_FOUND', 'Ticket not found');
    }

    // Check membership
    const project = await Project.findById(ticket.project);
    if (!project) {
      throw new ApiError(404, 'NOT_FOUND', 'Project not found');
    }

    const member = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member) {
      throw new ApiError(404, 'NOT_FOUND', 'Ticket not found');
    }

    await ticket.populate('reporter', 'name email avatarColor');
    await ticket.populate('assignee', 'name email avatarColor');

    res.json({
      success: true,
      data: ticket.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const ticket = req.ticket;
    const allowed = can(req.myRole, 'edit_ticket', ticket, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to edit this ticket');
    }

    const { title, description, type, priority, labels, dueDate } = req.body;

    if (title !== undefined) ticket.title = title;
    if (description !== undefined) ticket.description = description;
    if (type !== undefined) ticket.type = type;
    if (priority !== undefined) ticket.priority = priority;
    if (labels !== undefined) ticket.labels = labels;
    if (dueDate !== undefined) ticket.dueDate = dueDate ? new Date(dueDate) : null;

    await ticket.save();

    await ticket.populate('reporter', 'name email avatarColor');
    await ticket.populate('assignee', 'name email avatarColor');

    res.json({
      success: true,
      data: ticket.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const assignTicket = async (req, res, next) => {
  try {
    const ticket = req.ticket;
    const allowed = can(req.myRole, 'assign_ticket', ticket, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to assign this ticket');
    }

    const { assigneeId } = req.body;

    if (assigneeId) {
      const isMember = req.project.members.some(
        (m) => m.user.toString() === assigneeId
      );
      if (!isMember) {
        throw new ApiError(400, 'BAD_REQUEST', 'Assignee must be a project member');
      }
      ticket.assignee = assigneeId;
    } else {
      ticket.assignee = null;
    }

    await ticket.save();

    await ticket.populate('reporter', 'name email avatarColor');
    await ticket.populate('assignee', 'name email avatarColor');

    res.json({
      success: true,
      data: ticket.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const moveTicket = async (req, res, next) => {
  try {
    const ticket = req.ticket;
    const allowed = can(req.myRole, 'move_ticket', ticket, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to move tickets');
    }

    const { status, beforeTicketId, afterTicketId } = req.body;

    let prevPos = null;
    let nextPos = null;

    if (afterTicketId) {
      const prevTicket = await Ticket.findById(afterTicketId);
      if (prevTicket) prevPos = prevTicket.position;
    }

    if (beforeTicketId) {
      const nextTicket = await Ticket.findById(beforeTicketId);
      if (nextTicket) nextPos = nextTicket.position;
    }

    const { position, needsRebalance } = calculatePosition(prevPos, nextPos);

    ticket.status = status;
    ticket.position = position;

    if (status === 'done' && !ticket.completedAt) {
      ticket.completedAt = new Date();
    } else if (status !== 'done') {
      ticket.completedAt = null;
    }

    await ticket.save();

    let rebalanced = false;
    if (needsRebalance) {
      // Rebalance all tickets in column
      const columnTickets = await Ticket.find({ project: ticket.project, status })
        .sort({ position: 1 });

      let currentPos = POSITION_STEP;
      for (const t of columnTickets) {
        t.position = currentPos;
        currentPos += POSITION_STEP;
        await t.save();
      }
      rebalanced = true;
    }

    await ticket.populate('reporter', 'name email avatarColor');
    await ticket.populate('assignee', 'name email avatarColor');

    res.json({
      success: true,
      data: ticket.toJSON(),
      meta: { rebalanced }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const ticket = req.ticket;
    const allowed = can(req.myRole, 'delete_ticket', ticket, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to delete this ticket');
    }

    await Comment.deleteMany({ ticket: ticket._id });
    await Ticket.findByIdAndDelete(ticket._id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
