# 🔄 Como Reiniciar o Servidor Frontend

## 📋 Passo a Passo

### 1. Encontrar o Terminal do Servidor

Procure pelo terminal onde você executou `npm run dev`. Você verá algo como:
```
VITE v6.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

### 2. Parar o Servidor

No terminal onde o servidor está rodando:
- Pressione **`Ctrl + C`** (ou **`Cmd + C`** no Mac)
- O servidor vai parar

### 3. Iniciar Novamente

No mesmo terminal, execute:
```bash
npm run dev
```

---

## 🆘 Se Não Encontrar o Terminal

### Opção 1: Matar o Processo

```bash
# Encontrar e matar processos do Vite
pkill -f vite
```

Depois inicie novamente:
```bash
cd /Users/brunodebortoli/Downloads/edumágico
npm run dev
```

### Opção 2: Abrir Novo Terminal

1. Abra um novo terminal
2. Execute:
   ```bash
   cd /Users/brunodebortoli/Downloads/edumágico
   npm run dev
   ```

---

## ✅ Verificar se Está Funcionando

Após reiniciar, você deve ver:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
```

E no navegador, acesse `http://localhost:3000`

---

## ⚠️ Importante

**SEMPRE reinicie o servidor após:**
- Mudar o arquivo `.env.local`
- Mudar variáveis de ambiente
- Instalar novas dependências

O Vite só carrega variáveis de ambiente quando o servidor inicia!

---

**Reinicie o servidor agora e teste novamente!**

