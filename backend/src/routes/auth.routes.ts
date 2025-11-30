import { Router } from 'express';
import { register, login, switchDatabase, getCurrentDatabase } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const authRouter = Router();

// Rotas públicas
authRouter.post('/register', register);
authRouter.post('/login', login);

// Rotas protegidas - apenas admin pode trocar o banco
authRouter.post('/switch-db', authenticate, authorize('admin'), switchDatabase);
authRouter.get('/current-db', authenticate, getCurrentDatabase);

export default authRouter;
