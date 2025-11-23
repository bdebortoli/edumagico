# 🗄️ Como Criar o Banco de Dados PostgreSQL no Render

## 📋 Passo a Passo

### Passo 1: Criar o Banco de Dados

1. No dashboard do Render, clique no botão **"+ New"** (canto superior direito)
2. Selecione **"PostgreSQL"** na lista de opções
3. Preencha os campos:
   - **Name**: `edumagico-db`
   - **Database**: `edumagico`
   - **User**: `edumagico_user`
   - **Region**: Escolha a mesma região do seu serviço web (ex: `Oregon (US West)`)
   - **PostgreSQL Version**: Deixe o padrão (geralmente 15 ou 16)
   - **Plan**: Selecione **"Free"**
4. Clique em **"Create Database"**

### Passo 2: Aguardar Criação

- Aguarde alguns minutos enquanto o Render cria o banco
- Você verá o status mudando de "Creating" para "Available"

### Passo 3: Obter a URL do Banco

1. Após o banco estar criado, clique nele (`edumagico-db`)
2. Vá na aba **"Info"** ou **"Connections"**
3. Procure por:
   - **"Internal Database URL"**
   - **"Connection String"**
   - Ou uma URL que começa com `postgresql://`
4. **Copie essa URL completa**

### Passo 4: Adicionar no Serviço Web

1. Volte para o serviço **`edumagico-api`** (serviço web)
2. Vá em **"Environment"** ou **"Environment Variables"**
3. Clique em **"+ Add Environment Variable"**
4. Preencha:
   - **Name**: `DATABASE_URL`
   - **Value**: Cole a URL que você copiou
5. Clique em **"Save"**

### Passo 5: Aguardar Deploy

- O Render fará um redeploy automático
- Aguarde alguns minutos
- Verifique os logs para ver se funcionou

---

## ✅ Verificação

Após adicionar `DATABASE_URL`, verifique os logs do serviço `edumagico-api`:

- Deve aparecer: `✅ Database connected successfully`
- E depois: `🚀 Server running on port 3001`

---

## 🆘 Se o Banco Já Existe

Se o banco `edumagico-db` já existe mas não aparece na lista:

1. Verifique se está no mesmo **projeto/grupo** no Render
2. Verifique se o banco não está **suspenso**
3. Tente adicionar manualmente a URL (Passo 4 acima)

---

## 📝 Exemplo de URL

A URL do banco geralmente tem este formato:
```
postgresql://usuario:senha@host:porta/database
```

Exemplo:
```
postgresql://edumagico_user:abc123@dpg-xxxxx-a.oregon-postgres.render.com:5432/edumagico
```

---

**Siga esses passos e me avise quando terminar!**

