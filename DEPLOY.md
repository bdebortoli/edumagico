# 🚀 Guia de Deploy - Plataforma EduMágico

Este guia explica como fazer deploy da plataforma EduMágico em serviços cloud gratuitos para permitir testes externos.

## 📋 Visão Geral

A plataforma consiste em:
- **Frontend**: React + Vite (deploy no Vercel)
- **Backend**: Node.js + Express + TypeORM (deploy no Railway ou Render)
- **Banco de Dados**: PostgreSQL (incluído no Railway/Render)

## 🎯 Opções de Deploy

### Opção 1: Railway (Recomendado - Mais Simples)
- Backend + PostgreSQL em um único serviço
- Interface web intuitiva
- Deploy automático via GitHub

### Opção 2: Render
- Backend + PostgreSQL separados
- Configuração via arquivo `render.yaml`
- Deploy automático via GitHub

### Opção 3: Vercel (Frontend)
- Deploy rápido e simples
- Integração com GitHub
- CDN global

---

## 🚀 Deploy Completo - Passo a Passo

### Parte 1: Preparação

1. **Certifique-se de que o código está no GitHub**
   ```bash
   git add .
   git commit -m "Preparação para deploy"
   git push origin main
   ```

2. **Anote as URLs que serão geradas** (você precisará delas para configurar CORS)

---

## 📦 Deploy do Backend - Railway

### Passo 1: Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com sua conta GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório do EduMágico

### Passo 2: Configurar o Serviço

1. Railway detectará automaticamente o projeto Node.js
2. Configure o **Root Directory** como `server`
3. Configure o **Build Command**: `npm install && npm run build`
4. Configure o **Start Command**: `npm start`

### Passo 3: Adicionar Banco de Dados PostgreSQL

1. No projeto Railway, clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Railway criará automaticamente um banco PostgreSQL

### Passo 4: Configurar Variáveis de Ambiente

No Railway, vá em "Variables" e adicione:

```env
NODE_ENV=production
PORT=3001

# Banco de Dados (Railway fornece automaticamente)
# Use as variáveis que o Railway cria automaticamente:
# PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

# Ou configure manualmente:
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}

# JWT Secret (gere uma chave segura)
JWT_SECRET=seu-jwt-secret-super-seguro-aqui-mude-em-producao

# CORS Origin (será preenchido após deploy do frontend)
# Exemplo: https://seu-app.vercel.app
CORS_ORIGIN=

# Gemini API Key (opcional)
GEMINI_API_KEY=sua-chave-gemini-aqui
```

**Importante**: 
- Railway cria variáveis automáticas para o PostgreSQL. Use `${{Postgres.NOME_DA_VARIAVEL}}` para referenciá-las.
- O `CORS_ORIGIN` será configurado após o deploy do frontend.

### Passo 5: Deploy

1. Railway fará o deploy automaticamente
2. Aguarde o build e start completarem
3. Anote a URL gerada (ex: `https://edumagico-api.up.railway.app`)

### Passo 6: Popular Rotas no Banco de Dados

Após o deploy, você precisa popular as rotas. Você pode fazer isso de duas formas:

**Opção A: Via Railway Console (Recomendado)**

1. No Railway, vá em "Deployments" → clique no deployment mais recente
2. Clique em "View Logs"
3. Abra o "Shell" ou "Console"
4. Execute:
   ```bash
   cd server
   npx ts-node src/scripts/populateRoutes.ts
   ```

**Opção B: Via SSH Local**

1. Conecte-se ao banco via psql usando as credenciais do Railway
2. Execute os scripts SQL em `server/src/migrations/`

---

## 📦 Deploy do Backend - Render (Alternativa)

### Passo 1: Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Faça login com sua conta GitHub
3. Clique em "New +" → "Blueprint"
4. Conecte o repositório do EduMágico

### Passo 2: Configurar via render.yaml

O arquivo `render.yaml` já está configurado. O Render detectará automaticamente.

### Passo 3: Configurar Variáveis de Ambiente

No Render, vá em "Environment" e adicione as mesmas variáveis do Railway.

**Importante**: 
- Render também cria variáveis automáticas para o PostgreSQL
- Use as variáveis fornecidas pelo serviço de banco de dados

### Passo 4: Deploy

1. Render fará o deploy automaticamente baseado no `render.yaml`
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://edumagico-api.onrender.com`)

---

## 🎨 Deploy do Frontend - Vercel

### Passo 1: Criar Conta no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New..." → "Project"
4. Importe o repositório do EduMágico

