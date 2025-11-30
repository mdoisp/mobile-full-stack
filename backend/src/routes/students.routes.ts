import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/students.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const studentsRouter = Router();

// Todas as rotas requerem autenticação
studentsRouter.use(authenticate);

// GET - Admin, Secretaria, Professor e Estudante podem acessar (cada um vê conforme suas permissões)
studentsRouter.get('/', authorize('admin', 'secretaria', 'professor', 'estudante'), getAllStudents);

// GET by ID - Todos podem ver (estudante vê só o próprio)
studentsRouter.get('/:id', getStudentById);

// POST - Admin e Secretaria podem criar
studentsRouter.post('/', authorize('admin', 'secretaria'), createStudent);

// PUT - Admin e Secretaria podem atualizar
studentsRouter.put('/:id', authorize('admin', 'secretaria'), updateStudent);

// DELETE - Apenas Admin pode deletar
studentsRouter.delete('/:id', authorize('admin'), deleteStudent);

export default studentsRouter;
