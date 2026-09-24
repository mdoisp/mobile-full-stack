import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function resetMongoDB() {
  try {
    const MONGO_URI = process.env.DATABASE_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/finalMobile';
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    await mongoose.connection.db?.dropDatabase();
    console.log('✓ MongoDB limpo com sucesso');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao limpar MongoDB:', error);
    process.exit(1);
  }
}

resetMongoDB();
