import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, type UserDTO } from '../api/client';

type RootStackParamList = {
  UsersList: { category?: 'secretaria' | 'professor' | 'estudante' };
  UserView: { userId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UsersListRouteProp = RouteProp<RootStackParamList, 'UsersList'>;

type Props = {
  route?: UsersListRouteProp;
};

export default function UsersListScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const category = route?.params?.category;
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('UsersListScreen mounted with category:', category);
    console.log('Route params:', route?.params);
    setError(null);
    loadUsers();
  }, [category]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const data = await getAllUsers();
      
      console.log('Total users loaded:', data.length);
      console.log('Filtering by category:', category);
      
      // Filtrar por categoria se especificado
      const filteredData = category 
        ? data.filter(u => u.role === category)
        : data;
      
      console.log('Filtered users:', filteredData.length);
      setUsers(filteredData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      const errorMessage = error.message || 'Não foi possível carregar os usuários';
      setError(errorMessage);
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
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

  const renderUser = ({ item }: { item: UserDTO }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserView', { userId: item.id })}
    >
      <View style={styles.userInfo}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.userPhoto} />
        ) : (
          <View style={[styles.userPhotoPlaceholder, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.userPhotoPlaceholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{getRoleName(item.role)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  const getEmptyMessage = () => {
    if (user?.role === 'estudante') {
      return 'Apenas seu perfil está disponível';
    }
    if (category) {
      const categoryNames: Record<string, string> = {
        secretaria: 'secretarias',
        professor: 'professores',
        estudante: 'estudantes'
      };
      return `Nenhum ${categoryNames[category]} encontrado`;
    }
    return 'Nenhum usuário encontrado';
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
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
  list: {
    padding: 10
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15
  },
  userPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userPhotoPlaceholderText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  arrow: {
    fontSize: 30,
    color: '#ccc',
    marginLeft: 10
  }
});
