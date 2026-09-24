import { DatabaseFactory } from './database/DatabaseFactory.js';
import { AuthService } from './services/auth.service.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.DATABASE_URL;

if (!MONGO_URL) {
  console.error('DATABASE_URL não definida no .env');
  process.exit(1);
}

async function seed() {
  console.log('Iniciando seed do banco de dados...');

  await DatabaseFactory.initialize('mongodb', MONGO_URL!, './database.sqlite');
  const db = DatabaseFactory.getDatabase();

  try {
    // Criar senhas hasheadas
    const adminPassword = await AuthService.hashPassword('admin123');
    const secretariaPassword = await AuthService.hashPassword('secretaria123');
    const professorPassword = await AuthService.hashPassword('professor123');
    const estudantePassword = await AuthService.hashPassword('estudante123');

    // Cria usuários administrativos em ambos os bancos
    console.log('Criando usuários administrativos...');
    
    const admin = await DatabaseFactory.syncToBoth(db =>
      db.createUser({
        email: 'admin@escola.com',
        password: adminPassword,
        role: 'admin',
        name: 'Administrador',
      })
    );
    console.log('Admin criado');

    const secretaria = await DatabaseFactory.syncToBoth(db =>
      db.createUser({
        email: 'secretaria@escola.com',
        password: secretariaPassword,
        role: 'secretaria',
        name: 'Maria Secretária',
      })
    );
    console.log('Secretaria criada');

    const professor = await DatabaseFactory.syncToBoth(db =>
      db.createUser({
        email: 'professor@escola.com',
        password: professorPassword,
        role: 'professor',
        name: 'João Professor',
        subject: 'Programação I', // Disciplina do professor
      })
    );
    console.log('Professor criado (Disciplina: Programação I)');

    const professor2 = await DatabaseFactory.syncToBoth(db =>
      db.createUser({
        email: 'professor2@escola.com',
        password: professorPassword,
        role: 'professor',
        name: 'Maria Professora',
        subject: 'Banco de Dados', // Disciplina diferente
      })
    );
    console.log('Professor 2 criado (Disciplina: Banco de Dados)');

    // Criar estudantes com seus respectivos usuários de login
    console.log('\nCriando estudantes...');
    
    // Estudante 1: Carlos Silva
    const student1 = await DatabaseFactory.syncToBoth(db =>
      db.createStudent({
        name: 'Carlos Silva',
        enrollment: '20250001',
        course: 'Ciência da Computação',
        subject: 'Programação I',
      })
    );
    console.log('Estudante 1 criado (Carlos Silva - Programação I)');

    const userStudent1 = await DatabaseFactory.syncToBoth(db =>
      db.createUser({
        email: 'carlos.silva@estudante.com',
        password: estudantePassword,
        role: 'estudante',
        name: 'Carlos Silva',
        subject: 'Programação I',
      })
    );
    console.log('Login criado para Carlos Silva');

    // Estudante 2: Mariana Santos
    const student2 = await DatabaseFactory.syncToBoth(db =>
      db.createStudent({
        name: 'Mariana Santos',
        enrollment: '20250002',
        course: 'Engenharia de Software',
        subject: 'Programação I',
      })
    );
    console.log('Estudante 2 criado (Mariana Santos - Programação I)');

    const userStudent2 = await DatabaseFactory.syncToBoth(db =>
      db.createUser({
        email: 'mariana.santos@estudante.com',
        password: estudantePassword,
        role: 'estudante',
        name: 'Mariana Santos',
        subject: 'Programação I',
      })
    );
    console.log('Login criado para Mariana Santos');

    // Estudante 3: Pedro Oliveira
    const student3 = await DatabaseFactory.syncToBoth(db =>
      db.createStudent({
        name: 'Pedro Oliveira',
        enrollment: '20250003',
        course: 'Sistemas de Informação',
        subject: 'Banco de Dados',
      })
    );
    console.log('Estudante 3 criado (Pedro Oliveira - Banco de Dados)');

    const userStudent3 = await DatabaseFactory.syncToBoth(db =>
      db.createUser({
        email: 'pedro.oliveira@estudante.com',
        password: estudantePassword,
        role: 'estudante',
        name: 'Pedro Oliveira',
        subject: 'Banco de Dados',
      })
    );
    console.log('Login criado para Pedro Oliveira');

    // Aguardar um pouco para garantir sincronização
    console.log('\nAguardando sincronização dos bancos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Buscar estudantes de ambos os bancos para pegar os IDs corretos
    console.log('\nCriando notas...');
    
    // Trocar para SQLite e buscar estudantes lá
    await DatabaseFactory.switchDatabase('sqlite');
    const dbSqlite = DatabaseFactory.getDatabase();
    const sqliteStudent1 = await dbSqlite.getStudentByEnrollment('20250001');
    const sqliteStudent2 = await dbSqlite.getStudentByEnrollment('20250002');

    if (sqliteStudent1 && sqliteStudent1.id) {
      await dbSqlite.createGrade({
        studentId: sqliteStudent1.id,
        subject: 'Programação I',
        grade: 8.5,
        attendance: 90,
      });

      await dbSqlite.createGrade({
        studentId: sqliteStudent1.id,
        subject: 'Matemática Discreta',
        grade: 7.0,
        attendance: 85,
      });
    }

    if (sqliteStudent2 && sqliteStudent2.id) {
      await dbSqlite.createGrade({
        studentId: sqliteStudent2.id,
        subject: 'Programação I',
        grade: 9.5,
        attendance: 95,
      });

      await dbSqlite.createGrade({
        studentId: sqliteStudent2.id,
        subject: 'Banco de Dados',
        grade: 8.0,
        attendance: 88,
      });
    }

    // Voltar para MongoDB e criar as mesmas notas
    await DatabaseFactory.switchDatabase('mongodb');
    const dbMongo = DatabaseFactory.getDatabase();

    await dbMongo.createGrade({
      studentId: student1.id!,
      subject: 'Programação I',
      grade: 8.5,
      attendance: 90,
    });

    await dbMongo.createGrade({
      studentId: student1.id!,
      subject: 'Matemática Discreta',
      grade: 7.0,
      attendance: 85,
    });

    await dbMongo.createGrade({
      studentId: student2.id!,
      subject: 'Programação I',
      grade: 9.5,
      attendance: 95,
    });

    await dbMongo.createGrade({
      studentId: student2.id!,
      subject: 'Banco de Dados',
      grade: 8.0,
      attendance: 88,
    });

    console.log('Notas criadas em ambos os bancos');

    console.log('\nSeed concluído com sucesso!');
    console.log('\nCredenciais de acesso:');
    console.log('\nAdministração:');
    console.log('  Admin: admin@escola.com / admin123');
    console.log('  Secretaria: secretaria@escola.com / secretaria123');
    console.log('\nProfessores:');
    console.log('  João Professor (Programação I): professor@escola.com / professor123');
    console.log('  Maria Professora (Banco de Dados): professor2@escola.com / professor123');
    console.log('\nEstudantes:');
    console.log('  Carlos Silva (Programação I): carlos.silva@estudante.com / estudante123');
    console.log('  Mariana Santos (Programação I): mariana.santos@estudante.com / estudante123');
    console.log('  Pedro Oliveira (Banco de Dados): pedro.oliveira@estudante.com / estudante123');
    console.log('\nDisciplinas:');
    console.log('  - Programação I: 2 alunos (Carlos, Mariana)');
    console.log('  - Banco de Dados: 1 aluno (Pedro)');

  } catch (error) {
    console.error('Erro durante o seed:', error);
  } finally {
    await DatabaseFactory.disconnect();
    process.exit(0);
  }
}

seed();
