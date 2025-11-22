# 🔗 Como Configurar DATABASE_URL no Render - Guia Passo a Passo

## 📋 O que você precisa fazer

Vincular o banco de dados PostgreSQL ao serviço web para que o Render adicione automaticamente a variável `DATABASE_URL`.

---

## 🎯 Método 1: Vinculação Automática (Mais Fácil - RECOMENDADO)

### Passo 1: Acessar o Serviço Web

1. Acesse [render.com](https://render.com) e faça login
2. No dashboard, encontre e clique no serviço **`edumagico-api`** (seu serviço web)

### Passo 2: Vincular o Banco de Dados

1. No serviço `edumagico-api`, procure por uma seção chamada:
   - **"Environment"** ou **"Environment Variables"**
   - Ou **"Settings"** → **"Environment"**

2. Procure por um botão ou link que diz:
   - **"Link Resource"**
   - **"Add Database"**
   - **"Link PostgreSQL"**
   - Ou um botão **"+"** ou **"Add"** próximo a "Environment Variables"

3. Clique nesse botão/link

4. Uma lista de recursos aparecerá. Procure e selecione:
   - **`edumagico-db`** (seu serviço PostgreSQL)

5. Clique em **"Link"** ou **"Connect"** ou **"Save"**

6. **Pronto!** O Render adicionará automaticamente a variável `DATABASE_URL` com a URL correta do banco.

---

## 🎯 Método 2: Adicionar Manualmente (Se o Método 1 não funcionar)

### Passo 1: Obter a URL do Banco

1. No dashboard do Render, encontre e clique no serviço **`edumagico-db`** (PostgreSQL)

2. Vá na aba **"Info"** ou **"Connections"**

3. Procure por uma das seguintes opções:
   - **"Internal Database URL"**
   - **"Connection String"**
   - **"Database URL"**
   - Ou uma URL que começa com `postgresql://` ou `postgres://`

4. **Copie essa URL completa** (ela será algo como):
   ```
   postgresql://usuario:senha@host:porta/database
   ```

### Passo 2: Adicionar no Serviço Web

1. Volte para o serviço **`edumagico-api`** (serviço web)

2. Vá em **"Environment"** ou **"Environment Variables"**

3. Clique no botão **"+ Add Environment Variable"** ou **"Add"**

4. Preencha:
   - **Name (Nome)**: `DATABASE_URL`
   - **Value (Valor)**: Cole a URL que você copiou no Passo 1

5. Clique em **"Save"** ou **"Add"**

6. **Pronto!** A variável foi adicionada.

---

## ✅ Verificação

Após adicionar a variável:

1. O Render fará um **redeploy automático** do serviço web
2. Aguarde alguns minutos
3. Vá em **"Logs"** do serviço `edumagico-api`
4. Você deve ver:
   - `✅ Database connected successfully`
   - `🚀 Server running on port 3001`

---

## 🆘 Se não encontrar as opções

Se você não encontrar as opções mencionadas:

1. **No serviço web (`edumagico-api`)**:
   - Vá em **"Settings"** (Configurações)
   - Procure por **"Environment"** ou **"Environment Variables"**
   - Ou procure por **"Resources"** ou **"Linked Resources"**

2. **No serviço PostgreSQL (`edumagico-db`)**:
   - Vá em **"Info"** (Informações)
   - Procure por **"Connection Info"** ou **"Database URL"**

---

## 📸 Onde encontrar no Render

### Interface do Render:
- **Dashboard**: Lista de todos os serviços
- **Serviço Web**: `edumagico-api` → **Environment** → **Link Resource** ou **Add Variable**
- **Serviço PostgreSQL**: `edumagico-db` → **Info** → **Internal Database URL**

---

## ⚠️ Importante

- A URL do banco geralmente começa com `postgresql://` ou `postgres://`
- Não compartilhe essa URL publicamente (ela contém senha)
- O Render pode fazer um redeploy automático após adicionar a variável

---

## 🎉 Depois de configurar

Após adicionar `DATABASE_URL` e o deploy funcionar:

1. ✅ As tabelas serão criadas automaticamente
2. ✅ O servidor iniciará corretamente
3. ✅ Você poderá testar o health check
4. ✅ Depois, popular as rotas no banco

---

**Precisa de mais ajuda? Me avise qual passo você está e onde está travado!**

