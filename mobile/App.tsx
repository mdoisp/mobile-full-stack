import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import DatabaseSelectionScreen from './src/screens/DatabaseSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import ListScreen from './src/screens/ListScreen';
import FormScreen from './src/screens/FormScreen';
import ViewScreen from './src/screens/ViewScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UsersListScreen from './src/screens/UsersListScreen';
import UserViewScreen from './src/screens/UserViewScreen';
import * as storage from './src/services/storage';
import type { DatabaseType } from './src/services/storage';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [dbSelected, setDbSelected] = useState(false);

  // Sempre mostra a tela de seleção de banco ao iniciar
  // (removida a verificação de banco armazenado)

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!dbSelected) {
    return <DatabaseSelectionScreen onSelectDatabase={() => setDbSelected(true)} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Students" 
          component={ListScreen} 
          options={({ navigation }) => ({
            title: 'Estudantes',
            headerRight: () => (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('UsersList')}>
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>Usuários</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('StudentForm')}>
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>+ Aluno</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={signOut}>
                  <Text style={{ color: '#FF3B30', fontWeight: '600' }}>Sair</Text>
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
          options={{ title: 'Usuários' }} 
        />
        <Stack.Screen 
          name="UserView" 
          component={UserViewScreen} 
          options={{ title: 'Perfil do Usuário' }} 
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
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
