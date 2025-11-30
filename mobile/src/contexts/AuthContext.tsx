import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api/client';
import * as storage from '../services/storage';
import type { User, DatabaseType } from '../services/storage';

interface AuthContextData {
  user: User | null;
  dbType: DatabaseType;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchDatabase: (newDbType: DatabaseType) => Promise<void>;
  resetToDbSelection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbType, setDbType] = useState<DatabaseType>('mongodb');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const [storedToken, storedUser, storedDbType] = await Promise.all([
        storage.getToken(),
        storage.getUser(),
        storage.getDatabaseType(),
      ]);

      if (storedToken && storedUser) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(storedUser);
      }

      if (storedDbType) {
        setDbType(storedDbType);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      };

      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      await storage.saveToken(data.token);
      await storage.saveUser(userData);
      
      setUser(userData);

      // Sincronizar o banco de dados do backend após login
      try {
        const currentDbType = await storage.getDatabaseType();
        if (currentDbType) {
          await api.post('/auth/switch-db', { dbType: currentDbType });
          console.log('Backend database synced to:', currentDbType);
        }
      } catch (dbError) {
        console.error('Error syncing database type:', dbError);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async function signOut() {
    await storage.clearAuth();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }

  async function resetToDbSelection() {
    // Limpa tudo e volta para seleção de banco
    await storage.clearAll();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setDbType('mongodb'); // Reset para default
  }

  async function switchDatabase(newDbType: DatabaseType) {
    try {
      await api.post('/auth/switch-db', { dbType: newDbType });
      await storage.saveDatabaseType(newDbType);
      setDbType(newDbType);
      console.log('Database switched to:', newDbType);
    } catch (error: any) {
      console.error('Error switching database:', error);
      throw new Error(error.response?.data?.message || 'Failed to switch database');
    }
  }

  return (
    <AuthContext.Provider value={{ user, dbType, loading, signIn, signOut, switchDatabase, resetToDbSelection }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
