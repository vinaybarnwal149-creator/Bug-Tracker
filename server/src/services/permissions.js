/**
 * Unified permission evaluator matching PRD §4.1
 * @param {string} role - 'owner' | 'manager' | 'developer' | 'viewer'
 * @param {string} action - action key
 * @param {object} resource - ticket, comment, attachment, or project
 * @param {string} userId - current user id
 * @returns {boolean}
 */
export const can = (role, action, resource = null, userId = null) => {
  if (!role) return false;

  const userStr = userId ? userId.toString() : null;

  switch (action) {
    case 'view_project':
    case 'view_board':
    case 'view_tickets':
    case 'view_comments':
      return ['owner', 'manager', 'developer', 'viewer'].includes(role);

    case 'create_ticket':
    case 'move_ticket':
    case 'add_comment':
    case 'upload_attachment':
      return ['owner', 'manager', 'developer'].includes(role);

    case 'edit_ticket':
      if (['owner', 'manager'].includes(role)) return true;
      if (role === 'developer' && resource) {
        const reporterId = resource.reporter?.id || resource.reporter?._id || resource.reporter;
        const assigneeId = resource.assignee?.id || resource.assignee?._id || resource.assignee;
        return (reporterId && reporterId.toString() === userStr) ||
               (assigneeId && assigneeId.toString() === userStr);
      }
      return false;

    case 'assign_ticket':
      if (['owner', 'manager'].includes(role)) return true;
      if (role === 'developer' && resource) {
        const reporterId = resource.reporter?.id || resource.reporter?._id || resource.reporter;
        const assigneeId = resource.assignee?.id || resource.assignee?._id || resource.assignee;
        return (reporterId && reporterId.toString() === userStr) ||
               (assigneeId && assigneeId.toString() === userStr);
      }
      return false;

    case 'delete_ticket':
      if (['owner', 'manager'].includes(role)) return true;
      if (role === 'developer' && resource) {
        const reporterId = resource.reporter?.id || resource.reporter?._id || resource.reporter;
        return reporterId && reporterId.toString() === userStr;
      }
      return false;

    case 'edit_comment':
      if (resource) {
        const authorId = resource.author?.id || resource.author?._id || resource.author;
        return authorId && authorId.toString() === userStr;
      }
      return false;

    case 'delete_comment':
      if (['owner', 'manager'].includes(role)) return true;
      if (role === 'developer' && resource) {
        const authorId = resource.author?.id || resource.author?._id || resource.author;
        return authorId && authorId.toString() === userStr;
      }
      return false;

    case 'delete_attachment':
      if (['owner', 'manager'].includes(role)) return true;
      if (role === 'developer' && resource) {
        const uploaderId = resource.uploadedBy?.id || resource.uploadedBy?._id || resource.uploadedBy;
        return uploaderId && uploaderId.toString() === userStr;
      }
      return false;

    case 'manage_members':
    case 'edit_project':
      return ['owner', 'manager'].includes(role);

    case 'delete_project':
      return role === 'owner';

    case 'leave_project':
      return ['manager', 'developer', 'viewer'].includes(role);

    default:
      return false;
  }
};
