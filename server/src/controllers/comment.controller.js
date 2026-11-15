import { Comment } from '../models/Comment.js';
import { Ticket } from '../models/Ticket.js';
import { ApiError } from '../utils/ApiError.js';
import { can } from '../services/permissions.js';

export const getComments = async (req, res, next) => {
  try {
    const ticketId = req.ticket._id;

    // Load all comments for ticket sorted by createdAt asc
    const comments = await Comment.find({ ticket: ticketId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email avatarColor')
      .lean();

    const rootComments = [];
    const replyMap = {};

    for (const c of comments) {
      c.id = c._id.toString();
      if (!c.parent) {
        c.replies = [];
        rootComments.push(c);
        replyMap[c.id] = c;
      }
    }

    for (const c of comments) {
      if (c.parent) {
        const parentId = c.parent.toString();
        if (replyMap[parentId]) {
          replyMap[parentId].replies.push(c);
        } else {
          // Fallback if parent missing
          c.replies = [];
          rootComments.push(c);
        }
      }
    }

    res.json({
      success: true,
      data: rootComments
    });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const ticketId = req.ticket._id;
    const projectId = req.ticket.project;
    const { body, parentId } = req.body;

    let targetParent = null;

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment || parentComment.ticket.toString() !== ticketId.toString()) {
        throw new ApiError(404, 'NOT_FOUND', 'Parent comment not found');
      }

      // One level nesting rule: if parent is itself a reply, attach to root
      targetParent = parentComment.parent ? parentComment.parent : parentComment._id;
    }

    const comment = await Comment.create({
      ticket: ticketId,
      project: projectId,
      author: req.user._id,
      body,
      parent: targetParent
    });

    await Ticket.findByIdAndUpdate(ticketId, { $inc: { commentCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name email avatarColor');

    res.status(201).json({
      success: true,
      data: populated.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const comment = req.comment;
    const allowed = can(req.myRole, 'edit_comment', comment, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to edit this comment');
    }

    const { body } = req.body;
    comment.body = body;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('author', 'name email avatarColor');

    res.json({
      success: true,
      data: comment.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = req.comment;
    const allowed = can(req.myRole, 'delete_comment', comment, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to delete this comment');
    }

    const ticketId = comment.ticket;

    // Delete comment and its replies
    let deleteCount = 1;
    if (!comment.parent) {
      const replies = await Comment.deleteMany({ parent: comment._id });
      deleteCount += replies.deletedCount || 0;
    }
    await Comment.findByIdAndDelete(comment._id);

    // Decrement ticket comment count
    await Ticket.findByIdAndUpdate(ticketId, { $inc: { commentCount: -deleteCount } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
