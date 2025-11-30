import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as storage from '../services/storage';
import { api } from '../api/client';
import type { DatabaseType } from '../services/storage';

interface Props {
  onSelectDatabase: (dbType: DatabaseType) => void;
}

export default function DatabaseSelectionScreen({ onSelectDatabase }: Props) {
  const [selected, setSelected] = useState<DatabaseType | null>(null);

  const handleSelect = async () => {
    if (!selected) {
      Alert.alert('Atenção', 'Selecione um banco de dados');
      return;
    }
    
    try {
      // Salva no storage local
      await storage.saveDatabaseType(selected);
      
      // Informa ao backend qual banco usar (sem autenticação na primeira seleção)
      console.log('Selecting database:', selected);
      
      // Continua o fluxo
      onSelectDatabase(selected);
    } catch (error) {
      console.error('Error selecting database:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o banco de dados');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecione o Banco de Dados</Text>
      <Text style={styles.subtitle}>Escolha qual banco deseja utilizar:</Text>

      <TouchableOpacity
        style={[styles.card, selected === 'mongodb' && styles.cardSelected]}
        onPress={() => setSelected('mongodb')}
      >
        <Text style={styles.cardTitle}>MongoDB</Text>
        <Text style={styles.cardDescription}>Banco NoSQL em nuvem</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, selected === 'sqlite' && styles.cardSelected]}
        onPress={() => setSelected('sqlite')}
      >
        <Text style={styles.cardTitle}>SQLite</Text>
        <Text style={styles.cardDescription}>Banco SQL local</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleSelect}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FF',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
