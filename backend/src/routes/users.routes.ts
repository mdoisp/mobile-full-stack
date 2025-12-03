import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/users.controller.js';

const router = Router();

// Rotas do próprio usuário (qualquer role autenticado)
router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);

// Listar usuários (com filtro por role)
router.get('/', authenticate, getAllUsers);

// Ver usuário específico (com verificação de permissão no controller)
router.get('/:id', authenticate, getUserById);

// Atualizar usuário (admin pode trocar email, outros só podem editar próprio perfil)
router.put('/:id', authenticate, updateUser);

// Deletar usuário (admin pode deletar qualquer um, secretaria pode deletar professores e estudantes)
router.delete('/:id', authenticate, authorize('admin', 'secretaria'), deleteUser);

export default router;
