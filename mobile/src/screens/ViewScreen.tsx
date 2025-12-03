import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudentDTO, GradeDTO, getGradesByStudentId } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  StudentView: { student: StudentDTO };
  GradeForm: { studentId: string; studentName: string; existing?: GradeDTO };
};

type Props = NativeStackScreenProps<RootStackParamList, 'StudentView'>;

export default function ViewScreen({ route, navigation }: Props) {
  const { student } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [grades, setGrades] = useState<GradeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const canEditGrades = user?.role === 'admin' || user?.role === 'professor';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadGrades);
    return unsubscribe;
  }, [navigation]);

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <View style={styles.section}>
        <Text style={styles.title}>{student.name}</Text>
        <Text style={styles.item}>Matrícula: {student.enrollment}</Text>
        <Text style={styles.item}>Curso: {student.course}</Text>
        {student.subject && (
          <Text style={styles.item}>Disciplina: {student.subject}</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notas e Frequência</Text>
          {canEditGrades && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('GradeForm', {
                studentId: student.id!,
                studentName: student.name
              })}
            >
              <Text style={styles.addButtonText}>+ Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : grades.length > 0 ? (
          grades.map((grade) => (
            <TouchableOpacity
              key={grade.id}
              style={styles.gradeCard}
              onPress={() => canEditGrades && navigation.navigate('GradeForm', {
                studentId: student.id!,
                studentName: student.name,
                existing: grade
              })}
              disabled={!canEditGrades}
            >
              <View style={styles.gradeContent}>
                <Text style={styles.gradeSub}>Matéria: {grade.subject}</Text>
                <Text style={styles.gradeSub}>Nota: {grade.grade.toFixed(1)}</Text>
                <Text style={styles.gradeSub}>Frequência: {grade.attendance.toFixed(0)}%</Text>
              </View>
              {canEditGrades && (
                <Text style={styles.editIcon}>Editar</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhuma nota registrada</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5'
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  gradeCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center'
  },
  gradeContent: {
    flex: 1
  },
  editIcon: {
    fontSize: 20,
    marginLeft: 10
  },
  gradeSub: { fontSize: 14, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
});


