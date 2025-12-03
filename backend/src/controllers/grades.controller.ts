import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { DatabaseFactory } from '../database/DatabaseFactory.js';

export const getAllGrades = async (req: AuthRequest, res: Response) => {
  try {
    const db = DatabaseFactory.getDatabase();
    const grades = await db.getAllGrades();
    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grades', error: String(error) });
  }
};

export const getGradesByStudentId = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ message: 'Student ID is required' });
    
    const db = DatabaseFactory.getDatabase();
    const grades = await db.getGradesByStudentId(studentId);
    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grades', error: String(error) });
  }
};

export const createGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, subject, grade, attendance } = req.body;

    if (!studentId || !subject || grade === undefined || attendance === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (grade < 0 || grade > 10) {
      return res.status(400).json({ message: 'Grade must be between 0 and 10' });
    }

    if (attendance < 0 || attendance > 100) {
      return res.status(400).json({ message: 'Attendance must be between 0 and 100' });
    }

    const db = DatabaseFactory.getDatabase();

    // Verifica se o estudante existe
    const student = await db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const newGrade = await DatabaseFactory.syncToBoth(db =>
      db.createGrade({ studentId, subject, grade, attendance })
    );

    res.status(201).json(newGrade);
  } catch (error) {
    res.status(500).json({ message: 'Error creating grade', error: String(error) });
  }
};

export const updateGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    
    const { studentId, subject, grade, attendance } = req.body;

    if (grade !== undefined && (grade < 0 || grade > 10)) {
      return res.status(400).json({ message: 'Grade must be between 0 and 10' });
    }

    if (attendance !== undefined && (attendance < 0 || attendance > 100)) {
      return res.status(400).json({ message: 'Attendance must be between 0 and 100' });
    }

    const db = DatabaseFactory.getDatabase();
    
    // Buscar nota e estudante antes de atualizar
    const existingGrade = await db.getGradeById(id);
    if (!existingGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    const student = await db.getStudentById(existingGrade.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Atualizar no primário
    const updated = await db.updateGrade(id, { studentId, subject, grade, attendance });
    if (!updated) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Sincronizar no secundário usando enrollment + subject
    DatabaseFactory.syncGradeUpdateToSecondary(
      id, 
      student.enrollment, 
      existingGrade.subject,
      { grade, attendance }
    ).catch(err => console.error('Secondary sync failed:', err));

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating grade', error: String(error) });
  }
};

export const deleteGrade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const success = await DatabaseFactory.syncToBoth(db =>
      db.deleteGrade(id)
    );

    if (!success) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.status(200).json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting grade', error: String(error) });
  }
};
