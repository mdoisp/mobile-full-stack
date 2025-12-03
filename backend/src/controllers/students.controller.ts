import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { DatabaseFactory } from '../database/DatabaseFactory.js';

export const getAllStudents = async (req: AuthRequest, res: Response) => {
  try {
    const db = DatabaseFactory.getDatabase();
    const currentUser = req.user!;
    let students = await db.getAllStudents();

    // Filtrar estudantes baseado no role e disciplina
    if (currentUser.role === 'professor') {
      // Professor vê apenas estudantes da sua disciplina
      const professor = await db.getUserById(currentUser.userId);
      if (professor?.subject) {
        students = students.filter(s => s.subject === professor.subject);
      } else {
        // Se professor não tem disciplina definida, não vê nenhum estudante
        students = [];
      }
    } else if (currentUser.role === 'estudante') {
      // Estudante vê apenas ele mesmo
      // Primeiro precisa encontrar o registro do estudante correspondente ao usuário
      const allStudents = await db.getAllStudents();
      const userInfo = await db.getUserById(currentUser.userId);
      // Filtra pelo nome ou email (assumindo que o email pode ser usado para encontrar)
      students = allStudents.filter(s => s.name === userInfo?.name);
    }
    // Admin e Secretaria veem todos (sem filtro)

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: String(error) });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    
    const db = DatabaseFactory.getDatabase();
    const student = await db.getStudentById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: String(error) });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { name, enrollment, course, subject } = req.body;

    if (!name || !enrollment || !course) {
      return res.status(400).json({ message: 'Name, enrollment and course are required' });
    }

    const db = DatabaseFactory.getDatabase();

    // Verifica se matrícula já existe
    const existing = await db.getStudentByEnrollment(enrollment);
    if (existing) {
      return res.status(409).json({ message: 'Enrollment already exists' });
    }

    const student = await DatabaseFactory.syncToBoth(db =>
      db.createStudent({ name, enrollment, course, subject })
    );

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error: String(error) });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    
    const { name, enrollment, course, subject } = req.body;

    const primaryDb = DatabaseFactory.getDatabase();
    
    // Buscar estudante no banco primário
    const existingStudent = await primaryDb.getStudentById(id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Usar enrollment para sincronizar (é único e consistente entre bancos)
    const enrollmentToUpdate = enrollment || existingStudent.enrollment;

    // Atualizar no banco primário primeiro
    const updated = await primaryDb.updateStudent(id, { name, enrollment, course, subject });

    // Sincronizar no secundário usando enrollment
    DatabaseFactory.syncStudentUpdateToSecondary(enrollmentToUpdate, { name, enrollment, course, subject })
      .catch(err => console.error('Secondary sync failed:', err));

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: String(error) });
  }
};

export const changeStudentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) return res.status(400).json({ message: 'ID is required' });
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const validStatuses = ['ativo', 'trancado', 'transferido', 'concluido'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: ativo, trancado, transferido, concluido' 
      });
    }

    const primaryDb = DatabaseFactory.getDatabase();
    const student = await primaryDb.getStudentById(id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Atualizar no primário
    const updated = await primaryDb.updateStudent(id, { status });

    // Sincronizar no secundário usando enrollment
    DatabaseFactory.syncStudentUpdateToSecondary(student.enrollment, { status })
      .catch(err => console.error('Secondary sync failed:', err));

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error changing student status', error: String(error) });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const db = DatabaseFactory.getDatabase();
    
    // Validar se estudante tem notas
    const grades = await db.getGradesByStudentId(id);
    if (grades.length > 0) {
      return res.status(400).json({ 
        message: 'Não é possível deletar estudante com notas cadastradas. Altere o status para "trancado" ou "transferido" ao invés de deletar.' 
      });
    }

    // Buscar enrollment antes de deletar
    const student = await db.getStudentById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Deletar do primário
    const success = await db.deleteStudent(id);
    if (!success) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Sincronizar delete no secundário
    DatabaseFactory.syncStudentDeleteToSecondary(student.enrollment)
      .catch(err => console.error('Secondary delete failed:', err));

    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: String(error) });
  }
};
