import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentDTO, GradeDTO, getGradesByStudentId } from '../api/client';

type RootStackParamList = {
  StudentView: { student: StudentDTO };
};

type Props = NativeStackScreenProps<RootStackParamList, 'StudentView'>;

export default function ViewScreen({ route }: Props) {
  const { student } = route.params;
  const [grades, setGrades] = useState<GradeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    try {
      if (student.id) {
        const data = await getGradesByStudentId(student.id);
        setGrades(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>{student.name}</Text>
        <Text style={styles.item}>Matrícula: {student.enrollment}</Text>
        <Text style={styles.item}>Curso: {student.course}</Text>
        {student.subject && (
          <Text style={styles.item}>Disciplina: {student.subject}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas e Frequência</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : grades.length > 0 ? (
          grades.map((grade) => (
            <View key={grade.id} style={styles.gradeCard}>
              <Text style={styles.gradeSub}>Matéria: {grade.subject}</Text>
              <Text style={styles.gradeSub}>Nota: {grade.grade.toFixed(1)}</Text>
              <Text style={styles.gradeSub}>Frequência: {grade.attendance.toFixed(0)}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhuma nota registrada</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { 
    backgroundColor: '#fff', 
    padding: 16, 
    marginBottom: 12 
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#333' },
  item: { marginTop: 6, fontSize: 16, color: '#666' },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12, 
    color: '#333' 
  },
  gradeCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  gradeSub: { fontSize: 14, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
});