### Passo 2: Configurar o Projeto

1. **Framework Preset**: Vite (detectado automaticamente)
2. **Root Directory**: `.` (raiz do projeto)
3. **Build Command**: `npm run build` (já configurado no `vercel.json`)
4. **Output Directory**: `dist` (já configurado no `vercel.json`)

### Passo 3: Configurar Variáveis de Ambiente

No Vercel, vá em "Settings" → "Environment Variables" e adicione:

```env
VITE_API_URL=https://sua-url-backend.railway.app/api
```

**Importante**: 
- Substitua `https://sua-url-backend.railway.app` pela URL real do seu backend
- A URL deve terminar com `/api` (ex: `https://edumagico-api.up.railway.app/api`)

### Passo 4: Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://edumagico.vercel.app`)

### Passo 5: Atualizar CORS no Backend

Agora que você tem a URL do frontend, atualize a variável `CORS_ORIGIN` no Railway/Render:

```env
CORS_ORIGIN=https://edumagico.vercel.app
```

**Importante**: Se você tiver múltiplas URLs (ex: preview deployments), separe por vírgula:
```env
CORS_ORIGIN=https://edumagico.vercel.app,https://edumagico-git-main.vercel.app
```

Após atualizar, o Railway/Render fará um redeploy automaticamente.

---

## ✅ Verificação Pós-Deploy

### 1. Testar Backend

```bash
# Health check
curl https://sua-url-backend.railway.app/health

# Deve retornar:
# {"status":"ok","timestamp":"..."}
```

### 2. Testar Frontend

1. Acesse a URL do Vercel
2. Tente fazer login/registro
3. Verifique se as requisições à API estão funcionando

### 3. Verificar Banco de Dados

- No Railway/Render, verifique se as tabelas foram criadas
- Verifique se as rotas foram populadas (tabela `rotas` deve ter registros)

---

## 🔧 Troubleshooting

### Erro: "Cannot connect to database"

**Solução**: 
- Verifique se as variáveis de ambiente do banco estão corretas
- No Railway, use as variáveis automáticas `${{Postgres.*}}`
- No Render, use as variáveis fornecidas pelo serviço de banco

### Erro: "CORS policy"

**Solução**:
- Verifique se `CORS_ORIGIN` está configurado corretamente
- Certifique-se de que a URL do frontend está na lista de origens permitidas
- Reinicie o backend após atualizar `CORS_ORIGIN`

### Erro: "Routes not found" ou "Permission denied"

**Solução**:
- Execute o script de popular rotas: `npx ts-node src/scripts/populateRoutes.ts`
- Verifique se o banco de dados foi inicializado corretamente

### Frontend não consegue conectar ao backend

**Solução**:
- Verifique se `VITE_API_URL` está configurado corretamente no Vercel
- Certifique-se de que a URL termina com `/api`
- Verifique se o backend está rodando (teste o endpoint `/health`)

### Build falha no Vercel

**Solução**:
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o `vercel.json` está configurado corretamente
- Verifique os logs de build no Vercel para mais detalhes

---

## 📝 Checklist de Deploy

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
- [ ] Testes básicos realizados

---

## 🔐 Segurança em Produção

⚠️ **Importante**: Este é um deploy temporário para testes. Para produção real:

1. **JWT_SECRET**: Use uma chave forte e única (gere com `openssl rand -base64 32`)
2. **Senhas do Banco**: Use senhas fortes fornecidas pelo serviço
3. **CORS**: Limite apenas aos domínios necessários
4. **HTTPS**: Todos os serviços já usam HTTPS por padrão
5. **Variáveis Sensíveis**: Nunca commite `.env` no Git

---

## 🎯 URLs de Acesso

Após o deploy completo, você terá:

- **Frontend**: `https://seu-app.vercel.app`
- **Backend API**: `https://seu-backend.railway.app` ou `https://seu-backend.onrender.com`
- **Health Check**: `https://seu-backend.railway.app/health`

Compartilhe a URL do frontend com os testadores externos.

---

## 📚 Recursos Adicionais

- [Documentação Railway](https://docs.railway.app)
- [Documentação Render](https://render.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
- [Guia de Variáveis de Ambiente](https://docs.railway.app/develop/variables)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Railway/Render/Vercel
2. Teste os endpoints individualmente
3. Verifique as variáveis de ambiente
4. Consulte a seção de Troubleshooting acima

---

**Boa sorte com o deploy! 🚀**

