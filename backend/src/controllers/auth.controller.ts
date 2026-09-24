import type { Request, Response } from 'express';
import { DatabaseFactory } from '../database/DatabaseFactory.js';
import { AuthService } from '../services/auth.service.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const db = DatabaseFactory.getDatabase();

    // Verifica se o email já existe
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash da senha
    const hashedPassword = await AuthService.hashPassword(password);

    // Cria o usuário em ambos os bancos
    const user = await DatabaseFactory.syncToBoth(db => 
      db.createUser({ email, password: hashedPassword, role, name })
    );

    // Remove a senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ 
      message: 'User registered successfully',
      user: userWithoutPassword 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: String(error) });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = DatabaseFactory.getDatabase();
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await AuthService.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = AuthService.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({ 
      message: 'Login successful',
      token,
      user: userWithoutPassword 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error: String(error) });
  }
};

export const switchDatabase = async (req: Request, res: Response) => {
  try {
    const { dbType } = req.body;

    if (dbType !== 'mongodb' && dbType !== 'sqlite') {
      return res.status(400).json({ message: 'Invalid database type. Use "mongodb" or "sqlite"' });
    }

    await DatabaseFactory.switchDatabase(dbType);

    res.status(200).json({ 
      message: `Switched to ${dbType.toUpperCase()}`,
      currentDb: dbType
    });
  } catch (error) {
    res.status(500).json({ message: 'Error switching database', error: String(error) });
  }
};

export const getCurrentDatabase = (req: Request, res: Response) => {
  const currentDb = DatabaseFactory.getCurrentDbType();
  res.status(200).json({ currentDb });
};
