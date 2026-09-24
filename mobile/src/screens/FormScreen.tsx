import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createStudent, updateStudent, StudentDTO } from '../api/client';
import CustomPicker from '../components/CustomPicker';
import { SUBJECTS, COURSES } from '../constants/academicOptions';

type RootStackParamList = {
  Students: undefined;
  StudentForm: { existing?: StudentDTO } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'StudentForm'>;

export default function FormScreen({ navigation, route }: Props) {
  const editing = Boolean(route.params?.existing);
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<StudentDTO>(
    route.params?.existing ?? {
      name: '',
      enrollment: '',
      course: '',
      subject: '',
    }
  );

  const canSubmit = useMemo(() => {
    return !!form.name && !!form.enrollment && !!form.course;
  }, [form]);

  const handleSubmit = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        enrollment: form.enrollment.trim(),
        course: form.course.trim(),
        subject: form.subject?.trim() || undefined,
      };

      if (editing && form.id) {
        await updateStudent(form.id, payload);
      } else {
        await createStudent(payload);
      }
      
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Students');
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.message;
      const msg = backendMsg || e?.message || 'Não foi possível salvar.';
      Alert.alert('Erro ao salvar', `${msg}${status ? ` (HTTP ${status})` : ''}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 24 + insets.bottom }]}>
      <Text style={styles.title}>{editing ? 'Editar estudante' : 'Novo estudante'}</Text>

      <Text style={styles.label}>Nome</Text>
      <TextInput 
        style={styles.input} 
        value={form.name} 
        onChangeText={(t) => setForm(prev => ({ ...prev, name: t }))} 
        placeholder="Nome completo" 
      />

      <Text style={styles.label}>Matrícula</Text>
      <TextInput 
        style={styles.input} 
        value={form.enrollment} 
        onChangeText={(t) => setForm(prev => ({ ...prev, enrollment: t }))} 
        placeholder="Ex.: 20250001"
        editable={!editing}
      />

      <CustomPicker
        label="Curso"
        value={form.course}
        onValueChange={(value) => setForm(prev => ({ ...prev, course: value }))}
        options={COURSES}
        placeholder="Selecione o curso"
        required
      />

      <CustomPicker
        label="Disciplina"
        value={form.subject || ''}
        onValueChange={(value) => setForm(prev => ({ ...prev, subject: value }))}
        options={SUBJECTS}
        placeholder="Selecione a disciplina (opcional)"
        required={false}
      />

      <TouchableOpacity 
        style={[styles.btn, { marginTop: 24, backgroundColor: canSubmit ? '#007AFF' : '#aaa' }]} 
        onPress={handleSubmit} 
        disabled={!canSubmit}
      >
        <Text style={styles.btnText}>{editing ? 'Salvar alterações' : 'Adicionar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  label: { fontWeight: '600', marginTop: 12, fontSize: 16, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 6, fontSize: 16 },
  btn: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});