import Database from 'better-sqlite3';
import type { IDatabase, IUser, IStudent, IGrade } from './IDatabase.js';

export class SQLiteDatabase implements IDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = './database.sqlite') {
    this.dbPath = dbPath;
  }

  async connect(): Promise<void> {
    this.db = new Database(this.dbPath);
    this.initializeTables();
    console.log('SQLite connected');
  }

  async disconnect(): Promise<void> {
    this.db?.close();
  }

  private initializeTables(): void {
    if (!this.db) throw new Error('Database not connected');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'secretaria', 'professor', 'estudante')),
        name TEXT NOT NULL,
        subject TEXT,
        photoUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        enrollment TEXT UNIQUE NOT NULL,
        course TEXT NOT NULL,
        subject TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        subject TEXT NOT NULL,
        grade REAL NOT NULL CHECK(grade >= 0 AND grade <= 10),
        attendance REAL NOT NULL CHECK(attendance >= 0 AND attendance <= 100),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
      );
    `);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Users
  async createUser(user: Omit<IUser, 'id' | 'createdAt'>): Promise<IUser> {
    if (!this.db) throw new Error('Database not connected');
    
    const id = this.generateId();
    const stmt = this.db.prepare(
      'INSERT INTO users (id, email, password, role, name, subject, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, user.email, user.password, user.role, user.name, user.subject || null, user.photoUrl || null);
    
    return { id, ...user, createdAt: new Date() };
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as any;
    return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
  }

  async getUserById(id: string): Promise<IUser | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
  }

  async getAllUsers(): Promise<IUser[]> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM users');
    const rows = stmt.all() as any[];
    return rows.map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  }

  async updateUser(id: string, user: Partial<IUser>): Promise<IUser | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const fields = Object.keys(user).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length === 0) return this.getUserById(id);
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (user as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    
    return this.getUserById(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Students
  async createStudent(student: Omit<IStudent, 'id' | 'createdAt'>): Promise<IStudent> {
    if (!this.db) throw new Error('Database not connected');
    
    const id = this.generateId();
    const stmt = this.db.prepare(
      'INSERT INTO students (id, name, enrollment, course, subject) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, student.name, student.enrollment, student.course, student.subject || null);
    
    return { id, ...student, createdAt: new Date() };
  }

  async getStudentById(id: string): Promise<IStudent | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM students WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
  }

  async getStudentByEnrollment(enrollment: string): Promise<IStudent | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM students WHERE enrollment = ?');
    const row = stmt.get(enrollment) as any;
    return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
  }

  async getAllStudents(): Promise<IStudent[]> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM students');
    const rows = stmt.all() as any[];
    return rows.map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  }

  async updateStudent(id: string, student: Partial<IStudent>): Promise<IStudent | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const fields = Object.keys(student).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length === 0) return this.getStudentById(id);
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (student as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE students SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    
    return this.getStudentById(id);
  }

  async deleteStudent(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('DELETE FROM students WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Grades
  async createGrade(grade: Omit<IGrade, 'id' | 'createdAt'>): Promise<IGrade> {
    if (!this.db) throw new Error('Database not connected');
    
    const id = this.generateId();
    const stmt = this.db.prepare(
      'INSERT INTO grades (id, studentId, subject, grade, attendance) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, grade.studentId, grade.subject, grade.grade, grade.attendance);
    
    return { id, ...grade, createdAt: new Date() };
  }

  async getGradeById(id: string): Promise<IGrade | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM grades WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
  }

  async getGradesByStudentId(studentId: string): Promise<IGrade[]> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM grades WHERE studentId = ?');
    const rows = stmt.all(studentId) as any[];
    return rows.map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  }

  async getAllGrades(): Promise<IGrade[]> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('SELECT * FROM grades');
    const rows = stmt.all() as any[];
    return rows.map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  }

  async updateGrade(id: string, grade: Partial<IGrade>): Promise<IGrade | null> {
    if (!this.db) throw new Error('Database not connected');
    
    const fields = Object.keys(grade).filter(k => k !== 'id' && k !== 'createdAt');
    if (fields.length === 0) return this.getGradeById(id);
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (grade as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE grades SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    
    return this.getGradeById(id);
  }

  async deleteGrade(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not connected');
    
    const stmt = this.db.prepare('DELETE FROM grades WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
