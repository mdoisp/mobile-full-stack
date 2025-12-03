import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { DbSelectionContext } from '../../App';
import { api } from '../api/client';

type RootStackParamList = {
  CategorySelection: undefined;
  UsersList: { category: 'secretaria' | 'professor' | 'estudante' };
  Students: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CategorySelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, dbType } = useAuth();
  const { resetToDbSelection } = React.useContext(DbSelectionContext);

  // Debug: log do dbType
  React.useEffect(() => {
    console.log('CategorySelectionScreen - dbType atual:', dbType);
  }, [dbType]);

  const categories = React.useMemo(() => {
    if (user?.role === 'admin') {
      return [
        { key: 'secretaria', title: 'Secretaria', color: '#FF9500', icon: 'SEC' },
        { key: 'professor', title: 'Professores', color: '#007AFF', icon: 'PROF' },
        { key: 'estudante', title: 'Estudantes', color: '#34C759', icon: 'EST' }
      ];
    } else if (user?.role === 'secretaria') {
      return [
        { key: 'professor', title: 'Professores', color: '#007AFF', icon: 'PROF' },
        { key: 'estudante', title: 'Estudantes', color: '#34C759', icon: 'EST' }
      ];
    }
    return [];
  }, [user?.role]);

  const handleCategoryPress = useCallback((category: string) => {
    try {
      console.log('=== CATEGORY PRESS START ===');
      console.log('Category selected:', category);
      console.log('Category type:', typeof category);
      console.log('Navigation object exists:', !!navigation);
      
      if (category === 'estudante') {
        console.log('Navigating to Students screen');
        navigation.navigate('Students');
      } else {
        const validCategory = category as 'secretaria' | 'professor' | 'estudante';
        console.log('Navigating to UsersList with category:', validCategory);
        console.log('Params object:', { category: validCategory });
        
        // Usar navigate com params explícitos e verificação
        if (navigation && typeof navigation.navigate === 'function') {
          navigation.navigate('UsersList', { 
            category: validCategory
          });
          console.log('Navigation successful');
        } else {
          throw new Error('Navigation object invalid');
        }
      }
      console.log('=== CATEGORY PRESS END ===');
    } catch (error: any) {
      console.error('=== NAVIGATION ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      Alert.alert('Erro', `Não foi possível navegar: ${error?.message || 'Erro desconhecido'}`);
    }
  }, [navigation]);

  const checkBackendDatabase = async () => {
    try {
      const response = await api.get('/auth/current-db');
      const backendDb = response.data.currentDb;
      
      console.log('Frontend dbType:', dbType);
      console.log('Backend currentDb:', backendDb);
      
      Alert.alert(
        'Verificação de Banco',
        `Frontend mostrando: ${dbType === 'mongodb' ? 'MongoDB' : 'SQLite'}\n\nBackend usando: ${backendDb === 'mongodb' ? 'MongoDB' : 'SQLite'}\n\n${dbType === backendDb ? 'Sincronizados!' : 'Dessincronizados!'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error checking backend db:', error);
      Alert.alert('Erro', 'Não foi possível verificar o banco do backend');
    }
  };

  const handleChangeDatabaseType = () => {
    Alert.alert(
      'Trocar Banco de Dados',
      `Você está usando ${dbType === 'mongodb' ? 'MongoDB' : 'SQLite'}. Deseja voltar à seleção de banco?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Verificar Banco', onPress: checkBackendDatabase },
        { 
          text: 'Trocar Banco', 
          onPress: resetToDbSelection,
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Selecione uma Categoria</Text>
        <Text style={styles.subtitle}>
          {user?.role === 'admin' 
            ? 'Escolha qual categoria de usuários deseja visualizar'
            : 'Escolha qual categoria deseja acessar'}
        </Text>

        {user?.role === 'admin' && (
          <View style={styles.dbSection}>
            <Text style={styles.dbLabel}>Banco de Dados Ativo</Text>
            <Text style={styles.dbValue}>
              {dbType === 'mongodb' ? 'MongoDB' : 'SQLite'}
            </Text>
            <TouchableOpacity
              style={styles.dbButton}
              onPress={handleChangeDatabaseType}
            >
              <Text style={styles.dbButtonText}>Trocar Banco de Dados</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[styles.categoryCard, { backgroundColor: category.color }]}
              onPress={() => handleCategoryPress(category.key)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.createUserButton}
          onPress={() => navigation.navigate('UserRegister' as never)}
        >
          <Text style={styles.createUserButtonText}>+ Criar Nova Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20
  },
  categoriesContainer: {
    gap: 15
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  categoryIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 16,
    overflow: 'hidden'
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1
  },
  dbSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  dbLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600'
  },
  dbValue: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
    fontWeight: '600'
  },
  dbButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  dbButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  createUserButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20
  },
  createUserButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
