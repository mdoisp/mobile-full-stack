# Sistema de Gerenciamento Escolar - Full Stack

Sistema completo de gerenciamento escolar com autenticação, autorização baseada em roles e suporte dual para MongoDB e SQLite.

## 🏗️ Arquitetura

### Backend (Node.js + Express + TypeScript)
- **Banco de Dados Dual**: MongoDB e SQLite sincronizados
- **Autenticação**: JWT (JSON Web Tokens)
- **Autorização**: Baseada em roles (Admin, Secretaria, Professor, Estudante)
- **API RESTful**: Endpoints protegidos com middleware

### Mobile (React Native + Expo)
- **Navegação**: React Navigation
- **Estado Global**: Context API
- **Armazenamento Local**: AsyncStorage
- **Seleção de Banco**: Interface para escolher MongoDB ou SQLite

## 👥 Roles e Permissões

### Admin
- ✅ CRUD completo de todos os dados
- ✅ Gerenciar usuários
- ✅ Trocar banco de dados em runtime

### Secretaria
- ✅ CRUD de estudantes
- ✅ CRUD de notas
- ✅ Visualizar relatórios

### Professor
- ✅ Visualizar estudantes
- ✅ Lançar e editar notas
- ✅ Visualizar frequência

### Estudante
- ✅ Visualizar próprias notas
- ✅ Visualizar própria frequência
- ⛔ Sem permissão de edição

## 📊 Estrutura do Banco de Dados

### Tabela: users
- id, email, password, role, name, createdAt

### Tabela: students
- id, name, enrollment (matrícula), course, createdAt

### Tabela: grades
- id, studentId, subject, grade (0-10), attendance (0-100%), createdAt

## 🚀 Instalação e Configuração

### Backend

1. **Instalar dependências**
```bash
cd backend
npm install
```

2. **Configurar .env**
Já está configurado com MongoDB URL e JWT_SECRET

3. **Popular o banco (seed)**
```bash
npm run seed
```

4. **Iniciar servidor**
```bash
npm run dev
```

### Mobile

1. **Instalar dependências**
```bash
cd mobile
npm install
```

2. **Configurar API Base URL em app.json**
```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://SEU_IP:3000"
    }
  }
}
```

3. **Iniciar app**
```bash
npm start
```

## 🔐 Credenciais Padrão (após seed)

| Role | Email | Senha |
|------|-------|-------|
| Admin | admin@escola.com | admin123 |
| Secretaria | secretaria@escola.com | secretaria123 |
| Professor | professor@escola.com | professor123 |
| Estudante | estudante@escola.com | estudante123 |

## 📱 Fluxo do App Mobile

1. **Seleção de Banco**: Escolher MongoDB ou SQLite
2. **Login**: Autenticação com email e senha
3. **Lista de Estudantes**: Visualizar com permissões baseadas em role
4. **Detalhes**: Ver notas e frequência
5. **Formulário**: Adicionar/Editar (apenas Admin e Secretaria)

## 🛣️ Principais Endpoints

### Autenticação
- POST `/auth/register` - Registrar
- POST `/auth/login` - Login
- POST `/auth/switch-db` - Trocar banco (Admin only)

### Estudantes
- GET `/students` - Listar (Auth required)
- POST `/students` - Criar (Admin, Secretaria)
- PUT `/students/:id` - Atualizar (Admin, Secretaria)
- DELETE `/students/:id` - Deletar (Admin only)

### Notas
- GET `/grades/student/:studentId` - Por estudante
- POST `/grades` - Criar (Admin, Secretaria, Professor)
- PUT `/grades/:id` - Atualizar (Admin, Secretaria, Professor)
- DELETE `/grades/:id` - Deletar (Admin only)

## 🔧 Tecnologias

**Backend**: Node.js, Express, TypeScript, MongoDB, SQLite, JWT, bcrypt  
**Mobile**: React Native, Expo, TypeScript, React Navigation, AsyncStorage, Axios
