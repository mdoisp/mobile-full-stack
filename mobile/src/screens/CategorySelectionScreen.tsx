import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  CategorySelection: undefined;
  UsersList: { category: 'secretaria' | 'professor' | 'estudante' };
  Students: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CategorySelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const categories = React.useMemo(() => {
    if (user?.role === 'admin') {
      return [
        { key: 'secretaria', title: 'Secretaria', color: '#FF9500', icon: '👔' },
        { key: 'professor', title: 'Professores', color: '#007AFF', icon: '👨‍🏫' },
        { key: 'estudante', title: 'Estudantes', color: '#34C759', icon: '🎓' }
      ];
    } else if (user?.role === 'secretaria') {
      return [
        { key: 'professor', title: 'Professores', color: '#007AFF', icon: '👨‍🏫' },
        { key: 'estudante', title: 'Estudantes', color: '#34C759', icon: '🎓' }
      ];
    }
    return [];
  }, [user?.role]);

  const handleCategoryPress = (category: string) => {
    if (category === 'estudante') {
      navigation.navigate('Students');
    } else {
      navigation.navigate('UsersList', { 
        category: category as 'secretaria' | 'professor' | 'estudante' 
      });
    }
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
    fontSize: 48,
    marginRight: 20
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1
  }
});
