import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getMyProfile, updateMyProfile, type UserDTO } from '../api/client';

export default function ProfileScreen() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await getMyProfile();
      setUser(profile);
      setName(profile.name);
      setPhotoUrl(profile.photoUrl || '');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await updateMyProfile({
        name: name.trim(),
        photoUrl: photoUrl.trim() || undefined
      });
      setUser(updated);
      setEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setPhotoUrl(user.photoUrl || '');
    }
    setEditing(false);
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

  if (loading && !user) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Perfil não encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.photoContainer}>
          {user.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nome:</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Digite seu nome"
            />
          ) : (
            <Text style={styles.value}>{user.name}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
          {authUser?.role !== 'admin' && (
            <Text style={styles.hint}>Apenas o administrador pode alterar o email</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Função:</Text>
          <Text style={styles.value}>{getRoleName(user.role)}</Text>
        </View>

        {user.subject && (
          <View style={styles.section}>
            <Text style={styles.label}>Disciplina:</Text>
            <Text style={styles.value}>{user.subject}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>URL da Foto:</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={photoUrl}
              onChangeText={setPhotoUrl}
              placeholder="https://exemplo.com/foto.jpg"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{user.photoUrl || 'Nenhuma'}</Text>
          )}
        </View>

        <View style={styles.buttons}>
          {editing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
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
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.buttonText}>Editar Perfil</Text>
            </TouchableOpacity>
          )}
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
  content: {
    padding: 20
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF'
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600'
  },
  value: {
    fontSize: 16,
    color: '#333'
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  editButton: {
    backgroundColor: '#007AFF'
  },
  saveButton: {
    backgroundColor: '#34C759'
  },
  cancelButton: {
    backgroundColor: '#FF3B30'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
