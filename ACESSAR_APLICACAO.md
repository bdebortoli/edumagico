# 🌐 Como Acessar a Aplicação EduMágico

## ✅ Backend (Render) - JÁ ESTÁ FUNCIONANDO!

### 1. URL do Backend

1. No Render, abra o serviço **`edumagico-api`**
2. Procure por **"Live URL"** ou **"URL"** no topo da página
3. A URL será algo como: `https://edumagico-api.onrender.com`

### 2. Testar o Backend

Abra no navegador ou use curl:
```
https://sua-url.onrender.com/health
```

**Deve retornar:**
```json
{"status":"ok","timestamp":"2025-11-22T..."}
```

---

## 🎨 Frontend (Vercel) - PRÓXIMO PASSO

O frontend ainda precisa ser deployado no Vercel. Siga estes passos:

### Passo 1: Criar Conta no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub (mesma do repositório)

### Passo 2: Importar Projeto

1. Clique em **"Add New..."** → **"Project"**
2. Importe o repositório **`bdebortoli/edumagico`**
3. Configure:
   - **Framework Preset**: Vite (deve detectar automaticamente)
   - **Root Directory**: `.` (raiz do projeto)
   - **Build Command**: `npm run build` (já configurado)
   - **Output Directory**: `dist` (já configurado)

### Passo 3: Configurar Variável de Ambiente

**IMPORTANTE**: Antes de fazer deploy, adicione a variável:

1. No Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Clique em **"+ Add"**
3. Preencha:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://sua-url-backend.onrender.com/api`
     - (Substitua `sua-url-backend` pela URL real do Render)
   - **Environment**: Marque todas (Production, Preview, Development)
4. Clique em **"Save"**

### Passo 4: Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde alguns minutos
3. Anote a URL gerada (ex: `https://edumagico.vercel.app`)

---

## 🔗 Vincular Frontend e Backend

### Atualizar CORS no Backend

Após o deploy do frontend, você precisa atualizar o CORS no Render:

1. No Render, abra o serviço **`edumagico-api`**
2. Vá em **"Environment"**
3. Encontre a variável **`CORS_ORIGIN`**
4. Atualize o valor para a URL do Vercel:
   - Exemplo: `https://edumagico.vercel.app`
   - Se tiver múltiplas URLs, separe por vírgula
5. Salve (o Render fará redeploy automático)

---

## 📋 Checklist Completo

### Backend (Render) ✅
- [x] Serviço criado
- [x] Banco de dados vinculado
- [x] Deploy funcionando
- [ ] Popular rotas no banco (próximo passo)

### Frontend (Vercel) ⏳
- [ ] Conta criada
- [ ] Projeto importado
- [ ] Variável `VITE_API_URL` configurada
- [ ] Deploy feito
- [ ] CORS atualizado no backend

---

## 🗄️ Popular Rotas no Banco (Importante!)

Após o backend estar funcionando, você precisa popular as rotas:

### Opção 1: Via Render Shell (Recomendado)

1. No Render, abra o serviço **`edumagico-api`**
2. Vá em **"Shell"** (aba no topo)
3. Execute:
   ```bash
   cd server
   npx ts-node src/scripts/populateRoutes.ts
   ```

### Opção 2: Via Terminal Local

Se você tiver acesso ao banco via psql localmente, execute os scripts SQL em `server/src/migrations/`

---

## 🎯 URLs Finais

Após tudo configurado, você terá:

- **Frontend**: `https://edumagico.vercel.app`
- **Backend API**: `https://edumagico-api.onrender.com`
- **Health Check**: `https://edumagico-api.onrender.com/health`

---

## 🧪 Testar a Aplicação

1. Acesse a URL do frontend no navegador
2. Tente fazer login/registro
3. Verifique se as requisições à API estão funcionando
4. Teste as funcionalidades principais

---

## 🆘 Problemas Comuns

### Frontend não consegue conectar ao backend
- Verifique se `VITE_API_URL` está configurada corretamente
- Verifique se o CORS está configurado no backend
- Verifique se a URL termina com `/api`

### Erro de CORS
- Atualize `CORS_ORIGIN` no Render com a URL do Vercel
- Aguarde o redeploy do backend

### Rotas não funcionam
- Execute o script de popular rotas (veja acima)

---

**Boa sorte! 🚀**

