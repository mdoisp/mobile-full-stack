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

    // Sincroniza com a base secundária (sem bloquear)
    operation(this.secondaryDb).catch(err => {
      console.error('Secondary database sync failed:', err);
    });

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

  static getCurrentDbType(): DatabaseType {
    return this.currentDbType;
  }

  static async disconnect(): Promise<void> {
    await this.primaryDb?.disconnect();
    await this.secondaryDb?.disconnect();
  }
}
