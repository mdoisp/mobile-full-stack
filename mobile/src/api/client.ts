import axios from 'axios';
import Constants from 'expo-constants';

// Resolve extras tanto em dev (Expo Go) quanto em build
const extras: any = (Constants.expoConfig?.extra as any)
  ?? (Constants as any).manifestExtra
  ?? (Constants as any).manifest?.extra;

const apiBaseUrl: string | undefined = extras?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  console.error('apiBaseUrl não definido. Configure em app.json (expo.extra.apiBaseUrl) ou EXPO_PUBLIC_API_BASE_URL');
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interfaces
export interface StudentDTO {
  id?: string;
  name: string;
  enrollment: string;
  course: string;
  createdAt?: Date;
}

export interface GradeDTO {
  id?: string;
  studentId: string;
  subject: string;
  grade: number;
  attendance: number;
  createdAt?: Date;
}

// Students API
export async function fetchStudents(): Promise<StudentDTO[]> {
  const { data } = await api.get<StudentDTO[]>('/students');
  return data;
}

export async function getStudentById(id: string): Promise<StudentDTO> {
  const { data } = await api.get<StudentDTO>(`/students/${id}`);
  return data;
}

export async function createStudent(payload: Omit<StudentDTO, 'id' | 'createdAt'>): Promise<StudentDTO> {
  const { data } = await api.post<StudentDTO>('/students', payload);
  return data;
}

export async function updateStudent(id: string, payload: Partial<StudentDTO>): Promise<StudentDTO> {
  const { data } = await api.put<StudentDTO>(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  await api.delete(`/students/${id}`);
}

// Grades API
export async function fetchGrades(): Promise<GradeDTO[]> {
  const { data } = await api.get<GradeDTO[]>('/grades');
  return data;
}

export async function getGradesByStudentId(studentId: string): Promise<GradeDTO[]> {
  const { data } = await api.get<GradeDTO[]>(`/grades/student/${studentId}`);
  return data;
}

export async function createGrade(payload: Omit<GradeDTO, 'id' | 'createdAt'>): Promise<GradeDTO> {
  const { data } = await api.post<GradeDTO>('/grades', payload);
  return data;
}

export async function updateGrade(id: string, payload: Partial<GradeDTO>): Promise<GradeDTO> {
  const { data } = await api.put<GradeDTO>(`/grades/${id}`, payload);
  return data;
}

export async function deleteGrade(id: string): Promise<void> {
  await api.delete(`/grades/${id}`);
}


