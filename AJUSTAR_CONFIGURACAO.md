# 🔧 Ajustar Configuração - Passo a Passo

## 📋 Situação Atual

Verifiquei sua configuração e encontrei:

✅ **Backend** (`server/.env`):
- GEMINI_API_KEY está com valor placeholder: `your-gemini-api-key-here`
- Precisa ser atualizada com a chave real

✅ **Frontend** (`.env.local`):
- Tem a chave do Gemini (não é mais necessária no frontend)
- Tem VITE_API_URL configurado para produção

---

## 🔧 Correções Necessárias

### 1. Atualizar Chave do Gemini no Backend

A chave do Gemini que está no `.env.local` precisa ser movida para `server/.env`.

**Passo a passo:**

1. **Copie a chave do Gemini** do arquivo `.env.local`:
   ```
   GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
   ```

2. **Edite o arquivo `server/.env`**:
   ```bash
   cd server
   nano .env
   # ou use seu editor preferido
   ```

3. **Localize a linha**:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

4. **Substitua por**:
   ```env
   GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
   ```

5. **Salve o arquivo**

### 2. Limpar Frontend (Remover Chave do Gemini)

A chave do Gemini **não é mais necessária** no frontend.

**Edite o arquivo `.env.local`** na raiz do projeto:

**ANTES:**
```env
GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
VITE_API_URL=https://edumagico-api.onrender.com/api
```

**DEPOIS:**
```env
# Apenas a URL da API (chave do Gemini não é mais necessária no frontend)
VITE_API_URL=https://edumagico-api.onrender.com/api
```

**OU para desenvolvimento local:**
```env
# Para desenvolvimento local, use:
VITE_API_URL=http://localhost:3001/api

# Para produção, use:
# VITE_API_URL=https://edumagico-api.onrender.com/api
```

---

## ✅ Verificação

Após fazer as alterações, verifique:

### 1. Backend tem a chave:
```bash
cd server
grep "GEMINI_API_KEY" .env
```

Deve mostrar:
```
GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
```

### 2. Frontend NÃO tem a chave:
```bash
cd ..
grep "GEMINI_API_KEY" .env.local
```

**NÃO deve encontrar nada** (ou a linha deve estar comentada/removida)

### 3. Frontend tem apenas VITE_API_URL:
```bash
cat .env.local
```

Deve mostrar apenas:
```
VITE_API_URL=https://edumagico-api.onrender.com/api
```

---

## 🚀 Próximos Passos

### Se estiver rodando localmente:

1. **Reinicie o backend**:
   ```bash
   cd server
   # Pare o servidor (Ctrl+C) e inicie novamente:
   npm run dev
   ```

2. **Reinicie o frontend**:
   ```bash
   # Na raiz do projeto
   # Pare o servidor (Ctrl+C) e inicie novamente:
   npm run dev
   ```

3. **Teste a geração de conteúdo**:
   - Acesse http://localhost:3000
   - Faça login
   - Vá em "Criar Conteúdo"
   - Tente gerar um conteúdo

### Se estiver em produção:

1. **Atualize as variáveis de ambiente no Render/Railway**:
   - Adicione `GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw`
   - O serviço fará redeploy automaticamente

2. **No Vercel, remova `GEMINI_API_KEY`** (se existir):
   - Mantenha apenas `VITE_API_URL`

---

## 📝 Resumo

✅ **Backend** (`server/.env`):
- ✅ Precisa de `GEMINI_API_KEY` (com a chave real)
- ✅ Precisa de todas as outras variáveis (DB, JWT, etc.)

✅ **Frontend** (`.env.local`):
- ✅ Precisa APENAS de `VITE_API_URL`
- ❌ NÃO precisa mais de `GEMINI_API_KEY`

---

## 🆘 Se ainda der erro

1. **Verifique os logs do backend** para ver se a chave está sendo carregada
2. **Verifique o console do navegador** para erros
3. **Teste o endpoint** `/health` do backend
4. **Verifique se o backend está rodando** na porta 3001

---

**Após fazer essas alterações, o erro deve desaparecer! 🎉**

