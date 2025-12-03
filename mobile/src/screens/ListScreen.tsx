import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchStudents, deleteStudent, StudentDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  Students: undefined;
  StudentForm: { existing?: StudentDTO } | undefined;
  StudentView: { student: StudentDTO };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Students'>;

export default function ListScreen({ navigation }: Props) {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const canEdit = user?.role === 'admin' || user?.role === 'secretaria';
  const canDelete = user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStudents();
      setStudents(data);
    } catch (e: any) {
      console.warn('Failed to load students:', e.response?.data?.message || e.message);
      Alert.alert('Erro', 'Falha ao carregar estudantes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDelete = (item: StudentDTO) => {
    if (!canDelete) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para deletar estudantes');
      return;
    }

    Alert.alert('Confirmar', `Deletar ${item.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudent(item.id!);
            await load();
          } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.message || 'Não foi possível deletar');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: StudentDTO }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>Matrícula: {item.enrollment}</Text>
        <Text style={styles.sub}>Curso: {item.course}</Text>
        {item.subject && (
          <Text style={[styles.sub, { fontWeight: '600', color: '#007AFF' }]}>
            {item.subject}
          </Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('StudentView', { student: item })}>
          <Text style={styles.link}>Ver</Text>
        </TouchableOpacity>
        {canEdit && (
          <TouchableOpacity onPress={() => navigation.navigate('StudentForm', { existing: item })}>
            <Text style={styles.link}>Editar</Text>
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Text style={[styles.link, { color: '#d00' }]}>Deletar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id ?? item.enrollment}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32, color: '#666' }}>
            Nenhum estudante cadastrado
          </Text>
        }
      />
      {canEdit && (
        <TouchableOpacity 
          style={[styles.fab, { bottom: 24 + insets.bottom }]} 
          onPress={() => navigation.navigate('StudentForm')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    gap: 12,
  },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { color: '#666', marginTop: 2 },
  actions: { justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 },
  link: { color: '#0a7', fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#0a7',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
});


