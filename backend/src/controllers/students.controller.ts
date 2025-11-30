import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { DatabaseFactory } from '../database/DatabaseFactory.js';

export const getAllStudents = async (req: AuthRequest, res: Response) => {
  try {
    const db = DatabaseFactory.getDatabase();
    const students = await db.getAllStudents();
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
    const { name, enrollment, course } = req.body;

    if (!name || !enrollment || !course) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const db = DatabaseFactory.getDatabase();

    // Verifica se matrícula já existe
    const existing = await db.getStudentByEnrollment(enrollment);
    if (existing) {
      return res.status(409).json({ message: 'Enrollment already exists' });
    }

    const student = await DatabaseFactory.syncToBoth(db =>
      db.createStudent({ name, enrollment, course })
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
    
    const { name, enrollment, course } = req.body;

    const db = DatabaseFactory.getDatabase();

    const updated = await DatabaseFactory.syncToBoth(db =>
      db.updateStudent(id, { name, enrollment, course })
    );

    if (!updated) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: String(error) });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const success = await DatabaseFactory.syncToBoth(db =>
      db.deleteStudent(id)
    );

    if (!success) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: String(error) });
  }
};
