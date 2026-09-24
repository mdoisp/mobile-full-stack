import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchStudents, deleteStudent, changeStudentStatus, StudentDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  Students: undefined;
  StudentForm: { existing?: StudentDTO } | undefined;
  StudentView: { student: StudentDTO };
  UserRegister: { preSelectedRole?: 'estudante' } | undefined;
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
  const canChangeStatus = user?.role === 'secretaria';

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
      Alert.alert('Acesso Negado', 'Apenas administradores podem deletar estudantes');
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
            Alert.alert('Sucesso', 'Estudante deletado com sucesso');
            await load();
          } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.message || 'Não foi possível deletar');
          }
        },
      },
    ]);
  };

  const handleChangeStatus = (item: StudentDTO) => {
    if (!canChangeStatus && !canDelete) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para alterar status');
      return;
    }

    const currentStatus = item.status || 'ativo';
    const statusOptions = [
      { label: 'Ativo', value: 'ativo' as const },
      { label: 'Trancado', value: 'trancado' as const },
      { label: 'Transferido', value: 'transferido' as const },
      { label: 'Concluído', value: 'concluido' as const }
    ];

    Alert.alert(
      'Alterar Status',
      `Status atual: ${statusOptions.find(s => s.value === currentStatus)?.label}\n\nSelecione o novo status:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        ...statusOptions.map(status => ({
          text: status.label,
          onPress: async () => {
            try {
              await changeStudentStatus(item.id!, status.value);
              Alert.alert('Sucesso', 'Status atualizado com sucesso');
              await load();
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.message || 'Não foi possível atualizar status');
            }
          }
        }))
      ]
    );
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      ativo: '#34C759',
      trancado: '#FF9500',
      transferido: '#007AFF',
      concluido: '#666'
    };
    return colors[status || 'ativo'] || '#34C759';
  };

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      ativo: 'Ativo',
      trancado: 'Trancado',
      transferido: 'Transferido',
      concluido: 'Concluído'
    };
    return labels[status || 'ativo'] || 'Ativo';
  };

  const renderItem = ({ item }: { item: StudentDTO }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
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
        {canChangeStatus && (
          <TouchableOpacity onPress={() => handleChangeStatus(item)}>
            <Text style={[styles.link, { color: '#FF9500' }]}>Status</Text>
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
          onPress={() => navigation.navigate('UserRegister', { preSelectedRole: 'estudante' })}
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
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


