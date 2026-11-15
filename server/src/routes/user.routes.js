import { Router } from 'express';
import { updateMe, updatePassword } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema, updatePasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.use(requireAuth);

router.patch('/me', validate(updateMeSchema), updateMe);
router.patch('/me/password', validate(updatePasswordSchema), updatePassword);

export default router;
