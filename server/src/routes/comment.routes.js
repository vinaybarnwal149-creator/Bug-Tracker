import { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/comment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { projectAccess } from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import { updateCommentSchema } from '../validators/comment.validator.js';

const router = Router();

router.use(requireAuth);

router.patch('/:commentId', projectAccess(null), validate(updateCommentSchema), updateComment);
router.delete('/:commentId', projectAccess(null), deleteComment);

export default router;
