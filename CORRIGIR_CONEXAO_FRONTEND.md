# 🔧 Como Corrigir a Conexão do Frontend com o Backend

## ❌ Problema

O frontend está tentando conectar ao `localhost:3001`, mas o backend está no Render. Precisamos configurar a URL correta.

---

## ✅ Solução: Configurar VITE_API_URL

### Opção 1: Arquivo .env.local (Para Desenvolvimento Local)

1. Na raiz do projeto, crie um arquivo chamado `.env.local`
2. Adicione a linha (substitua pela URL real do seu backend no Render):

```env
VITE_API_URL=https://edumagico-api.onrender.com/api
```

3. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   npm run dev
   ```

### Opção 2: Variável de Ambiente no Terminal (Temporário)

Antes de rodar `npm run dev`, execute:

**macOS/Linux:**
```bash
export VITE_API_URL=https://edumagico-api.onrender.com/api
npm run dev
```

**Windows (PowerShell):**
```powershell
$env:VITE_API_URL="https://edumagico-api.onrender.com/api"
npm run dev
```

---

## 🎯 Para Deploy no Vercel (Produção)

Quando fizer deploy no Vercel, você precisa adicionar a variável lá:

1. No Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Clique em **"+ Add"**
3. Preencha:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://sua-url-backend.onrender.com/api`
   - **Environment**: Marque todas (Production, Preview, Development)
4. Clique em **"Save"**
5. Faça um novo deploy

---

## 📋 Passo a Passo Rápido

### Para Testar Localmente Agora:

1. **Descubra a URL do backend no Render:**
   - No Render, abra o serviço `edumagico-api`
   - Copie a "Live URL" (ex: `https://edumagico-api.onrender.com`)

2. **Crie o arquivo `.env.local` na raiz do projeto:**
   ```bash
   # Na raiz do projeto (edumágico/)
   echo 'VITE_API_URL=https://edumagico-api.onrender.com/api' > .env.local
   ```
   
   Ou crie manualmente o arquivo `.env.local` com:
   ```
   VITE_API_URL=https://sua-url-backend.onrender.com/api
   ```

3. **Reinicie o servidor:**
   ```bash
   # Pare o servidor atual (Ctrl+C)
   npm run dev
   ```

4. **Teste novamente:**
   - Recarregue a página de login
   - O erro deve desaparecer

---

## ✅ Verificação

Após configurar, o frontend deve conseguir:
- ✅ Conectar ao backend no Render
- ✅ Fazer requisições de login/registro
- ✅ Acessar todas as APIs

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique se a URL está correta:**
   - Teste no navegador: `https://sua-url.onrender.com/health`
   - Deve retornar: `{"status":"ok",...}`

2. **Verifique o CORS:**
   - No Render, confirme que `CORS_ORIGIN` está configurado
   - Ou deixe vazio temporariamente para testar

3. **Verifique o console do navegador:**
   - Pressione F12
   - Vá em "Console" e "Network"
   - Veja se há erros de CORS ou conexão

---

**Substitua `sua-url-backend` pela URL real do seu backend no Render!**

