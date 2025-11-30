# 🧪 Guia de Testes do Sistema

## Passo 1: Iniciar o Backend

```bash
cd backend
npm run seed    # Popular o banco com dados de exemplo
npm run dev     # Iniciar servidor na porta 3000
```

Você verá:
```
✅ MongoDB connected
✅ SQLite connected
🎯 Primary database: MONGODB
🚀 Server running on port 3000
```

## Passo 2: Testar API com cURL ou Postman

### 1. Login como Admin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "password": "admin123"
  }'
```

Copie o `token` da resposta para usar nos próximos requests.

### 2. Listar Estudantes (usando o token)
```bash
curl -X GET http://localhost:3000/students \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Criar Novo Estudante (Admin ou Secretaria)
```bash
curl -X POST http://localhost:3000/students \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Silva",
    "enrollment": "20250999",
    "course": "Engenharia"
  }'
```

### 4. Trocar para SQLite (Admin only)
```bash
curl -X POST http://localhost:3000/auth/switch-db \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"dbType": "sqlite"}'
```

### 5. Verificar Banco Ativo
```bash
curl -X GET http://localhost:3000/auth/current-db \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 6. Criar Nota (Admin, Secretaria ou Professor)
```bash
curl -X POST http://localhost:3000/grades \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "ID_DO_ESTUDANTE",
    "subject": "Física I",
    "grade": 9.0,
    "attendance": 92
  }'
```

## Passo 3: Testar Permissões

### Como Professor (não pode criar estudante)
```bash
# Login como professor
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "professor@escola.com",
    "password": "professor123"
  }'

# Tentar criar estudante (deve falhar)
curl -X POST http://localhost:3000/students \
  -H "Authorization: Bearer TOKEN_PROFESSOR" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "enrollment": "99999",
    "course": "Teste"
  }'
```

Resposta esperada:
```json
{
  "message": "Access denied. Insufficient permissions.",
  "required": ["admin", "secretaria"],
  "current": "professor"
}
```

### Como Estudante (só pode ver próprios dados)
```bash
# Login como estudante
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudante@escola.com",
    "password": "estudante123"
  }'

# Tentar listar todos os estudantes (deve falhar)
curl -X GET http://localhost:3000/students \
  -H "Authorization: Bearer TOKEN_ESTUDANTE"
```

## Passo 4: Testar Mobile

1. **Configure o IP no app.json**
```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://192.168.1.100:3000"
    }
  }
}
```
Substitua pelo IP da sua máquina (descubra com `ipconfig` no Windows).

2. **Inicie o app**
```bash
cd mobile
npm start
```

3. **Fluxo de Teste**:
   - Selecione "MongoDB"
   - Login: `admin@escola.com` / `admin123`
   - Veja a lista de estudantes
   - Clique em um estudante para ver notas
   - Clique em "Novo" para adicionar estudante
   - Teste fazer logout e login com outros usuários

## Passo 5: Verificar Sincronização dos Bancos

### Criar algo no MongoDB
```bash
# Certifique-se que está usando MongoDB
curl -X GET http://localhost:3000/auth/current-db \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Crie um estudante
curl -X POST http://localhost:3000/students \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Sync Test",
    "enrollment": "20251000",
    "course": "Teste Sync"
  }'
```

### Trocar para SQLite e verificar
```bash
# Trocar banco
curl -X POST http://localhost:3000/auth/switch-db \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"dbType": "sqlite"}'

# Verificar se o estudante está lá
curl -X GET http://localhost:3000/students \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

O estudante "João Sync Test" deve aparecer! ✨

## 🎯 Cenários de Teste Importantes

### ✅ Teste 1: Hierarquia de Permissões
- Admin pode tudo
- Secretaria pode criar/editar estudantes e notas
- Professor pode apenas editar notas
- Estudante só visualiza

### ✅ Teste 2: Sincronização
- Criar dados no MongoDB
- Trocar para SQLite
- Verificar se os dados estão lá

### ✅ Teste 3: Autenticação
- Tentar acessar endpoints sem token (deve falhar com 401)
- Tentar usar token expirado (deve falhar com 401)
- Login com senha errada (deve falhar com 401)

### ✅ Teste 4: Validações
- Tentar criar estudante com matrícula duplicada
- Tentar criar nota com valor > 10 ou < 0
- Tentar criar nota com frequência > 100 ou < 0

## 📊 Logs Úteis

O backend mostra logs importantes:
```
✅ MongoDB connected
✅ SQLite connected
🎯 Primary database: MONGODB
⚠️ Secondary database sync failed: [erro]
🔄 Switched to SQLITE
```

## 🐛 Troubleshooting

### Erro: "Database not initialized"
- Certifique-se que o servidor iniciou corretamente
- Verifique se o MongoDB está acessível

### Erro 401: "No token provided"
- Você esqueceu o header Authorization
- Formato: `Authorization: Bearer SEU_TOKEN`

### Mobile não conecta no backend
- Verifique o IP no app.json
- Certifique-se que estão na mesma rede
- Teste acessar `http://SEU_IP:3000` no navegador do celular

### SQLite não sincroniza
- Verifique os logs do servidor
- O arquivo `database.sqlite` deve existir na pasta backend
