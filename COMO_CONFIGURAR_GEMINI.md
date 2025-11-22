# 🔑 Como Configurar a Chave do Gemini

## 📋 Passo a Passo Completo

### 1️⃣ Obter a Chave da API Gemini

1. **Acesse o site da Google AI Studio**:
   - Abra: https://aistudio.google.com/apikey
   - Faça login com sua conta Google

2. **Criar uma nova chave**:
   - Clique no botão **"Create API Key"** ou **"Criar chave de API"**
   - Selecione um projeto Google Cloud (ou crie um novo)
   - A chave será gerada automaticamente

3. **Copiar a chave**:
   - A chave aparecerá no formato: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Copie a chave completa** (você não poderá vê-la novamente depois)

---

### 2️⃣ Configurar no Projeto

#### Opção A: Arquivo .env.local (Recomendado)

1. **Localizar o arquivo**:
   ```bash
   cd /Users/brunodebortoli/Downloads/edumágico
   ```

2. **Editar ou criar o arquivo `.env.local`**:
   ```bash
   # Se o arquivo já existe, edite:
   nano .env.local
   
   # Ou crie um novo:
   echo "GEMINI_API_KEY=sua-chave-aqui" > .env.local
   ```

3. **Adicionar a chave**:
   ```
   GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   
   **⚠️ IMPORTANTE**: 
   - Substitua `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` pela sua chave real
   - Não adicione aspas ou espaços extras
   - Uma linha apenas

4. **Salvar o arquivo**

#### Opção B: Usar Editor de Texto

1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione ou substitua a linha:
   ```
   GEMINI_API_KEY=sua-chave-real-aqui
   ```
3. Salve o arquivo

---

### 3️⃣ Reiniciar o Servidor

**IMPORTANTE**: Após configurar a chave, você **DEVE** reiniciar o servidor para que as mudanças tenham efeito.

1. **Parar o servidor atual**:
   - No terminal onde o servidor está rodando, pressione `Ctrl + C`

2. **Iniciar novamente**:
   ```bash
   npm run dev
   ```

---

### 4️⃣ Verificar se Funcionou

1. **Acesse a plataforma**: http://localhost:3000
2. **Faça login** (ou use o modo demo)
3. **Vá em "Criar Conteúdo"** ou "Criar Mágica"
4. **Preencha um tema** (ex: "Fotossíntese")
5. **Clique em "Criar Conteúdo"**
6. **Deve gerar sem erros** ✅

---

## 🔍 Verificar Configuração Atual

Para verificar se a chave está configurada:

```bash
cd /Users/brunodebortoli/Downloads/edumágico
cat .env.local
```

Se aparecer `PLACEHOLDER_API_KEY` ou estiver vazio, você precisa configurar.

---

## ❌ Problemas Comuns

### Erro: "Chave da API Gemini não configurada"

**Causa**: Arquivo `.env.local` não existe ou chave não está configurada

**Solução**:
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se a linha `GEMINI_API_KEY=...` está presente
3. Reinicie o servidor após criar/editar o arquivo

### Erro: "API key not valid"

**Causa**: Chave inválida ou incorreta

**Solução**:
1. Verifique se copiou a chave completa
2. Verifique se não há espaços ou caracteres extras
3. Gere uma nova chave se necessário

### Erro: "Rate limit exceeded"

**Causa**: Limite de requisições atingido

**Solução**:
1. Aguarde alguns minutos
2. Verifique seu plano na Google AI Studio
3. Considere fazer upgrade se necessário

### A chave não está sendo carregada

**Solução**:
1. Certifique-se de que o arquivo se chama exatamente `.env.local` (com ponto no início)
2. Certifique-se de que está na raiz do projeto (mesmo nível do `package.json`)
3. Reinicie o servidor completamente (pare e inicie novamente)
4. Limpe o cache do Vite:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

## 📝 Exemplo de Arquivo .env.local

```
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

**⚠️ NUNCA**:
- ❌ Commite este arquivo no Git
- ❌ Compartilhe sua chave publicamente
- ❌ Adicione aspas na chave
- ❌ Adicione espaços antes ou depois do `=`

**✅ SEMPRE**:
- ✅ Mantenha o arquivo `.env.local` no `.gitignore`
- ✅ Use chaves diferentes para desenvolvimento e produção
- ✅ Revogue chaves antigas se suspeitar de vazamento

---

## 🆘 Ainda Não Funciona?

1. **Verifique o console do navegador** (F12 → Console):
   - Veja se há erros específicos
   - Copie a mensagem de erro

2. **Verifique os logs do servidor**:
   - Veja se há erros no terminal onde o servidor está rodando

3. **Teste a chave diretamente**:
   - Acesse: https://aistudio.google.com/
   - Verifique se a chave está ativa

4. **Reinstale dependências** (se necessário):
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

---

## ✅ Checklist

- [ ] Chave obtida em https://aistudio.google.com/apikey
- [ ] Arquivo `.env.local` criado/editado na raiz do projeto
- [ ] Chave adicionada no formato: `GEMINI_API_KEY=sua-chave-aqui`
- [ ] Servidor reiniciado após configurar
- [ ] Testado criando conteúdo na plataforma

---

**Pronto!** Após seguir esses passos, a geração de conteúdo deve funcionar. 🚀

