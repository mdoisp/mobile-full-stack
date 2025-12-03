import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import CustomPicker from '../components/CustomPicker';
import { SUBJECTS, COURSES } from '../constants/academicOptions';

type RootStackParamList = {
  UserRegister: { preSelectedRole?: 'estudante' } | undefined;
};

type UserRegisterRouteProp = RouteProp<RootStackParamList, 'UserRegister'>;

export default function UserRegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute<UserRegisterRouteProp>();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  
  const preSelectedRole = route.params?.preSelectedRole || '';
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: preSelectedRole as 'secretaria' | 'professor' | 'estudante' | '',
    subject: '',
    enrollment: '',
    course: ''
  });

  // Define quais roles o usuário pode criar
  const availableRoles = currentUser?.role === 'admin' 
    ? [
        { value: 'secretaria', label: 'Secretaria' },
        { value: 'professor', label: 'Professor' },
        { value: 'estudante', label: 'Estudante' }
      ]
    : [{ value: 'estudante', label: 'Estudante' }];

  const canSubmit = form.name.trim() && 
                    form.email.trim() && 
                    form.password.trim() && 
                    form.role &&
                    (form.role !== 'estudante' || (form.enrollment.trim() && form.course.trim()));

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
        role: form.role
      };

      if (form.subject.trim()) {
        payload.subject = form.subject.trim();
      }

      // Criar usuário
      await api.post('/auth/register', payload);
      
      // Se for estudante, criar também o registro acadêmico
      if (form.role === 'estudante') {
        await api.post('/students', {
          name: form.name.trim(),
          enrollment: form.enrollment.trim(),
          course: form.course.trim(),
          subject: form.subject.trim() || undefined
        });
      }
      
      Alert.alert(
        'Sucesso',
        `${form.role === 'estudante' ? 'Estudante' : 'Usuário'} ${form.name} criado com sucesso!`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Não foi possível criar o usuário';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.title}>Criar Nova Conta</Text>
        <Text style={styles.subtitle}>
          {currentUser?.role === 'admin' 
            ? 'Crie contas para Secretaria, Professores e Estudantes'
            : 'Crie contas para Estudantes'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            placeholder="Digite o nome completo"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
            placeholder="Digite o email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Senha *</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={(text) => setForm(prev => ({ ...prev, password: text }))}
            placeholder="Digite a senha"
            secureTextEntry
            autoCapitalize="none"
          />
          <Text style={styles.hint}>Mínimo 6 caracteres</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Usuário *</Text>
          <View style={styles.roleContainer}>
            {availableRoles.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleButton,
                  form.role === role.value && styles.roleButtonSelected
                ]}
                onPress={() => setForm(prev => ({ ...prev, role: role.value as any }))}
              >
                <Text style={[
                  styles.roleButtonText,
                  form.role === role.value && styles.roleButtonTextSelected
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {(form.role === 'professor' || form.role === 'estudante') && (
          <CustomPicker
            label="Disciplina"
            value={form.subject}
            onValueChange={(value) => setForm(prev => ({ ...prev, subject: value }))}
            options={SUBJECTS}
            placeholder="Selecione a disciplina"
            required={form.role === 'professor'}
          />
        )}

        {form.role === 'estudante' && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Matrícula *</Text>
              <TextInput
                style={styles.input}
                value={form.enrollment}
                onChangeText={(text) => setForm(prev => ({ ...prev, enrollment: text }))}
                placeholder="Digite a matrícula"
                autoCapitalize="characters"
              />
            </View>

            <CustomPicker
              label="Curso"
              value={form.course}
              onValueChange={(value) => setForm(prev => ({ ...prev, course: value }))}
              options={COURSES}
              placeholder="Selecione o curso"
              required
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Criando...' : 'Criar Conta'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  roleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff'
  },
  roleButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FF'
  },
  roleButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  roleButtonTextSelected: {
    color: '#007AFF',
    fontWeight: '600'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
