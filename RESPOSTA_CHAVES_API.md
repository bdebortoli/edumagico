# 🔑 Resposta: Chaves de API para Local e Produção

## ❓ Pergunta: "Devo colocar uma API key do Google AI Studio para prod e outra para local?"

## ✅ Resposta: **NÃO é necessário!**

Você pode usar **a mesma chave** em ambos os ambientes. O importante é **onde** configurar:

---

## 📍 Onde Configurar a Chave

### 🏠 Desenvolvimento Local

**Arquivo:** `server/.env`

```env
GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
```

**⚠️ IMPORTANTE**: A chave vai **APENAS** no backend (`server/.env`), **NÃO** no frontend!

### 🌐 Produção Online

**Backend (Railway/Render):**
- Variável de ambiente: `GEMINI_API_KEY`
- Valor: `AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw` (mesma chave)

**Frontend (Vercel):**
- **NÃO precisa** da chave do Gemini
- Precisa apenas de: `VITE_API_URL=https://seu-backend.railway.app/api`

---

## 🔄 Por Que a Mesma Chave Funciona?

A chave do Gemini é uma **chave de API do Google**, não uma chave específica de ambiente. Ela funciona em qualquer lugar onde você a configurar.

**A diferença está em:**
- ✅ **Onde** você coloca a chave (backend vs frontend)
- ✅ **Como** você a configura (arquivo .env vs variáveis de ambiente)

**NÃO está em:**
- ❌ Ter chaves diferentes para local/produção
- ❌ Criar múltiplas chaves

---

## 🎯 Configuração Correta

### Desenvolvimento Local

**Backend** (`server/.env`):
```env
GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
```

**Frontend** (`.env.local` na raiz):
```env
VITE_API_URL=http://localhost:3001/api
# NÃO precisa de GEMINI_API_KEY aqui!
```

### Produção Online

**Backend** (Railway/Render - Variáveis de Ambiente):
```env
GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
```

**Frontend** (Vercel - Variáveis de Ambiente):
```env
VITE_API_URL=https://edumagico-api.onrender.com/api
# NÃO precisa de GEMINI_API_KEY aqui!
```

---

## 🔍 Por Que o Erro Continua?

O erro pode continuar por alguns motivos:

### 1. Frontend ainda tentando usar a chave

**Problema:** O `vite.config.ts` ainda estava configurado para usar a chave no frontend.

**Solução:** Já corrigi o `vite.config.ts` para remover a referência à chave.

### 2. Backend não está rodando

**Problema:** O frontend tenta chamar o backend, mas o backend não está respondendo.

**Solução:**
```bash
cd server
npm run dev
```

### 3. Chave não está no backend

**Problema:** A chave não está configurada no `server/.env`.

**Solução:** Verifique se o arquivo `server/.env` tem:
```env
GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
```

### 4. Backend não carregou a chave

**Problema:** O backend foi iniciado antes de configurar a chave.

**Solução:** Reinicie o backend após configurar:
```bash
cd server
# Pare o servidor (Ctrl+C)
npm run dev
```

### 5. Frontend usando URL errada

**Problema:** O `VITE_API_URL` está apontando para produção, mas você está testando localmente.

**Solução:** Para desenvolvimento local, use:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## ✅ Checklist de Verificação

### Desenvolvimento Local

- [ ] Backend rodando na porta 3001
- [ ] `server/.env` tem `GEMINI_API_KEY` configurada
- [ ] `.env.local` tem `VITE_API_URL=http://localhost:3001/api`
- [ ] `.env.local` **NÃO** tem `GEMINI_API_KEY`
- [ ] Backend foi reiniciado após configurar a chave
- [ ] Frontend foi reiniciado após ajustar `.env.local`

### Produção Online

- [ ] Backend deployado e rodando
- [ ] Variável `GEMINI_API_KEY` configurada no Railway/Render
- [ ] Variável `VITE_API_URL` configurada no Vercel
- [ ] Variável `GEMINI_API_KEY` **NÃO** está no Vercel
- [ ] `CORS_ORIGIN` configurado no backend com URL do Vercel

---

## 🚀 Próximos Passos

1. **Verifique o `vite.config.ts`** - Já corrigi para remover a referência à chave
2. **Reinicie o frontend**:
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```
3. **Verifique se o backend está rodando**:
   ```bash
   curl http://localhost:3001/health
   ```
4. **Teste novamente** a geração de conteúdo

---

## 📝 Resumo

✅ **Use a mesma chave** em local e produção
✅ **Configure apenas no backend** (`server/.env` ou variáveis de ambiente)
✅ **NÃO configure no frontend** (removido do `vite.config.ts`)
✅ **Frontend só precisa** de `VITE_API_URL`

---

**Agora o erro deve desaparecer! 🎉**

