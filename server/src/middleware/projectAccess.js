import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { Comment } from '../models/Comment.js';
import { ApiError } from '../utils/ApiError.js';
import { can } from '../services/permissions.js';

export const projectAccess = (requiredAction = null) => {
  return async (req, res, next) => {
    try {
      let projectId = req.params.projectId;
      let resource = null;

      // If projectId is not in params, check ticketId
      if (!projectId && req.params.ticketId) {
        let ticket;
        if (/^[0-9a-fA-F]{24}$/.test(req.params.ticketId)) {
          ticket = await Ticket.findById(req.params.ticketId);
        } else {
          // ticketKey e.g. WEB-1
          ticket = await Ticket.findOne({ key: req.params.ticketId });
        }
        if (!ticket) {
          return next(new ApiError(404, 'NOT_FOUND', 'Ticket not found'));
        }
        projectId = ticket.project.toString();
        resource = ticket;
        req.ticket = ticket;
      }

      // If still not found, check commentId
      if (!projectId && req.params.commentId) {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
          return next(new ApiError(404, 'NOT_FOUND', 'Comment not found'));
        }
        projectId = comment.project.toString();
        resource = comment;
        req.comment = comment;
      }

      if (!projectId) {
        return next(new ApiError(400, 'BAD_REQUEST', 'Project identifier missing'));
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return next(new ApiError(404, 'NOT_FOUND', 'Project not found'));
      }

      // Check if user is a member
      const userIdStr = req.user._id.toString();
      const member = project.members.find(
        (m) => m.user.toString() === userIdStr
      );

      // Return 404 (not 403) for non-members to prevent existence leaking
      if (!member) {
        return next(new ApiError(404, 'NOT_FOUND', 'Project not found'));
      }

      req.project = project;
      req.membership = member;
      req.myRole = member.role;

      if (requiredAction) {
        const allowed = can(member.role, requiredAction, resource, req.user._id);
        if (!allowed) {
          return next(new ApiError(403, 'FORBIDDEN', `You do not have permission to ${requiredAction}`));
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
