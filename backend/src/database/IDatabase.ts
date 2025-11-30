// Interface comum para ambos os bancos de dados
export interface IUser {
  id?: string;
  email: string;
  password: string;
  role: 'admin' | 'secretaria' | 'professor' | 'estudante';
  name: string;
  createdAt?: Date;
}

export interface IStudent {
  id?: string;
  name: string;
  enrollment: string;
  course: string;
  createdAt?: Date;
}

export interface IGrade {
  id?: string;
  studentId: string;
  subject: string;
  grade: number;
  attendance: number; // porcentagem
  createdAt?: Date;
}

export interface IDatabase {
  // Users
  createUser(user: Omit<IUser, 'id' | 'createdAt'>): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserById(id: string): Promise<IUser | null>;
  getAllUsers(): Promise<IUser[]>;
  updateUser(id: string, user: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;

  // Students
  createStudent(student: Omit<IStudent, 'id' | 'createdAt'>): Promise<IStudent>;
  getStudentById(id: string): Promise<IStudent | null>;
  getStudentByEnrollment(enrollment: string): Promise<IStudent | null>;
  getAllStudents(): Promise<IStudent[]>;
  updateStudent(id: string, student: Partial<IStudent>): Promise<IStudent | null>;
  deleteStudent(id: string): Promise<boolean>;

  // Grades
  createGrade(grade: Omit<IGrade, 'id' | 'createdAt'>): Promise<IGrade>;
  getGradeById(id: string): Promise<IGrade | null>;
  getGradesByStudentId(studentId: string): Promise<IGrade[]>;
  getAllGrades(): Promise<IGrade[]>;
  updateGrade(id: string, grade: Partial<IGrade>): Promise<IGrade | null>;
  deleteGrade(id: string): Promise<boolean>;

  // Utility
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
