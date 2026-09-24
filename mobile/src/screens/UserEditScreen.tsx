import React, { useState, useEffect } from 'react';
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
import { getUserById, type UserDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import CustomPicker from '../components/CustomPicker';
import { SUBJECTS } from '../constants/academicOptions';

type RootStackParamList = {
  UserEdit: { userId: string };
  UserView: { userId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'UserEdit'>;

export default function UserEditScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const canEditEmail = currentUser?.role === 'admin';

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const data = await getUserById(userId);
      setUser(data);
      setName(data.name);
      setEmail(data.email);
      setSubject(data.subject || '');
      setPhotoUrl(data.photoUrl || '');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o usuário');
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        name: name.trim(),
        subject: subject.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined
      };

      if (canEditEmail && email.trim() !== user?.email) {
        payload.email = email.trim();
      }

      await api.put(`/users/${userId}`, payload);
      Alert.alert('Sucesso', 'Perfil atualizado');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível atualizar');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      secretaria: 'Secretaria',
      professor: 'Professor',
      estudante: 'Estudante'
    };
    return roles[role] || role;
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <View style={styles.content}>
        <Text style={styles.title}>Editar Perfil</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Função:</Text>
          <Text style={styles.value}>{getRoleName(user.role)}</Text>
        </View>

        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome completo"
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, !canEditEmail && styles.inputDisabled]}
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={canEditEmail}
        />
        {!canEditEmail && (
          <Text style={styles.hint}>Apenas administradores podem alterar emails</Text>
        )}

        {(user.role === 'professor' || user.role === 'estudante') && (
          <CustomPicker
            label="Disciplina"
            value={subject}
            onValueChange={setSubject}
            options={SUBJECTS}
            placeholder="Selecione a disciplina"
            required={user.role === 'professor'}
          />
        )}

        <Text style={styles.label}>URL da Foto</Text>
        <TextInput
          style={styles.input}
          value={photoUrl}
          onChangeText={setPhotoUrl}
          placeholder="https://exemplo.com/foto.jpg"
          autoCapitalize="none"
        />

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading || !name.trim()}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15
  },
  value: {
    fontSize: 16,
    color: '#666'
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999'
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic'
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 30
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#FF3B30'
  },
  saveButton: {
    backgroundColor: '#34C759'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
