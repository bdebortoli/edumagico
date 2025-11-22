# 🚀 Início Rápido - EduMágico

Guia para rodar a plataforma localmente.

## 📋 Pré-requisitos

1. **Node.js** 18+ (recomendado 20+)
2. **PostgreSQL** 12+ (ou Docker)
3. **NPM** ou **Yarn**

## 🔧 Configuração Rápida

### 1. Banco de Dados PostgreSQL

**Opção A: PostgreSQL Local**
```bash
# Criar banco de dados
createdb edumagico

# Ou via psql
psql -U postgres
CREATE DATABASE edumagico;
\q
```

**Opção B: Docker (Recomendado)**
```bash
docker run --name edumagico-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=edumagico \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Configurar Backend

```bash
cd server

# Editar .env com suas credenciais
# Especialmente: DB_PASSWORD e GEMINI_API_KEY

# Instalar dependências (se ainda não fez)
npm install

# Popular rotas e permissões
npx ts-node src/scripts/populateRoutes.ts
```

### 3. Configurar Frontend

```bash
# Na raiz do projeto
cd ..

# Instalar dependências (se ainda não fez)
npm install

# Criar arquivo .env na raiz (se necessário)
# GEMINI_API_KEY=sua-chave-aqui
```

## 🎯 Executar

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

O backend estará em: `http://localhost:3001`

### Terminal 2 - Frontend
```bash
# Na raiz do projeto
npm run dev
```

O frontend estará em: `http://localhost:3000`

## ✅ Verificar se está funcionando

1. **Backend**: Acesse `http://localhost:3001/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: Acesse `http://localhost:3000`
   - Deve carregar a landing page

## 🔑 Configuração do Gemini AI

Para usar a geração de conteúdo com IA, você precisa:

1. Obter uma chave API do Google Gemini
2. Adicionar no `.env` do backend:
   ```
   GEMINI_API_KEY=sua-chave-aqui
   ```

Sem a chave, a geração de conteúdo não funcionará, mas o resto da plataforma funcionará normalmente.

## 🐛 Problemas Comuns

### PostgreSQL não conecta
- Verifique se o PostgreSQL está rodando: `pg_isready`
- Verifique as credenciais no `.env`
- Teste a conexão: `psql -h localhost -U postgres -d edumagico`

### Porta já em uso
- Backend: Altere `PORT` no `.env` do servidor
- Frontend: Altere em `vite.config.ts`

### Erro de permissões
- Execute o script: `npx ts-node src/scripts/populateRoutes.ts`

### Dependências não instaladas
```bash
cd server && npm install
cd .. && npm install
```

## 📝 Notas

- O banco de dados é criado automaticamente pelo TypeORM em desenvolvimento
- As rotas são populadas pelo script `populateRoutes.ts`
- Em desenvolvimento, `synchronize: true` cria/atualiza tabelas automaticamente

