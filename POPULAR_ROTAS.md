# 🗄️ Como Popular Rotas no Banco de Dados

## ✅ Solução: Endpoint Temporário (Sem Shell)

Como o Shell não está disponível no plano gratuito do Render, criamos um endpoint HTTP que você pode chamar diretamente.

---

## 📋 Passo a Passo

### Passo 1: Aguardar Deploy

Após o commit, o Render fará um deploy automático. Aguarde alguns minutos.

### Passo 2: Chamar o Endpoint

Após o deploy, chame este endpoint:

**Método:** `POST`  
**URL:** `https://sua-url-backend.onrender.com/api/setup/populate-routes`

### Passo 3: Opções para Chamar

#### Opção A: Via Navegador (Mais Fácil)

1. Instale uma extensão do Chrome como **"Postman"** ou **"REST Client"**
2. Ou use o **Insomnia** ou **Postman** (aplicativo)
3. Faça uma requisição POST para:
   ```
   https://sua-url-backend.onrender.com/api/setup/populate-routes
   ```

#### Opção B: Via Terminal (curl)

```bash
curl -X POST https://sua-url-backend.onrender.com/api/setup/populate-routes
```

#### Opção C: Via JavaScript no Console do Navegador

1. Abra o console do navegador (F12)
2. Cole e execute:
   ```javascript
   fetch('https://sua-url-backend.onrender.com/api/setup/populate-routes', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.json())
   .then(console.log)
   .catch(console.error);
   ```

---

## ✅ Resposta Esperada

Se funcionar, você receberá:

```json
{
  "success": true,
  "message": "Rotas e permissões populadas com sucesso",
  "routesCreated": 24
}
```

---

## 🔍 Verificar se Funcionou

Após popular as rotas, teste o endpoint de login:

```bash
curl -X POST https://sua-url-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

Se não der erro de "rota não encontrada", está funcionando!

---

## ⚠️ Importante

Este endpoint é **temporário** e pode ser removido depois. Ele não requer autenticação, então use apenas uma vez para popular as rotas.

---

## 🆘 Se Der Erro

Se aparecer erro, verifique:

1. O backend está rodando? (teste `/health`)
2. O banco de dados está conectado? (verifique os logs)
3. As tabelas foram criadas? (o TypeORM cria automaticamente)

---

**Substitua `sua-url-backend` pela URL real do seu backend no Render!**

