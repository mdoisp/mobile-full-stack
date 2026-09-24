import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { getUserById, type UserDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  UserView: { userId: string };
  UserEdit: { userId: string };
};

type UserViewRouteProp = RouteProp<RootStackParamList, 'UserView'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  route: UserViewRouteProp;
};

export default function UserViewScreen({ route }: Props) {
  const { userId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin pode editar todos, Secretaria pode editar professores e estudantes
  const canEdit = currentUser?.role === 'admin' || 
    (currentUser?.role === 'secretaria' && user?.role !== 'admin');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await getUserById(userId);
      setUser(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o usuário');
      console.error(error);
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: '#FF3B30',
      secretaria: '#FF9500',
      professor: '#007AFF',
      estudante: '#34C759'
    };
    return colors[role] || '#666';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Usuário não encontrado</Text>
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
            <View style={[styles.photoPlaceholder, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={styles.photoPlaceholderText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nome:</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Função:</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={styles.roleText}>{getRoleName(user.role)}</Text>
          </View>
        </View>

        {user.subject && (
          <View style={styles.section}>
            <Text style={styles.label}>Disciplina:</Text>
            <Text style={styles.value}>{user.subject}</Text>
          </View>
        )}

        {canEdit && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('UserEdit', { userId: user.id })}
          >
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  roleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    fontSize: 16,
    color: '#666'
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
