import { Router } from 'express';
import {
  getAllGrades,
  getGradesByStudentId,
  createGrade,
  updateGrade,
  deleteGrade,
} from '../controllers/grades.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const gradesRouter = Router();

// Todas as rotas requerem autenticação
gradesRouter.use(authenticate);

// GET all - Admin e Secretaria podem ver todas
gradesRouter.get('/', authorize('admin', 'secretaria'), getAllGrades);

// GET by student - Todos podem ver (filtro no controller se necessário)
gradesRouter.get('/student/:studentId', getGradesByStudentId);

// POST - Admin, Secretaria e Professor podem criar
gradesRouter.post('/', authorize('admin', 'secretaria', 'professor'), createGrade);

// PUT - Admin, Secretaria e Professor podem atualizar
gradesRouter.put('/:id', authorize('admin', 'secretaria', 'professor'), updateGrade);

// DELETE - Admin e Professor podem deletar
gradesRouter.delete('/:id', authorize('admin', 'professor'), deleteGrade);

export default gradesRouter;
