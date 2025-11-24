# 🚀 Guia Completo de Deploy - EduMágico Online

Este guia passo a passo vai te ajudar a colocar o projeto EduMágico funcionando online.

---

## 📋 Pré-requisitos

1. ✅ Conta no GitHub (com o código commitado)
2. ✅ Conta no [Railway](https://railway.app) ou [Render](https://render.com) (para backend)
3. ✅ Conta no [Vercel](https://vercel.com) (para frontend)
4. ✅ Chave da API do Gemini (opcional, mas recomendado)

---

## 🎯 Visão Geral do Deploy

O projeto será dividido em:
- **Backend**: API Node.js + PostgreSQL (Railway ou Render)
- **Frontend**: React + Vite (Vercel)

---

## 📦 PARTE 1: Deploy do Backend

### Opção A: Railway (Recomendado - Mais Simples)

#### Passo 1: Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório do EduMágico

#### Passo 2: Adicionar Banco de Dados PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Railway criará automaticamente um banco PostgreSQL
4. Anote o nome do serviço (ex: `Postgres`)

#### Passo 3: Configurar o Serviço Web (Backend)

1. No projeto Railway, clique em **"+ New"** → **"GitHub Repo"**
2. Selecione o mesmo repositório
3. Railway detectará automaticamente que é Node.js
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### Passo 4: Configurar Variáveis de Ambiente

No serviço web do Railway, vá em **"Variables"** e adicione:

```env
NODE_ENV=production
PORT=3001

# Banco de Dados (Railway cria automaticamente - use as referências)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}

# JWT Secret (gere uma chave segura)
JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao

# CORS Origin (será preenchido após deploy do frontend)
CORS_ORIGIN=

# Gemini API Key (obtenha em https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=sua-chave-gemini-aqui
```

**Importante:**
- Substitua `Postgres` pelo nome do seu serviço de banco de dados
- Gere um `JWT_SECRET` forte (ex: `openssl rand -base64 32`)
- O `CORS_ORIGIN` será configurado depois do deploy do frontend
- A `GEMINI_API_KEY` é opcional, mas necessária para gerar conteúdo com IA

#### Passo 5: Deploy

1. Railway fará o deploy automaticamente
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://edumagico-api.up.railway.app`)

#### Passo 6: Popular Rotas no Banco de Dados

Após o deploy, você precisa popular as rotas:

1. No Railway, vá em **"Deployments"** → clique no deployment mais recente
2. Clique em **"View Logs"**
3. Abra o **"Shell"** ou **"Console"**
4. Execute:
   ```bash
   cd server
   npm run populate:routes:prod
   ```

**OU** use o endpoint temporário (se disponível):
```bash
curl -X POST https://sua-url-backend.railway.app/api/setup/populate-routes
```

---

### Opção B: Render (Alternativa)

#### Passo 1: Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Faça login com GitHub
3. Clique em **"New +"** → **"Blueprint"**
4. Conecte o repositório do EduMágico

#### Passo 2: Configurar via render.yaml

O arquivo `render.yaml` já está configurado. O Render detectará automaticamente.

#### Passo 3: Configurar Variáveis de Ambiente

No serviço web do Render, vá em **"Environment"** e adicione:

```env
NODE_ENV=production
PORT=3001

# Banco de Dados (Render cria automaticamente via DATABASE_URL)
# Não precisa configurar manualmente - Render faz isso automaticamente

# JWT Secret
JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao

# CORS Origin (será preenchido após deploy do frontend)
CORS_ORIGIN=

# Gemini API Key
GEMINI_API_KEY=sua-chave-gemini-aqui
```

**Importante:**
- Render cria automaticamente a variável `DATABASE_URL` quando você adiciona um banco PostgreSQL
- O backend já está configurado para usar `DATABASE_URL` automaticamente

#### Passo 4: Deploy

1. Render fará o deploy automaticamente baseado no `render.yaml`
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://edumagico-api.onrender.com`)

#### Passo 5: Popular Rotas

Execute o mesmo processo do Railway (via Shell ou endpoint).

---

## 🎨 PARTE 2: Deploy do Frontend (Vercel)

### Passo 1: Criar Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Importe o repositório do EduMágico

### Passo 2: Configurar o Projeto

1. **Framework Preset**: Vite (detectado automaticamente)
2. **Root Directory**: `.` (raiz do projeto)
3. **Build Command**: `npm run build` (já configurado)
4. **Output Directory**: `dist` (já configurado)

### Passo 3: Configurar Variáveis de Ambiente

No Vercel, vá em **"Settings"** → **"Environment Variables"** e adicione:

```env
VITE_API_URL=https://sua-url-backend.railway.app/api
```

**OU se estiver usando Render:**

```env
VITE_API_URL=https://sua-url-backend.onrender.com/api
```

**⚠️ IMPORTANTE:**
- Substitua `sua-url-backend` pela URL real do seu backend
- A URL **DEVE** terminar com `/api` (ex: `https://edumagico-api.up.railway.app/api`)
- **NÃO** adicione espaços ou caracteres extras

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://edumagico.vercel.app`)

---

## 🔗 PARTE 3: Conectar Frontend e Backend

### Passo 1: Atualizar CORS no Backend

Agora que você tem a URL do frontend, atualize a variável `CORS_ORIGIN` no backend:

**No Railway:**
1. Vá em **"Variables"** do serviço web
2. Atualize `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://edumagico.vercel.app
   ```

**No Render:**
1. Vá em **"Environment"** do serviço web
2. Atualize `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://edumagico.vercel.app
   ```

**Se você tiver múltiplas URLs** (ex: preview deployments do Vercel), separe por vírgula:
```env
CORS_ORIGIN=https://edumagico.vercel.app,https://edumagico-git-main.vercel.app
```

### Passo 2: Reiniciar o Backend

Após atualizar `CORS_ORIGIN`, o Railway/Render fará um redeploy automaticamente. Aguarde alguns minutos.

---

## ✅ PARTE 4: Verificação e Testes

### 1. Testar Backend

```bash
# Health check
curl https://sua-url-backend.railway.app/health

# Deve retornar:
# {"status":"ok","timestamp":"...","database":"connected"}
```

### 2. Testar Frontend

1. Acesse a URL do Vercel
2. Tente fazer **registro** de um novo usuário
3. Tente fazer **login**
4. Verifique se as requisições à API estão funcionando

### 3. Verificar Banco de Dados

- No Railway/Render, verifique se as tabelas foram criadas
- Verifique se as rotas foram populadas (tabela `rotas` deve ter registros)

---

## 🔧 Troubleshooting

### ❌ Erro: "Cannot connect to database"

**Solução:**
- Verifique se as variáveis de ambiente do banco estão corretas
- No Railway, use as variáveis automáticas `${{Postgres.*}}`
- No Render, verifique se `DATABASE_URL` está configurada automaticamente
- Aguarde alguns minutos após criar o banco (pode levar tempo para inicializar)

### ❌ Erro: "CORS policy"

**Solução:**
- Verifique se `CORS_ORIGIN` está configurado corretamente no backend
- Certifique-se de que a URL do frontend está na lista de origens permitidas
- Verifique se não há espaços ou caracteres extras na URL
- Reinicie o backend após atualizar `CORS_ORIGIN`

### ❌ Erro: "Routes not found" ou "Permission denied"

**Solução:**
- Execute o script de popular rotas (veja Passo 6 do deploy do backend)
- Verifique se o banco de dados foi inicializado corretamente
- Verifique os logs do backend para erros

### ❌ Frontend não consegue conectar ao backend

**Solução:**
- Verifique se `VITE_API_URL` está configurado corretamente no Vercel
- Certifique-se de que a URL termina com `/api`
- Verifique se o backend está rodando (teste o endpoint `/health`)
- Verifique se `CORS_ORIGIN` inclui a URL do frontend

### ❌ Erro: "GEMINI_API_KEY não está configurada"

**Solução:**
- Adicione a variável `GEMINI_API_KEY` no backend
- Obtenha a chave em: https://makersuite.google.com/app/apikey
- Reinicie o backend após adicionar a variável

### ❌ Build falha no Vercel

**Solução:**
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o `vercel.json` está configurado corretamente
- Verifique os logs de build no Vercel para mais detalhes

### ❌ Build falha no Railway/Render

**Solução:**
- Verifique se o `Root Directory` está configurado como `server`
- Verifique se os comandos de build estão corretos
- Verifique os logs de build para erros específicos
- Certifique-se de que todas as dependências estão no `package.json`

---

## 📝 Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Código commitado e pushado para GitHub
- [ ] Backend deployado no Railway/Render
- [ ] Banco de dados PostgreSQL criado e configurado
- [ ] Variáveis de ambiente do backend configuradas
- [ ] Rotas populadas no banco de dados
- [ ] Frontend deployado no Vercel
- [ ] Variável `VITE_API_URL` configurada no Vercel
- [ ] Variável `CORS_ORIGIN` atualizada no backend
- [ ] Health check do backend funcionando
- [ ] Frontend conseguindo fazer requisições ao backend
- [ ] Login/Registro funcionando
- [ ] Geração de conteúdo com IA funcionando (se configurado)
- [ ] Testes básicos realizados

---

## 🎯 URLs Finais

Após o deploy completo, você terá:

- **Frontend**: `https://seu-app.vercel.app`
- **Backend API**: `https://seu-backend.railway.app` ou `https://seu-backend.onrender.com`
- **Health Check**: `https://seu-backend.railway.app/health`

Compartilhe a URL do frontend com os testadores externos.

---

## 🔐 Segurança em Produção

⚠️ **Importante**: Este é um deploy temporário para testes. Para produção real:

1. **JWT_SECRET**: Use uma chave forte e única (gere com `openssl rand -base64 32`)
2. **Senhas do Banco**: Use senhas fortes fornecidas pelo serviço
3. **CORS**: Limite apenas aos domínios necessários
4. **HTTPS**: Todos os serviços já usam HTTPS por padrão
5. **Variáveis Sensíveis**: Nunca commite `.env` no Git
6. **GEMINI_API_KEY**: Mantenha segura e não compartilhe

---

## 📚 Recursos Adicionais

- [Documentação Railway](https://docs.railway.app)
- [Documentação Render](https://render.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
- [Google Gemini API](https://ai.google.dev)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Railway/Render/Vercel
2. Teste os endpoints individualmente
3. Verifique as variáveis de ambiente
4. Consulte a seção de Troubleshooting acima
5. Verifique se todas as dependências estão instaladas

---

**Boa sorte com o deploy! 🚀**

