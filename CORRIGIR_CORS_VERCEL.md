# 🔧 Como Corrigir o Erro de CORS com Vercel

## 🔍 Problema

O frontend no Vercel (`https://edumagico.vercel.app`) está sendo bloqueado pelo backend devido a política de CORS.

**Erro no console:**
```
Access to fetch at 'https://edumagico-api.onrender.com/api/auth/register' 
from origin 'https://edumagico.vercel.app' 
has been blocked by CORS policy
```

## ✅ Solução

### Opção 1: Configurar CORS_ORIGIN no Render (Recomendado)

1. **Acesse o Dashboard do Render:**
   - Vá para: https://dashboard.render.com
   - Clique no seu serviço backend (edumagico-api)

2. **Vá em "Environment":**
   - No menu lateral, clique em "Environment"

3. **Adicione a variável CORS_ORIGIN:**
   - Clique em "Add Environment Variable"
   - **Key:** `CORS_ORIGIN`
   - **Value:** `https://edumagico.vercel.app`
   - Clique em "Save Changes"

4. **Aguarde o redeploy:**
   - O Render vai fazer um redeploy automaticamente
   - Aguarde 2-3 minutos

### Opção 2: Permitir Múltiplas Origens

Se você tiver múltiplas URLs (ex: produção e staging), separe por vírgula:

**Value:** `https://edumagico.vercel.app,https://edumagico-staging.vercel.app`

### Opção 3: Temporário - Permitir Todas as Origens

Se `CORS_ORIGIN` não estiver configurado, o backend já permite todas as origens temporariamente. Mas é recomendado configurar a variável para segurança.

---

## 🧪 Testar a Correção

Após configurar e aguardar o redeploy:

1. **Recarregue a página no Vercel** (F5)
2. **Abra o Console** (F12 → Console)
3. **Tente fazer login ou cadastro**
4. **O erro de CORS não deve mais aparecer**

---

## 📋 Verificação Rápida

Teste se o CORS está funcionando:

```bash
curl -H "Origin: https://edumagico.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://edumagico-api.onrender.com/api/auth/register \
     -v
```

**Deve retornar headers como:**
```
Access-Control-Allow-Origin: https://edumagico.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## ⚠️ Importante

- **Nunca** deixe `CORS_ORIGIN` vazio em produção por muito tempo (risco de segurança)
- Sempre configure a URL exata do seu frontend
- Após configurar, aguarde o redeploy completo antes de testar

---

**Configure a variável `CORS_ORIGIN` no Render agora e aguarde o redeploy!**

