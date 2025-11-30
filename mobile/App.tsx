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
import * as storage from './src/services/storage';
import type { DatabaseType } from './src/services/storage';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [dbSelected, setDbSelected] = useState(false);
  const [checkingDb, setCheckingDb] = useState(true);

  useEffect(() => {
    checkDatabaseSelection();
  }, []);

  async function checkDatabaseSelection() {
    const storedDb = await storage.getDatabaseType();
    setDbSelected(!!storedDb);
    setCheckingDb(false);
  }

  if (checkingDb || authLoading) {
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
                <TouchableOpacity onPress={() => navigation.navigate('StudentForm')}>
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>Novo</Text>
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
          options={{ title: 'Detalhes' }} 
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
