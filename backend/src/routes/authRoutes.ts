import { Router } from 'express';
import { register, login, getMe, RegisterSchema, LoginSchema } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

router.post('/register', validate(RegisterSchema), register);
router.post('/login', validate(LoginSchema), login);
router.get('/me', authMiddleware as any, getMe as any);

export default router;
