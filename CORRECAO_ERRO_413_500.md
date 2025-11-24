# 🔧 Correção dos Erros 413 e 500

## 🔍 Problemas Identificados

1. **Erro 413 (Payload Too Large)**
   - Muitas imagens em base64 sendo enviadas
   - Limite padrão do Express (100kb) muito pequeno

2. **Erro 500 (Internal Server Error)**
   - Erros genéricos sem detalhes
   - Mensagens de erro não informativas

## ✅ Correções Aplicadas

### 1. Aumento do Limite de Payload

**Arquivo:** `server/src/index.ts`

```typescript
// ANTES
app.use(express.json());

// DEPOIS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

**Resultado:** Agora aceita payloads de até 50MB (suficiente para várias imagens)

### 2. Melhor Tratamento de Erros no Backend

**Arquivo:** `server/src/routes/content.routes.ts`

```typescript
// ANTES
catch (error) {
  res.status(500).json({ error: 'Erro ao gerar conteúdo' });
}

// DEPOIS
catch (error: any) {
  const errorMessage = error.message || 'Erro ao gerar conteúdo';
  const statusCode = error.status || 500;
  res.status(statusCode).json({ 
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

**Resultado:** Mensagens de erro mais específicas e úteis

### 3. Melhor Tratamento de Erros no Frontend

**Arquivo:** `services/geminiService.ts`

Agora trata especificamente:
- **413**: "Arquivos muito grandes. Tente enviar menos imagens ou imagens menores."
- **500**: "Erro no servidor ao gerar conteúdo. Verifique se a chave do Gemini está configurada."
- **401**: "Sessão expirada. Faça login novamente."
- **403**: "Você não tem permissão para gerar conteúdo."

## 🎯 Próximos Passos

### Teste Agora:

1. **Recarregue a página** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Tente gerar conteúdo novamente**
3. **Se ainda der erro 413**, tente:
   - Enviar menos imagens (máximo 3-4 por vez)
   - Ou comprimir as imagens antes de enviar

### Otimização Futura (Opcional):

Para reduzir o tamanho do payload, você pode:

1. **Comprimir imagens no frontend** antes de enviar
2. **Redimensionar imagens** para tamanho menor
3. **Enviar apenas uma imagem por vez** se possível

## 📝 Resumo

✅ **Limite de payload aumentado para 50MB**
✅ **Mensagens de erro mais específicas**
✅ **Backend reiniciado com as correções**

**Teste agora e me avise se funcionou! 🚀**

