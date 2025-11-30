# 📚 Documentação da API

Base URL: `http://localhost:3000`

## 🔐 Autenticação

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer {token}
```

---

## Auth Endpoints

### POST /auth/register
Registrar novo usuário no sistema.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123",
  "role": "admin",  // "admin" | "secretaria" | "professor" | "estudante"
  "name": "Nome Completo"
}
```

**Response 201:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "role": "admin",
    "name": "Nome Completo",
    "createdAt": "2025-11-30T..."
  }
}
```

**Errors:**
- 400: Campos obrigatórios faltando
- 409: Email já cadastrado

---

### POST /auth/login
Autenticar usuário e receber token JWT.

**Body:**
```json
{
  "email": "admin@escola.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "email": "admin@escola.com",
    "role": "admin",
    "name": "Administrador",
    "createdAt": "2025-11-30T..."
  }
}
```

**Errors:**
- 400: Email ou senha faltando
- 401: Credenciais inválidas

---

### POST /auth/switch-db
Trocar banco de dados ativo (MongoDB ↔ SQLite).

**Auth:** ✅ Required  
**Roles:** Admin only

**Body:**
```json
{
  "dbType": "sqlite"  // "mongodb" | "sqlite"
}
```

**Response 200:**
```json
{
  "message": "Switched to SQLITE",
  "currentDb": "sqlite"
}
```

**Errors:**
- 400: dbType inválido
- 401: Não autenticado
- 403: Sem permissão (não é admin)

---

### GET /auth/current-db
Verificar qual banco está ativo.

**Auth:** ✅ Required  
**Roles:** Todos

**Response 200:**
```json
{
  "currentDb": "mongodb"
}
```

---

## Students Endpoints

### GET /students
Listar todos os estudantes.

**Auth:** ✅ Required  
**Roles:** Admin, Secretaria, Professor

**Response 200:**
```json
[
  {
    "id": "abc123",
    "name": "Carlos Silva",
    "enrollment": "20250001",
    "course": "Ciência da Computação",
    "createdAt": "2025-11-30T..."
  },
  ...
]
```

**Errors:**
- 401: Não autenticado
- 403: Sem permissão (estudante não pode listar todos)

---

### GET /students/:id
Buscar estudante por ID.

**Auth:** ✅ Required  
**Roles:** Todos

**Response 200:**
```json
{
  "id": "abc123",
  "name": "Carlos Silva",
  "enrollment": "20250001",
  "course": "Ciência da Computação",
  "createdAt": "2025-11-30T..."
}
```

**Errors:**
- 404: Estudante não encontrado

---

### POST /students
Criar novo estudante.

**Auth:** ✅ Required  
**Roles:** Admin, Secretaria

**Body:**
```json
{
  "name": "Maria Oliveira",
  "enrollment": "20250004",
  "course": "Engenharia de Software"
}
```

**Response 201:**
```json
{
  "id": "xyz789",
  "name": "Maria Oliveira",
  "enrollment": "20250004",
  "course": "Engenharia de Software",
  "createdAt": "2025-11-30T..."
}
```

**Errors:**
- 400: Campos obrigatórios faltando
- 403: Sem permissão
- 409: Matrícula já existe

---

### PUT /students/:id
Atualizar estudante existente.

**Auth:** ✅ Required  
**Roles:** Admin, Secretaria

**Body:** (todos os campos são opcionais)
```json
{
  "name": "Maria Silva Oliveira",
  "course": "Sistemas de Informação"
}
```

**Response 200:**
```json
{
  "id": "xyz789",
  "name": "Maria Silva Oliveira",
  "enrollment": "20250004",
  "course": "Sistemas de Informação",
  "createdAt": "2025-11-30T..."
}
```

**Errors:**
- 403: Sem permissão
- 404: Estudante não encontrado

---

### DELETE /students/:id
Deletar estudante.

**Auth:** ✅ Required  
**Roles:** Admin only

**Response 200:**
```json
{
  "message": "Student deleted successfully"
}
```

**Errors:**
- 403: Sem permissão
- 404: Estudante não encontrado

---

## Grades Endpoints

### GET /grades
Listar todas as notas do sistema.

**Auth:** ✅ Required  
**Roles:** Admin, Secretaria

**Response 200:**
```json
[
  {
    "id": "grade123",
    "studentId": "abc123",
    "subject": "Programação I",
    "grade": 8.5,
    "attendance": 90,
    "createdAt": "2025-11-30T..."
  },
  ...
]
```

---

### GET /grades/student/:studentId
Buscar notas de um estudante específico.

**Auth:** ✅ Required  
**Roles:** Todos (estudante pode ver só as próprias)

**Response 200:**
```json
[
  {
    "id": "grade123",
    "studentId": "abc123",
    "subject": "Programação I",
    "grade": 8.5,
    "attendance": 90,
    "createdAt": "2025-11-30T..."
  },
  {
    "id": "grade124",
    "studentId": "abc123",
    "subject": "Matemática Discreta",
    "grade": 7.0,
    "attendance": 85,
    "createdAt": "2025-11-30T..."
  }
]
```

---

### POST /grades
Criar nova nota/frequência.

**Auth:** ✅ Required  
**Roles:** Admin, Secretaria, Professor

**Body:**
```json
{
  "studentId": "abc123",
  "subject": "Banco de Dados",
  "grade": 9.0,
  "attendance": 95
}
```

**Validações:**
- `grade`: 0 ≤ grade ≤ 10
- `attendance`: 0 ≤ attendance ≤ 100

**Response 201:**
```json
{
  "id": "grade125",
  "studentId": "abc123",
  "subject": "Banco de Dados",
  "grade": 9.0,
  "attendance": 95,
  "createdAt": "2025-11-30T..."
}
```

**Errors:**
- 400: Dados inválidos ou fora do range
- 403: Sem permissão
- 404: Estudante não encontrado

---

### PUT /grades/:id
Atualizar nota/frequência existente.

**Auth:** ✅ Required  
**Roles:** Admin, Secretaria, Professor

**Body:** (campos opcionais)
```json
{
  "grade": 9.5,
  "attendance": 98
}
```

**Response 200:**
```json
{
  "id": "grade125",
  "studentId": "abc123",
  "subject": "Banco de Dados",
  "grade": 9.5,
  "attendance": 98,
  "createdAt": "2025-11-30T..."
}
```

---

### DELETE /grades/:id
Deletar nota.

**Auth:** ✅ Required  
**Roles:** Admin only

**Response 200:**
```json
{
  "message": "Grade deleted successfully"
}
```

---

## Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (duplicado) |
| 500 | Erro interno |

---

## Matriz de Permissões

| Endpoint | Admin | Secretaria | Professor | Estudante |
|----------|-------|------------|-----------|-----------|
| GET /students | ✅ | ✅ | ✅ | ❌ |
| GET /students/:id | ✅ | ✅ | ✅ | ✅ |
| POST /students | ✅ | ✅ | ❌ | ❌ |
| PUT /students/:id | ✅ | ✅ | ❌ | ❌ |
| DELETE /students/:id | ✅ | ❌ | ❌ | ❌ |
| GET /grades | ✅ | ✅ | ❌ | ❌ |
| GET /grades/student/:id | ✅ | ✅ | ✅ | ✅* |
| POST /grades | ✅ | ✅ | ✅ | ❌ |
| PUT /grades/:id | ✅ | ✅ | ✅ | ❌ |
| DELETE /grades/:id | ✅ | ❌ | ❌ | ❌ |
| POST /auth/switch-db | ✅ | ❌ | ❌ | ❌ |

*Estudante pode ver apenas suas próprias notas

---

## Exemplos de Uso com JavaScript/Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Login
const { data } = await api.post('/auth/login', {
  email: 'admin@escola.com',
  password: 'admin123'
});

// Configurar token para próximas requisições
api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

// Listar estudantes
const students = await api.get('/students');

// Criar estudante
const newStudent = await api.post('/students', {
  name: 'João Silva',
  enrollment: '20251000',
  course: 'Matemática'
});

// Criar nota
const grade = await api.post('/grades', {
  studentId: newStudent.data.id,
  subject: 'Cálculo I',
  grade: 8.0,
  attendance: 92
});
```
