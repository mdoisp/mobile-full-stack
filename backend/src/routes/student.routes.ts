import { Router } from 'express';

import { 
    createStudent, 
    getAllStudents, 
    updateStudent,
    deleteStudent
} from '../controllers/student.controller.js';

const studentRouter = Router();
// (Lembre-se: o '/students' já foi definido no server.ts)
studentRouter.post('/', createStudent);
studentRouter.get('/', getAllStudents);
studentRouter.put('/:id', updateStudent);
studentRouter.delete('/:id', deleteStudent);
// O ':id' é um "parâmetro de rota". Ele captura o que vem na URL.

export default studentRouter;