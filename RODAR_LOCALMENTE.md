# 🚀 Como Rodar a Plataforma Localmente

## ⚡ Início Rápido

### Opção 1: Com PostgreSQL (Recomendado)

#### 1. Instalar PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ou baixar de:** https://www.postgresql.org/download/

#### 2. Criar Banco de Dados

```bash
# Criar banco
createdb edumagico

# Ou via psql
psql postgres
CREATE DATABASE edumagico;
\q
```

#### 3. Configurar Backend

```bash
cd server

# O arquivo .env já foi criado, mas verifique as credenciais:
# DB_PASSWORD=postgres (ou sua senha)
# GEMINI_API_KEY=sua-chave (opcional, mas necessário para IA)

# Instalar dependências (já feito)
# npm install

# Popular rotas
npx ts-node src/scripts/populateRoutes.ts
```

#### 4. Iniciar Servidor Backend

```bash
cd server
npm run dev
```

Você deve ver:
```
✅ Database connected successfully
🚀 Server running on port 3001
```

#### 5. Iniciar Frontend (outro terminal)

```bash
# Na raiz do projeto
npm run dev
```

Acesse: `http://localhost:3000`

---

### Opção 2: Com Docker (Mais Fácil)

Se você tem Docker instalado:

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Aguardar alguns segundos para o banco inicializar
sleep 5

# Popular rotas
cd server
npx ts-node src/scripts/populateRoutes.ts

# Iniciar backend
npm run dev

# Em outro terminal, iniciar frontend
cd ..
npm run dev
```

---

## 🔍 Verificar se está funcionando

### Backend
```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"..."}
```

### Frontend
Acesse: `http://localhost:3000`

---

## 🐛 Problemas e Soluções

### Erro: "connect ECONNREFUSED ::1:5432"

**Problema:** PostgreSQL não está rodando

**Solução:**
```bash
# Verificar se está rodando
pg_isready

# Se não estiver, iniciar:
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Ou usar Docker
docker-compose up -d
```

### Erro: "database does not exist"

**Solução:**
```bash
createdb edumagico
# Ou
psql postgres -c "CREATE DATABASE edumagico;"
```

### Erro: "password authentication failed"

**Solução:**
1. Verifique a senha no arquivo `server/.env`
2. Ou altere a senha do PostgreSQL:
```bash
psql postgres
ALTER USER postgres PASSWORD 'postgres';
```

### Erro: "Cannot find module"

**Solução:**
```bash
cd server && npm install
cd .. && npm install
```

### Porta 3001 já em uso

**Solução:**
Altere no `server/.env`:
```
PORT=3002
```

E no frontend, atualize a URL da API.

---

## 📝 Checklist

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `edumagico` criado
- [ ] Arquivo `server/.env` configurado
- [ ] Dependências instaladas (`npm install` em ambos)
- [ ] Rotas populadas (`npx ts-node src/scripts/populateRoutes.ts`)
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000

---

## 🎯 Próximos Passos

1. **Registrar um usuário** via API ou frontend
2. **Fazer login** para obter o token JWT
3. **Criar conteúdo** (requer plano Premium ou ser Professor)
4. **Configurar Gemini API** para usar geração de conteúdo com IA

---

## 💡 Dica

Para facilitar, você pode criar um script que inicia tudo:

```bash
#!/bin/bash
# start-all.sh

# Iniciar PostgreSQL (se usar Docker)
docker-compose up -d

# Aguardar banco
sleep 3

# Backend
cd server
npm run dev &
BACKEND_PID=$!

# Aguardar backend iniciar
sleep 3

# Frontend
cd ..
npm run dev &
FRONTEND_PID=$!

echo "✅ Backend PID: $BACKEND_PID"
echo "✅ Frontend PID: $FRONTEND_PID"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
```

---

**Boa sorte! 🚀**

