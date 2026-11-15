import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import projectRouter from './project.routes.js';
import ticketRouter from './ticket.routes.js';
import commentRouter from './comment.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/projects', projectRouter);
router.use('/tickets', ticketRouter);
router.use('/comments', commentRouter);

export default router;
