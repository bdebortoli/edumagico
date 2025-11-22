# 🔑 Configurar API Gemini para Geração de Conteúdo

## ⚠️ Problema: Conteúdo não está sendo gerado

O erro ocorre porque a chave da API Gemini não está configurada ou não está sendo carregada corretamente.

## 🔧 Solução

### 1. Obter Chave da API Gemini

1. Acesse: https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar no Projeto

**Opção A: Arquivo .env.local (Recomendado)**

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```bash
cd /Users/brunodebortoli/Downloads/edumágico
```

Crie o arquivo:
```bash
echo "GEMINI_API_KEY=sua-chave-aqui" > .env.local
```

Ou edite manualmente e adicione:
```
GEMINI_API_KEY=sua-chave-gemini-aqui
```

**Opção B: Arquivo .env**

Se preferir usar `.env`:
```bash
echo "GEMINI_API_KEY=sua-chave-aqui" > .env
```

### 3. Reiniciar o Servidor

Após configurar a chave, **reinicie o servidor de desenvolvimento**:

```bash
# Parar o servidor atual (Ctrl+C)
# Depois iniciar novamente:
npm run dev
```

## ✅ Verificar se está funcionando

1. Acesse a plataforma
2. Vá em "Criar Conteúdo"
3. Preencha o tema
4. Clique em "Criar Conteúdo"
5. Deve gerar sem erros

## 🐛 Se ainda não funcionar

### Verificar se a chave está sendo carregada

1. Abra o console do navegador (F12)
2. Vá na aba "Console"
3. Tente gerar conteúdo
4. Veja se aparece algum erro específico

### Erros comuns

**"Chave da API Gemini não configurada"**
- Verifique se o arquivo `.env.local` existe
- Verifique se a variável está escrita corretamente: `GEMINI_API_KEY=...`
- Reinicie o servidor após criar/editar o arquivo

**"API key not valid"**
- Verifique se a chave está correta
- Verifique se não há espaços extras
- Gere uma nova chave se necessário

**"Rate limit exceeded"**
- Você atingiu o limite de requisições
- Aguarde alguns minutos ou verifique seu plano na Google

## 📝 Exemplo de arquivo .env.local

```
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE**: 
- Não commite o arquivo `.env.local` no Git
- Mantenha sua chave segura
- Não compartilhe sua chave publicamente

## 🔄 Alternativa: Usar Backend

Se preferir, você pode configurar a chave no backend (`server/.env`) e fazer as chamadas através da API. Nesse caso, o frontend chamaria `/api/content/generate` ao invés de chamar diretamente o Gemini.

