import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import DatabaseSelectionScreen from './src/screens/DatabaseSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import CategorySelectionScreen from './src/screens/CategorySelectionScreen';

// Contexto para controlar o estado do dbSelected
export const DbSelectionContext = React.createContext<{
  resetToDbSelection: () => void;
}>({ resetToDbSelection: () => {} });
import ListScreen from './src/screens/ListScreen';
import FormScreen from './src/screens/FormScreen';
import ViewScreen from './src/screens/ViewScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UsersListScreen from './src/screens/UsersListScreen';
import UserViewScreen from './src/screens/UserViewScreen';
import UserEditScreen from './src/screens/UserEditScreen';
import GradeFormScreen from './src/screens/GradeFormScreen';
import UserRegisterScreen from './src/screens/UserRegisterScreen';
import * as storage from './src/services/storage';
import type { DatabaseType } from './src/services/storage';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, signOut, loading: authLoading, resetToDbSelection: authResetDb, switchDatabase } = useAuth();
  const [dbSelected, setDbSelected] = useState(false);

  // Handler para reset completo (volta para seleção de banco)
  const handleResetToDbSelection = async () => {
    await authResetDb();
    setDbSelected(false);
  };

  // Handler quando um banco é selecionado
  const handleDatabaseSelected = async (dbType: DatabaseType) => {
    console.log('Database selected in App:', dbType);
    try {
      // Atualizar o contexto para refletir o banco selecionado
      await switchDatabase(dbType);
      setDbSelected(true);
    } catch (error) {
      console.error('Error selecting database:', error);
      setDbSelected(true); // Continua mesmo se der erro
    }
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!dbSelected) {
    return <DatabaseSelectionScreen onSelectDatabase={handleDatabaseSelected} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Define a tela inicial baseada no role
  const getInitialRouteName = () => {
    if (user.role === 'admin' || user.role === 'secretaria') {
      return 'CategorySelection';
    }
    return 'Students';
  };

  return (
    <DbSelectionContext.Provider value={{ resetToDbSelection: handleResetToDbSelection }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={getInitialRouteName()}>
        <Stack.Screen 
          name="CategorySelection" 
          component={CategorySelectionScreen} 
          options={({ navigation }) => ({
            title: 'Categorias',
            headerLeft: () => null,
            headerRight: () => (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Profile')}
                  style={{
                    backgroundColor: '#007AFF',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 6
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={signOut}
                  style={{
                    backgroundColor: '#FF3B30',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 6
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Sair</Text>
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        <Stack.Screen 
          name="Students" 
          component={ListScreen} 
          options={({ navigation }) => ({
            title: 'Estudantes',
            headerRight: () => (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Profile')}
                  style={{
                    backgroundColor: '#007AFF',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 6
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={signOut}
                  style={{
                    backgroundColor: '#FF3B30',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 6
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Sair</Text>
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="StudentForm"
          component={FormScreen}
          options={{ title: 'Novo Estudante' }}
        />
        <Stack.Screen 
          name="StudentView" 
          component={ViewScreen} 
          options={{ title: 'Detalhes do Estudante' }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Meu Perfil' }} 
        />
        <Stack.Screen 
          name="UsersList" 
          component={UsersListScreen} 
          options={({ route }) => {
            try {
              const params = route.params as { category?: string } | undefined;
              const titles: Record<string, string> = {
                secretaria: 'Secretaria',
                professor: 'Professores',
                estudante: 'Estudantes'
              };
              const category = params?.category;
              return {
                title: category && titles[category] ? titles[category] : 'Usuários'
              };
            } catch (error) {
              console.error('Error in UsersList options:', error);
              return { title: 'Usuários' };
            }
          }} 
        />
        <Stack.Screen 
          name="UserView" 
          component={UserViewScreen} 
          options={{ title: 'Perfil do Usuário' }} 
        />
        <Stack.Screen 
          name="UserEdit" 
          component={UserEditScreen} 
          options={{ title: 'Editar Usuário' }} 
        />
        <Stack.Screen 
          name="GradeForm" 
          component={GradeFormScreen} 
          options={{ title: 'Nota e Frequência' }} 
        />
        <Stack.Screen 
          name="UserRegister" 
          component={UserRegisterScreen} 
          options={{ title: 'Criar Nova Conta' }} 
        />
      </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </DbSelectionContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
