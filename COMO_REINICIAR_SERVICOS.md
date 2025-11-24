# 🔄 Como Reiniciar os Serviços Após Deploy

## 📋 Passo a Passo Completo

### 1️⃣ Fazer Commit e Push das Alterações

Primeiro, certifique-se de que todas as alterações foram commitadas e enviadas para o GitHub:

```bash
# Verificar o status
git status

# Adicionar todas as alterações
git add -A

# Fazer commit
git commit -m "Restringe criação de conteúdo para pais: apenas séries dos filhos"

# Enviar para o GitHub
git push origin main
```

---

## 2️⃣ Backend (Render) - Reiniciar/Redepleyar

### Opção A: Redeploy Automático (Recomendado)

O Render detecta automaticamente mudanças no GitHub e faz deploy automaticamente. Aguarde 2-3 minutos após o `git push`.

### Opção B: Redeploy Manual

1. **Acesse o Dashboard do Render:**
   - Vá para: https://dashboard.render.com
   - Clique no serviço **`edumagico-api`**

2. **Fazer Redeploy:**
   - No menu superior, clique em **"Manual Deploy"**
   - Selecione **"Deploy latest commit"**
   - Clique em **"Deploy"**
   - Aguarde 2-3 minutos

### Opção C: Reiniciar o Serviço

1. No Dashboard do Render, vá no serviço **`edumagico-api`**
2. Clique em **"Events"** no menu lateral
3. Clique em **"Restart"** no topo da página
4. Aguarde alguns segundos

---

## 3️⃣ Frontend (Vercel) - Redeploy

### Opção A: Redeploy Automático

O Vercel também detecta mudanças no GitHub automaticamente. Aguarde 2-3 minutos após o `git push`.

### Opção B: Redeploy Manual

1. **Acesse o Dashboard do Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Clique no projeto **`edumagico`**

2. **Fazer Redeploy:**
   - Vá em **"Deployments"**
   - Clique nos três pontos (⋯) do último deploy
   - Selecione **"Redeploy"**
   - Confirme clicando em **"Redeploy"**
   - Aguarde 2-3 minutos

---

## 4️⃣ Verificar se Está Funcionando

### Backend:
```bash
curl https://edumagico-api.onrender.com/health
```

**Deve retornar:**
```json
{"status":"ok","timestamp":"...","database":"connected"}
```

### Frontend:
- Acesse: `https://edumagico.vercel.app`
- Teste criar conteúdo como pai
- Verifique se os campos estão bloqueados

---

## ⚠️ Importante

### Se o Deploy Automático Não Funcionar:

1. **Verifique se o push foi feito:**
   ```bash
   git log --oneline -1
   ```

2. **Verifique se o GitHub recebeu as mudanças:**
   - Acesse: https://github.com/bdebortoli/edumagico
   - Veja se o último commit aparece

3. **Force um redeploy manual** (usando Opção B acima)

---

## 🐛 Troubleshooting

### Backend não está atualizando:
- Verifique os logs no Render (menu "Logs")
- Veja se há erros de build
- Tente fazer um redeploy manual

### Frontend não está atualizando:
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Teste no modo anônimo
- Verifique os logs no Vercel

---

## 📝 Resumo Rápido

```bash
# 1. Commit e push
git add -A
git commit -m "Sua mensagem"
git push origin main

# 2. Aguardar 2-3 minutos (deploy automático)
# OU fazer redeploy manual no Render/Vercel

# 3. Testar
curl https://edumagico-api.onrender.com/health
```

---

**Após fazer o commit e push, os serviços serão atualizados automaticamente em 2-3 minutos!**

