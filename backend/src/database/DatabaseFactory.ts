import type { IDatabase } from './IDatabase.js';
import { MongoDatabase } from './MongoDatabase.js';
import { SQLiteDatabase } from './SQLiteDatabase.js';

export type DatabaseType = 'mongodb' | 'sqlite';

export class DatabaseFactory {
  private static primaryDb: IDatabase | null = null;
  private static secondaryDb: IDatabase | null = null;
  private static currentDbType: DatabaseType = 'mongodb';

  static async initialize(dbType: DatabaseType, mongoUrl: string, sqlitePath: string = './database.sqlite'): Promise<void> {
    this.currentDbType = dbType;
    
    // Inicializa ambos os bancos
    const mongoDb = new MongoDatabase(mongoUrl);
    const sqliteDb = new SQLiteDatabase(sqlitePath);

    if (dbType === 'mongodb') {
      this.primaryDb = mongoDb;
      this.secondaryDb = sqliteDb;
    } else {
      this.primaryDb = sqliteDb;
      this.secondaryDb = mongoDb;
    }

    // Conecta ambos
    await this.primaryDb.connect();
    await this.secondaryDb.connect();
    
    console.log(`Primary database: ${dbType.toUpperCase()}`);
  }

  static getDatabase(): IDatabase {
    if (!this.primaryDb) {
      throw new Error('Database not initialized. Call DatabaseFactory.initialize() first.');
    }
    return this.primaryDb;
  }

  static async syncToBoth<T>(
    operation: (db: IDatabase) => Promise<T>
  ): Promise<T> {
    if (!this.primaryDb || !this.secondaryDb) {
      throw new Error('Databases not initialized');
    }

    // Executa na base primária primeiro
    const result = await operation(this.primaryDb);

    // IMPORTANTE: Para updates/deletes, os IDs já existem e devem ser iguais
    // Para creates, o ID foi gerado no primário e deve ser reusado no secundário
    // A estratégia atual NÃO funciona porque cada banco gera seu próprio ID

    // Sincroniza com a base secundária (aguardar para garantir consistência)
    try {
      await operation(this.secondaryDb);
    } catch (err) {
      console.error('⚠️  Secondary database sync failed:', err);
      // Não lança erro para não quebrar a operação principal
    }

    return result;
  }

  static async switchDatabase(newDbType: DatabaseType): Promise<void> {
    if (newDbType === this.currentDbType) return;

    // Troca primário com secundário
    const temp = this.primaryDb;
    this.primaryDb = this.secondaryDb;
    this.secondaryDb = temp;
    this.currentDbType = newDbType;

    console.log(`Switched to ${newDbType.toUpperCase()}`);
  }

  // Sincronização específica para Students (usa enrollment como chave única)
  static async syncStudentUpdateToSecondary(
    enrollment: string, 
    updates: Partial<{ name: string; enrollment: string; course: string; subject: string; status: 'ativo' | 'trancado' | 'transferido' | 'concluido' }>
  ): Promise<void> {
    if (!this.secondaryDb) return;

    try {
      const student = await this.secondaryDb.getStudentByEnrollment(enrollment);
      if (student?.id) {
        await this.secondaryDb.updateStudent(student.id, updates);
      }
    } catch (err) {
      console.error('⚠️  Secondary student sync failed:', err);
    }
  }

  // Sincronização específica para Users (usa email como chave única)
  static async syncUserUpdateToSecondary(
    email: string,
    updates: any
  ): Promise<void> {
    if (!this.secondaryDb) return;

    try {
      const user = await this.secondaryDb.getUserByEmail(email);
      if (user?.id) {
        await this.secondaryDb.updateUser(user.id, updates);
      }
    } catch (err) {
      console.error('⚠️  Secondary user sync failed:', err);
    }
  }

  // Sincronização para Grades (usa combinação studentId + subject)
  static async syncGradeUpdateToSecondary(
    primaryGradeId: string,
    enrollment: string,
    subject: string,
    updates: Partial<{ grade: number; attendance: number }>
  ): Promise<void> {
    if (!this.secondaryDb) return;

    try {
      // Buscar estudante no secundário
      const student = await this.secondaryDb.getStudentByEnrollment(enrollment);
      if (!student) return;

      // Buscar nota específica desse estudante nessa disciplina
      const grades = await this.secondaryDb.getGradesByStudentId(student.id);
      const targetGrade = grades.find(g => g.subject === subject);
      
      if (targetGrade?.id) {
        await this.secondaryDb.updateGrade(targetGrade.id, updates);
      }
    } catch (err) {
      console.error('⚠️  Secondary grade sync failed:', err);
    }
  }

  // Delete sincronizado para Students
  static async syncStudentDeleteToSecondary(enrollment: string): Promise<void> {
    if (!this.secondaryDb) return;

    try {
      const student = await this.secondaryDb.getStudentByEnrollment(enrollment);
      if (student?.id) {
        await this.secondaryDb.deleteStudent(student.id);
      }
    } catch (err) {
      console.error('⚠️  Secondary student delete failed:', err);
    }
  }

  // Delete sincronizado para Users
  static async syncUserDeleteToSecondary(email: string): Promise<void> {
    if (!this.secondaryDb) return;

    try {
      const user = await this.secondaryDb.getUserByEmail(email);
      if (user?.id) {
        await this.secondaryDb.deleteUser(user.id);
      }
    } catch (err) {
      console.error('⚠️  Secondary user delete failed:', err);
    }
  }

  static getCurrentDbType(): DatabaseType {
    return this.currentDbType;
  }

  static async disconnect(): Promise<void> {
    await this.primaryDb?.disconnect();
    await this.secondaryDb?.disconnect();
  }
}
