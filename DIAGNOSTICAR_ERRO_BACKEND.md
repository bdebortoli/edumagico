# 🔍 Como Diagnosticar Erro "Internal Server Error"

## ❌ Problema

O backend está retornando "Internal Server Error" no endpoint `/health`.

---

## 🔍 Passo 1: Verificar Logs no Render

1. No Render, abra o serviço **`edumagico-api`**
2. Vá na aba **"Logs"** (no topo)
3. Procure por erros em vermelho ou mensagens de erro
4. **Copie as últimas linhas de erro** e me envie

---

## 🔍 Passo 2: Verificar Variáveis de Ambiente

No Render, vá em **"Environment"** e verifique se estas variáveis estão configuradas:

### Obrigatórias:
- ✅ `DATABASE_URL` - URL do banco de dados
- ✅ `NODE_ENV` - Deve ser `production`
- ✅ `PORT` - Deve ser `3001` (ou deixar padrão)

### Opcionais (mas recomendadas):
- `JWT_SECRET` - Chave para tokens JWT
- `CORS_ORIGIN` - Pode deixar vazio temporariamente

---

## 🔍 Passo 3: Verificar Conexão com Banco

O erro pode ser porque:
1. **`DATABASE_URL` não está configurada**
2. **Banco de dados não está acessível**
3. **Tabelas não foram criadas**

---

## ✅ Soluções Possíveis

### Solução 1: Verificar DATABASE_URL

1. No Render, abra o serviço PostgreSQL (`edumagico-db`)
2. Vá em **"Info"** ou **"Connections"**
3. Copie a **"Internal Database URL"**
4. No serviço web (`edumagico-api`), vá em **"Environment"**
5. Verifique se `DATABASE_URL` existe e está correta
6. Se não existir, adicione:
   - **Name**: `DATABASE_URL`
   - **Value**: Cole a URL copiada

### Solução 2: Verificar se Banco Está Rodando

1. No Render, abra o serviço PostgreSQL (`edumagico-db`)
2. Verifique se o status é **"Available"** (não "Suspended" ou "Creating")

### Solução 3: Verificar Logs Específicos

Nos logs do Render, procure por:
- `❌ Database connection error`
- `SSL/TLS required`
- `Connection terminated`
- `Cannot find module`
- Qualquer erro em vermelho

---

## 📋 O Que Me Enviar

Para eu ajudar melhor, me envie:

1. **Últimas 20-30 linhas dos logs do Render** (especialmente erros)
2. **Quais variáveis de ambiente estão configuradas** no `edumagico-api`
3. **Status do banco de dados** (`edumagico-db`) - está "Available"?

---

## 🆘 Erros Comuns e Soluções

### Erro: "Database connection error"
**Solução**: Verifique se `DATABASE_URL` está configurada corretamente

### Erro: "SSL/TLS required"
**Solução**: Já está corrigido no código, mas verifique se o deploy mais recente foi aplicado

### Erro: "Cannot find module"
**Solução**: O build pode ter falhado. Verifique se o último deploy foi bem-sucedido

### Erro: "synchronize is not allowed"
**Solução**: Pode ser que o TypeORM esteja tentando usar synchronize. Já está configurado para permitir.

---

**Me envie os logs do Render para eu diagnosticar o problema específico!**

