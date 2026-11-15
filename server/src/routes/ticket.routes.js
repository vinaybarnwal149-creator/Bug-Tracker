import { Router } from 'express';
import {
  getTicket,
  updateTicket,
  assignTicket,
  moveTicket,
  deleteTicket
} from '../controllers/ticket.controller.js';
import {
  getComments,
  createComment
} from '../controllers/comment.controller.js';
import {
  uploadAttachments,
  deleteAttachment
} from '../controllers/attachment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { projectAccess } from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  updateTicketSchema,
  assignTicketSchema,
  moveTicketSchema
} from '../validators/ticket.validator.js';
import { createCommentSchema } from '../validators/comment.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/:ticketId', projectAccess('view_tickets'), getTicket);
router.patch('/:ticketId', projectAccess('edit_ticket'), validate(updateTicketSchema), updateTicket);
router.put('/:ticketId/assignee', projectAccess('assign_ticket'), validate(assignTicketSchema), assignTicket);
router.patch('/:ticketId/move', projectAccess('move_ticket'), validate(moveTicketSchema), moveTicket);
router.delete('/:ticketId', projectAccess('delete_ticket'), deleteTicket);

// Nested comments
router.get('/:ticketId/comments', projectAccess('view_comments'), getComments);
router.post('/:ticketId/comments', projectAccess('add_comment'), validate(createCommentSchema), createComment);

// Nested attachments
router.post('/:ticketId/attachments', projectAccess('upload_attachment'), upload.array('files', 5), uploadAttachments);
router.delete('/:ticketId/attachments/:attachmentId', projectAccess(null), deleteAttachment);

export default router;
