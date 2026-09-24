import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createGrade, updateGrade, deleteGrade, type GradeDTO } from '../api/client';
import CustomPicker from '../components/CustomPicker';
import { SUBJECTS } from '../constants/academicOptions';

type RootStackParamList = {
  GradeForm: { studentId: string; studentName: string; existing?: GradeDTO };
  StudentView: { student: any };
};

type Props = NativeStackScreenProps<RootStackParamList, 'GradeForm'>;

export default function GradeFormScreen({ navigation, route }: Props) {
  const { studentId, studentName, existing } = route.params;
  const editing = Boolean(existing);
  const insets = useSafeAreaInsets();

  const [subject, setSubject] = useState(existing?.subject || '');
  const [grade, setGrade] = useState(existing?.grade?.toString() || '');
  const [attendance, setAttendance] = useState(existing?.attendance?.toString() || '');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const gradeNum = parseFloat(grade);
    const attendanceNum = parseFloat(attendance);
    return (
      subject.trim() !== '' &&
      !isNaN(gradeNum) &&
      gradeNum >= 0 &&
      gradeNum <= 10 &&
      !isNaN(attendanceNum) &&
      attendanceNum >= 0 &&
      attendanceNum <= 100
    );
  }, [subject, grade, attendance]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      const payload = {
        studentId,
        subject: subject.trim(),
        grade: parseFloat(grade),
        attendance: parseFloat(attendance)
      };

      if (editing && existing?.id) {
        await updateGrade(existing.id, payload);
      } else {
        await createGrade(payload);
      }

      Alert.alert('Sucesso', editing ? 'Nota atualizada' : 'Nota adicionada');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!existing?.id) return;

    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja deletar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteGrade(existing.id!);
              Alert.alert('Sucesso', 'Nota deletada');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Não foi possível deletar');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {editing ? 'Editar Nota' : 'Adicionar Nota'}
        </Text>
        <Text style={styles.subtitle}>Aluno: {studentName}</Text>

        <CustomPicker
          label="Matéria/Disciplina"
          value={subject}
          onValueChange={setSubject}
          options={SUBJECTS}
          placeholder="Selecione a disciplina"
          required
        />

        <Text style={styles.label}>Nota (0 a 10)</Text>
        <TextInput
          style={styles.input}
          value={grade}
          onChangeText={setGrade}
          placeholder="Ex: 8.5"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Frequência (%)</Text>
        <TextInput
          style={styles.input}
          value={attendance}
          onChangeText={setAttendance}
          placeholder="Ex: 90"
          keyboardType="decimal-pad"
        />

        <TouchableOpacity
          style={[styles.button, styles.submitButton, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Adicionar Nota'}
          </Text>
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Deletar Nota</Text>
          </TouchableOpacity>
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
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  submitButton: {
    backgroundColor: '#34C759'
  },
  deleteButton: {
    backgroundColor: '#FF3B30'
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
