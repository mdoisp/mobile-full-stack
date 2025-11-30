import { DatabaseFactory } from './database/DatabaseFactory.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const MONGO_URL = process.env.DATABASE_URL;

if (!MONGO_URL) {
  console.error('DATABASE_URL não definida no .env');
  process.exit(1);
}

async function reset() {
  console.log('🗑️  Limpando bancos de dados...');

  await DatabaseFactory.initialize('mongodb', MONGO_URL!, './database.sqlite');

  try {
    // Limpar MongoDB
    console.log('🔄 Limpando MongoDB...');
    const dbMongo = DatabaseFactory.getDatabase();
    
    const allGrades = await dbMongo.getAllGrades();
    for (const grade of allGrades) {
      if (grade.id) await dbMongo.deleteGrade(grade.id);
    }
    
    const allStudents = await dbMongo.getAllStudents();
    for (const student of allStudents) {
      if (student.id) await dbMongo.deleteStudent(student.id);
    }
    
    const allUsers = await dbMongo.getAllUsers();
    for (const user of allUsers) {
      if (user.id) await dbMongo.deleteUser(user.id);
    }
    
    console.log('✅ MongoDB limpo');

    // Limpar SQLite - deletando o arquivo
    console.log('🔄 Limpando SQLite...');
    await DatabaseFactory.disconnect();
    
    const sqlitePath = './database.sqlite';
    if (fs.existsSync(sqlitePath)) {
      fs.unlinkSync(sqlitePath);
      console.log('✅ SQLite limpo');
    } else {
      console.log('ℹ️  SQLite já estava vazio');
    }

    console.log('\n✨ Bancos de dados resetados com sucesso!');
    console.log('💡 Agora você pode rodar: npm run seed');

  } catch (error) {
    console.error('❌ Erro durante o reset:', error);
  } finally {
    process.exit(0);
  }
}

reset();
