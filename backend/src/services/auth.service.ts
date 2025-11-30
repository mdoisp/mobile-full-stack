import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { IUser } from '../database/IDatabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-secreto-aqui';
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  email: string;
  role: IUser['role'];
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user.id!,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
