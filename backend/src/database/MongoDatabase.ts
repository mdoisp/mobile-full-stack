import mongoose, { Schema } from 'mongoose';
import type { IDatabase, IUser, IStudent, IGrade } from './IDatabase.js';

// Schemas do MongoDB
const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'secretaria', 'professor', 'estudante'] },
  name: { type: String, required: true },
  photoUrl: { type: String, required: false },
}, { timestamps: true });

const studentSchema = new Schema<IStudent>({
  name: { type: String, required: true },
  enrollment: { type: String, required: true, unique: true },
  course: { type: String, required: true },
}, { timestamps: true });

const gradeSchema = new Schema<IGrade>({
  studentId: { type: String, required: true },
  subject: { type: String, required: true },
  grade: { type: Number, required: true, min: 0, max: 10 },
  attendance: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true });

const UserModel = mongoose.model<IUser>('User', userSchema);
const StudentModel = mongoose.model<IStudent>('Student', studentSchema);
const GradeModel = mongoose.model<IGrade>('Grade', gradeSchema);

export class MongoDatabase implements IDatabase {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    await mongoose.connect(this.connectionString);
    console.log('✅ MongoDB connected');
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }

  // Users
  async createUser(user: Omit<IUser, 'id' | 'createdAt'>): Promise<IUser> {
    const newUser = new UserModel(user);
    const saved = await newUser.save();
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email });
    return user ? { ...user.toObject(), id: user._id.toString() } : null;
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await UserModel.findById(id);
    return user ? { ...user.toObject(), id: user._id.toString() } : null;
  }

  async getAllUsers(): Promise<IUser[]> {
    const users = await UserModel.find({});
    return users.map(u => ({ ...u.toObject(), id: u._id.toString() }));
  }

  async updateUser(id: string, user: Partial<IUser>): Promise<IUser | null> {
    const updated = await UserModel.findByIdAndUpdate(id, user, { new: true });
    return updated ? { ...updated.toObject(), id: updated._id.toString() } : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  // Students
  async createStudent(student: Omit<IStudent, 'id' | 'createdAt'>): Promise<IStudent> {
    const newStudent = new StudentModel(student);
    const saved = await newStudent.save();
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async getStudentById(id: string): Promise<IStudent | null> {
    const student = await StudentModel.findById(id);
    return student ? { ...student.toObject(), id: student._id.toString() } : null;
  }

  async getStudentByEnrollment(enrollment: string): Promise<IStudent | null> {
    const student = await StudentModel.findOne({ enrollment });
    return student ? { ...student.toObject(), id: student._id.toString() } : null;
  }

  async getAllStudents(): Promise<IStudent[]> {
    const students = await StudentModel.find({});
    return students.map(s => ({ ...s.toObject(), id: s._id.toString() }));
  }

  async updateStudent(id: string, student: Partial<IStudent>): Promise<IStudent | null> {
    const updated = await StudentModel.findByIdAndUpdate(id, student, { new: true });
    return updated ? { ...updated.toObject(), id: updated._id.toString() } : null;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await StudentModel.findByIdAndDelete(id);
    return !!result;
  }

  // Grades
  async createGrade(grade: Omit<IGrade, 'id' | 'createdAt'>): Promise<IGrade> {
    const newGrade = new GradeModel(grade);
    const saved = await newGrade.save();
    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async getGradeById(id: string): Promise<IGrade | null> {
    const grade = await GradeModel.findById(id);
    return grade ? { ...grade.toObject(), id: grade._id.toString() } : null;
  }

  async getGradesByStudentId(studentId: string): Promise<IGrade[]> {
    const grades = await GradeModel.find({ studentId });
    return grades.map(g => ({ ...g.toObject(), id: g._id.toString() }));
  }

  async getAllGrades(): Promise<IGrade[]> {
    const grades = await GradeModel.find({});
    return grades.map(g => ({ ...g.toObject(), id: g._id.toString() }));
  }

  async updateGrade(id: string, grade: Partial<IGrade>): Promise<IGrade | null> {
    const updated = await GradeModel.findByIdAndUpdate(id, grade, { new: true });
    return updated ? { ...updated.toObject(), id: updated._id.toString() } : null;
  }

  async deleteGrade(id: string): Promise<boolean> {
    const result = await GradeModel.findByIdAndDelete(id);
    return !!result;
  }
}
