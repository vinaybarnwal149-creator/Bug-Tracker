import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getProjectStats,
  checkKeyAvailable,
  addMember,
  updateMemberRole,
  removeMember
} from '../controllers/project.controller.js';
import {
  getBoard,
  getTickets,
  createTicket
} from '../controllers/ticket.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { projectAccess } from '../middleware/projectAccess.js';
import { validate, validateParamsId } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberSchema
} from '../validators/project.validator.js';
import { createTicketSchema } from '../validators/ticket.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProjects);
router.post('/', validate(createProjectSchema), createProject);
router.get('/key-available', checkKeyAvailable);

// Project specific routes
router.get('/:projectId', validateParamsId('projectId'), projectAccess('view_project'), getProject);
router.patch('/:projectId', validateParamsId('projectId'), projectAccess('edit_project'), validate(updateProjectSchema), updateProject);
router.delete('/:projectId', validateParamsId('projectId'), projectAccess('delete_project'), deleteProject);
router.get('/:projectId/stats', validateParamsId('projectId'), projectAccess('view_project'), getProjectStats);

// Members
router.post('/:projectId/members', validateParamsId('projectId'), projectAccess('manage_members'), validate(addMemberSchema), addMember);
router.patch('/:projectId/members/:userId', validateParamsId('projectId'), validateParamsId('userId'), projectAccess('manage_members'), validate(updateMemberSchema), updateMemberRole);
router.delete('/:projectId/members/:userId', validateParamsId('projectId'), validateParamsId('userId'), projectAccess(null), removeMember);

// Tickets under project
router.get('/:projectId/board', validateParamsId('projectId'), projectAccess('view_board'), getBoard);
router.get('/:projectId/tickets', validateParamsId('projectId'), projectAccess('view_tickets'), getTickets);
router.post('/:projectId/tickets', validateParamsId('projectId'), projectAccess('create_ticket'), validate(createTicketSchema), createTicket);

export default router;
