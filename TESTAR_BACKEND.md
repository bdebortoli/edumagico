# 🧪 Como Testar se o Backend Está Funcionando

## ✅ Teste Rápido

### 1. Testar Health Check

Abra no navegador ou use curl:

```
https://edumagico-api.onrender.com/health
```

**Deve retornar:**
```json
{"status":"ok","timestamp":"2025-11-22T..."}
```

### 2. Testar Popular Rotas

Chame o endpoint para popular rotas:

```bash
curl -X POST https://edumagico-api.onrender.com/api/setup/populate-routes
```

**Deve retornar:**
```json
{
  "success": true,
  "message": "Rotas e permissões populadas com sucesso",
  "routesCreated": 24
}
```

### 3. Testar Login (Depois de Popular Rotas)

```bash
curl -X POST https://edumagico-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 🔍 Verificar Logs no Render

1. No Render, abra o serviço `edumagico-api`
2. Vá em **"Logs"**
3. Verifique se aparece:
   - `✅ Database connected successfully`
   - `🚀 Server running on port 3001`

---

## 🆘 Problemas Comuns

### Erro: "Connection terminated"
- Verifique se `DATABASE_URL` está configurada no Render
- Verifique se o banco de dados está rodando

### Erro: "CORS policy"
- No Render, configure `CORS_ORIGIN` com a URL do frontend
- Ou deixe vazio temporariamente para testar

### Erro: "Route not found"
- Execute o endpoint `/api/setup/populate-routes` primeiro

---

**Teste esses endpoints e me diga o resultado!**

