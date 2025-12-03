/**
 * Migração: Adicionar coluna 'status' na tabela students
 * Data: 2025-12-03
 * 
 * Para executar manualmente em um banco SQLite existente:
 * sqlite3 database.sqlite "ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'trancado', 'transferido', 'concluido'));"
 */

import Database from 'better-sqlite3';

export function migrateAddStatusColumn(dbPath: string = './database.sqlite') {
  try {
    const db = new Database(dbPath);
    
    // Verificar se a coluna já existe
    const tableInfo = db.pragma('table_info(students)') as any[];
    const hasStatusColumn = tableInfo.some((col: any) => col.name === 'status');
    
    if (hasStatusColumn) {
      console.log('✓ Coluna "status" já existe na tabela students');
      db.close();
      return;
    }
    
    // Adicionar coluna status
    db.exec(`
      ALTER TABLE students 
      ADD COLUMN status TEXT DEFAULT 'ativo' 
      CHECK(status IN ('ativo', 'trancado', 'transferido', 'concluido'));
    `);
    
    console.log('✓ Coluna "status" adicionada com sucesso à tabela students');
    db.close();
  } catch (error) {
    console.error('Erro na migração:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateAddStatusColumn();
}
