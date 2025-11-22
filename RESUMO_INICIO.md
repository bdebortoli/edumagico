# ⚡ Resumo - Como Rodar Localmente

## 🎯 Passos Rápidos

### 1. Instalar PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 2. Criar Banco de Dados
```bash
createdb edumagico
```

### 3. Usar Script Automático
```bash
./start.sh
```

**OU** iniciar manualmente:

### 3a. Backend (Terminal 1)
```bash
cd server
npm run dev
```

### 3b. Frontend (Terminal 2)
```bash
npm run dev
```

## ✅ Verificar

- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000

## 🐛 Problema?

**PostgreSQL não conecta?**
- Verifique se está rodando: `pg_isready`
- Ou use Docker: `docker-compose up -d`

**Mais detalhes:** Veja `RODAR_LOCALMENTE.md`

