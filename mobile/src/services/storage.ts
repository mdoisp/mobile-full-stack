import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';
const DB_TYPE_KEY = '@db_type';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'secretaria' | 'professor' | 'estudante';
}

export type DatabaseType = 'mongodb' | 'sqlite';

export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<User | null> => {
  const userStr = await AsyncStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const saveDatabaseType = async (dbType: DatabaseType): Promise<void> => {
  await AsyncStorage.setItem(DB_TYPE_KEY, dbType);
};

export const getDatabaseType = async (): Promise<DatabaseType | null> => {
  return (await AsyncStorage.getItem(DB_TYPE_KEY)) as DatabaseType | null;
};

export const clearAuth = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, DB_TYPE_KEY]);
};
