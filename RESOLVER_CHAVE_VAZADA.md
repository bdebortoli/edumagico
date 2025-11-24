# 🔐 Resolver Erro: API Key Leaked (Chave Vazada)

## 🔍 Problema Identificado

**Erro:** `Your API key was reported as leaked. Please use another API key.`

A chave da API do Gemini que você está usando foi reportada como **vazada** (exposta publicamente). Isso acontece quando:
- A chave foi commitada no Git
- A chave foi compartilhada publicamente
- A chave foi exposta em algum lugar

## ✅ Solução: Gerar Nova Chave

### Passo 1: Revogar a Chave Antiga

1. Acesse: https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Encontre a chave atual (`AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw`)
4. Clique em **"Delete"** ou **"Revogar"** para revogá-la

### Passo 2: Gerar Nova Chave

1. No mesmo site, clique em **"Create API Key"** ou **"Criar chave de API"**
2. Selecione um projeto Google Cloud (ou crie um novo)
3. A nova chave será gerada automaticamente
4. **Copie a chave completa** (você não poderá vê-la novamente depois)

### Passo 3: Atualizar no Backend

**Opção A: Editar manualmente**

1. Abra o arquivo `server/.env`:
   ```bash
   cd server
   nano .env
   # ou use seu editor preferido
   ```

2. Localize a linha:
   ```env
   GEMINI_API_KEY=AIzaSyAHw6BcyBT5KAHdprGNX0IrhLCeUez5GPw
   ```

3. Substitua pela nova chave:
   ```env
   GEMINI_API_KEY=sua-nova-chave-aqui
   ```

4. Salve o arquivo

**Opção B: Usar comando (substitua pela sua nova chave)**

```bash
cd server
sed -i '' 's/GEMINI_API_KEY=.*/GEMINI_API_KEY=sua-nova-chave-aqui/' .env
```

### Passo 4: Reiniciar o Backend

```bash
cd server
# Pare o servidor (Ctrl+C) e inicie novamente:
npm run dev
```

## ⚠️ IMPORTANTE: Segurança

### Nunca Faça:
- ❌ Commitar `.env` no Git
- ❌ Compartilhar a chave publicamente
- ❌ Colocar a chave em código que será publicado
- ❌ Enviar a chave por email ou mensagem

### Sempre Faça:
- ✅ Manter `.env` no `.gitignore`
- ✅ Usar variáveis de ambiente em produção
- ✅ Rotacionar chaves periodicamente
- ✅ Revogar chaves comprometidas imediatamente

## 🔒 Verificar .gitignore

Certifique-se de que o arquivo `.gitignore` inclui:

```
# Environment variables
.env
.env.local
.env.*.local
server/.env
```

## 📝 Checklist

- [ ] Chave antiga revogada no Google AI Studio
- [ ] Nova chave gerada
- [ ] Nova chave adicionada em `server/.env`
- [ ] Backend reiniciado
- [ ] Teste de geração de conteúdo funcionando

## 🆘 Se Ainda Der Erro

1. **Verifique se a nova chave está correta:**
   ```bash
   grep "GEMINI_API_KEY" server/.env
   ```

2. **Verifique se o backend carregou a chave:**
   ```bash
   cd server
   node -e "require('dotenv').config(); console.log('Chave:', process.env.GEMINI_API_KEY ? 'OK' : 'FALTANDO')"
   ```

3. **Verifique os logs do backend** para erros específicos

---

**Após gerar a nova chave e atualizar, o erro deve desaparecer! 🔐**

