import express from 'express';
import dotenv from 'dotenv';
import { DatabaseFactory } from './database/DatabaseFactory.js';
import authRouter from './routes/auth.routes.js';
import studentsRouter from './routes/students.routes.js';
import gradesRouter from './routes/grades.routes.js';
import usersRouter from './routes/users.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MONGO_URL = process.env.DATABASE_URL;

if (!MONGO_URL) {
    console.error('DATABASE_URL is not set in .env file');
    process.exit(1);
}

// Inicializa os bancos de dados (MongoDB como padrão)
await DatabaseFactory.initialize('mongodb', MONGO_URL, './database.sqlite');

// Rotas
app.use('/auth', authRouter);
app.use('/students', studentsRouter);
app.use('/grades', gradesRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => {
    res.json({ 
        message: 'Server working correctly',
        currentDb: DatabaseFactory.getCurrentDbType()
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await DatabaseFactory.disconnect();
    process.exit(0);
});
