# 🔧 Guia Completo de Configuração - EduMágico

Este guia vai te ajudar a configurar o projeto do zero, tanto para desenvolvimento local quanto para produção online.

---

## 📋 Índice

1. [Configuração Local (Desenvolvimento)](#1-configuração-local-desenvolvimento)
2. [Configuração Online (Produção)](#2-configuração-online-produção)
3. [Obter Chave do Gemini](#3-obter-chave-do-gemini)
4. [Verificação e Testes](#4-verificação-e-testes)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Configuração Local (Desenvolvimento)

### Passo 1: Configurar Banco de Dados

#### Opção A: PostgreSQL Local

1. **Instalar PostgreSQL** (se ainda não tiver):
   - **macOS**: `brew install postgresql@14`
   - **Windows**: Baixar de https://www.postgresql.org/download/
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

2. **Criar banco de dados**:
   ```bash
   # Conectar ao PostgreSQL
   psql -U postgres
   
   # Criar banco de dados
   CREATE DATABASE edumagico;
   
   # Sair
   \q
   ```

#### Opção B: Docker (Mais Fácil)

1. **Criar arquivo `docker-compose.yml`** (já existe no projeto):
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:14
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: edumagico
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Iniciar PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

### Passo 2: Configurar Backend

1. **Navegar para a pasta do servidor**:
   ```bash
   cd server
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Criar arquivo `.env`** na pasta `server/`:
   ```bash
   cd server
   touch .env
   ```

4. **Editar o arquivo `.env`** e adicionar:
   ```env
   # Configuração do Ambiente
   NODE_ENV=development
   
   # Configuração do Servidor
   PORT=3001
   
   # Configuração do Banco de Dados PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=edumagico
   
   # Configuração de Autenticação JWT
   JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao
   JWT_EXPIRES_IN=7d
   
   # Configuração de CORS (para desenvolvimento, deixe vazio)
   CORS_ORIGIN=
   
   # Configuração do Gemini API
   # Obtenha sua chave em: https://makersuite.google.com/app/apikey
   GEMINI_API_KEY=sua-chave-gemini-aqui
   ```

5. **Obter chave do Gemini** (veja seção 3 abaixo)

6. **Substituir `GEMINI_API_KEY`** no arquivo `.env` pela sua chave real

### Passo 3: Configurar Frontend

1. **Voltar para a raiz do projeto**:
   ```bash
   cd ..
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Criar arquivo `.env.local`** na raiz do projeto:
   ```bash
   touch .env.local
   ```

4. **Editar o arquivo `.env.local`** e adicionar:
   ```env
   # URL da API do Backend
   # Para desenvolvimento local, use:
   VITE_API_URL=http://localhost:3001/api
   ```

**⚠️ IMPORTANTE**: O frontend **NÃO precisa** mais da `GEMINI_API_KEY`! Apenas a `VITE_API_URL`.

### Passo 4: Iniciar o Projeto

#### Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Aguarde ver a mensagem:
```
✅ Database connected successfully
🚀 Server running on port 3001
```

#### Terminal 2 - Frontend:
```bash
# Na raiz do projeto
npm run dev
```

Aguarde ver a mensagem:
```
VITE v6.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

### Passo 5: Popular Rotas no Banco de Dados

Após o backend iniciar, em um novo terminal:

```bash
cd server
npm run populate:routes
```

Você deve ver:
```
✅ Rotas populadas com sucesso
```

---

## 2. Configuração Online (Produção)

### Backend - Railway ou Render

#### Passo 1: Criar Projeto no Railway/Render

Siga o guia em `GUIA_DEPLOY_COMPLETO.md` para criar o projeto.

#### Passo 2: Configurar Variáveis de Ambiente

**No Railway ou Render**, adicione estas variáveis:

```env
NODE_ENV=production
PORT=3001

# Banco de Dados (Railway/Render cria automaticamente)
# Railway: Use ${{Postgres.PGHOST}}, etc.
# Render: Use DATABASE_URL (criado automaticamente)

# JWT Secret (gere uma chave forte)
JWT_SECRET=seu-jwt-secret-super-seguro-gerado-aleatoriamente

# CORS Origin (será preenchido após deploy do frontend)
CORS_ORIGIN=

# Gemini API Key
GEMINI_API_KEY=sua-chave-gemini-aqui
```

**Como gerar JWT_SECRET forte:**
```bash
# No terminal:
openssl rand -base64 32
```

#### Passo 3: Popular Rotas

Após o deploy, execute via Shell do Railway/Render:
```bash
cd server
npm run populate:routes:prod
```

### Frontend - Vercel

#### Passo 1: Criar Projeto no Vercel

Siga o guia em `GUIA_DEPLOY_COMPLETO.md`.

#### Passo 2: Configurar Variável de Ambiente

**No Vercel**, adicione:

```env
VITE_API_URL=https://sua-url-backend.railway.app/api
```

**OU se estiver usando Render:**
```env
VITE_API_URL=https://sua-url-backend.onrender.com/api
```

**⚠️ IMPORTANTE**: 
- Substitua `sua-url-backend` pela URL real do seu backend
- A URL **DEVE** terminar com `/api`
- **NÃO** adicione espaços ou caracteres extras

#### Passo 3: Atualizar CORS no Backend

Após obter a URL do Vercel, atualize `CORS_ORIGIN` no backend:

```env
CORS_ORIGIN=https://seu-app.vercel.app
```

---

## 3. Obter Chave do Gemini

### Passo 1: Acessar Google AI Studio

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google

### Passo 2: Criar Chave de API

1. Clique em **"Create API Key"** ou **"Criar chave de API"**
2. Selecione um projeto Google Cloud (ou crie um novo)
3. A chave será gerada automaticamente

### Passo 3: Copiar a Chave

1. A chave aparecerá no formato: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
2. **Copie a chave completa** (você não poderá vê-la novamente depois)
3. **⚠️ IMPORTANTE**: Mantenha a chave segura e não compartilhe

### Passo 4: Configurar no Backend

**Local (Desenvolvimento):**
- Adicione no arquivo `server/.env`:
  ```env
  GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

**Online (Produção):**
- Adicione nas variáveis de ambiente do Railway/Render:
  ```env
  GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

### Passo 5: Reiniciar o Servidor

Após configurar a chave, **reinicie o backend**:
- **Local**: Pare (Ctrl+C) e inicie novamente (`npm run dev`)
- **Online**: O Railway/Render fará redeploy automaticamente

---

## 4. Verificação e Testes

### Verificar Backend

1. **Health Check**:
   ```bash
   curl http://localhost:3001/health
   ```
   
   Deve retornar:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "database": "connected"
   }
   ```

2. **Verificar se rotas foram populadas**:
   - Acesse o banco de dados
   - Verifique se a tabela `rotas` tem registros

### Verificar Frontend

1. **Acesse**: http://localhost:3000
2. **Faça registro** de um novo usuário
3. **Faça login**
4. **Tente criar conteúdo** com IA

### Verificar Integração Gemini

1. **No frontend**, vá em "Criar Conteúdo"
2. **Preencha**:
   - Tema: "Fotossíntese"
   - Idade: 8
   - Tipo: História
3. **Clique em "Criar Conteúdo"**
4. **Deve gerar** sem erros

---

## 5. Troubleshooting

### ❌ Erro: "Cannot connect to database"

**Solução:**
- Verifique se o PostgreSQL está rodando
- Verifique as credenciais no `.env`
- Teste conexão: `psql -U postgres -d edumagico`

### ❌ Erro: "GEMINI_API_KEY não está configurada"

**Solução:**
- Verifique se a chave está no arquivo `server/.env`
- Verifique se não há espaços extras
- Reinicie o backend após adicionar

### ❌ Erro: "Você precisa estar autenticado"

**Solução:**
- Faça login na aplicação
- Verifique se o token está sendo salvo no localStorage
- Verifique se `VITE_API_URL` está configurado corretamente

### ❌ Erro: "CORS policy"

**Solução:**
- Verifique se `CORS_ORIGIN` está configurado no backend
- Certifique-se de que a URL do frontend está na lista
- Reinicie o backend após atualizar

### ❌ Frontend não conecta ao backend

**Solução:**
- Verifique se `VITE_API_URL` está correto
- Verifique se o backend está rodando
- Teste o endpoint `/health` do backend
- Verifique o console do navegador para erros

### ❌ Erro ao gerar conteúdo

**Solução:**
- Verifique se a chave do Gemini está válida
- Verifique se o usuário tem plano Premium ou é Professor
- Verifique os logs do backend para mais detalhes

---

## 📝 Checklist de Configuração

### Desenvolvimento Local
- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `edumagico` criado
- [ ] Arquivo `server/.env` criado e configurado
- [ ] Chave do Gemini configurada no `server/.env`
- [ ] Arquivo `.env.local` criado na raiz
- [ ] `VITE_API_URL` configurado no `.env.local`
- [ ] Dependências instaladas (backend e frontend)
- [ ] Rotas populadas no banco de dados
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Teste de geração de conteúdo funcionando

### Produção Online
- [ ] Backend deployado no Railway/Render
- [ ] Banco de dados PostgreSQL criado
- [ ] Variáveis de ambiente configuradas no backend
- [ ] Chave do Gemini configurada no backend
- [ ] Rotas populadas no banco de dados
- [ ] Frontend deployado no Vercel
- [ ] `VITE_API_URL` configurado no Vercel
- [ ] `CORS_ORIGIN` atualizado no backend
- [ ] Health check do backend funcionando
- [ ] Teste de geração de conteúdo funcionando

---

## 🎯 Resumo Rápido

### Para Desenvolvimento Local:

1. **Backend** (`server/.env`):
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=edumagico
   JWT_SECRET=sua-chave-jwt
   GEMINI_API_KEY=sua-chave-gemini
   ```

2. **Frontend** (`.env.local` na raiz):
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

### Para Produção Online:

1. **Backend** (Railway/Render):
   - Configure todas as variáveis de ambiente
   - Especialmente: `GEMINI_API_KEY` e `JWT_SECRET`

2. **Frontend** (Vercel):
   - Configure apenas: `VITE_API_URL=https://seu-backend.railway.app/api`

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique os logs do backend e frontend
2. Consulte a seção de Troubleshooting acima
3. Verifique se todas as variáveis estão configuradas
4. Teste os endpoints individualmente

---

**Boa sorte com a configuração! 🚀**

