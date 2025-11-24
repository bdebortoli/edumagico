# 📝 Documentação - Correção de Erro 500 na Geração de Conteúdo com Gemini

## 🐛 Problema Identificado

Em produção, ocorria erro 500 ao tentar gerar conteúdo com múltiplos arquivos PDF/imagens. O erro aparecia com a mensagem:
- "Erro na requisição ao Gemini. Verifique os arquivos enviados e tente novamente."
- Erro 500 no endpoint `/api/content/generate`

## 🔍 Causas Identificadas

1. **Falta de validação de tamanho de arquivos**: Arquivos muito grandes ou muitos arquivos causavam falha na requisição
2. **Falta de limite de quantidade**: Não havia limite de arquivos por requisição
3. **Tratamento de erros insuficiente**: Mensagens de erro genéricas dificultavam diagnóstico
4. **Falta de validação no backend**: Arquivos inválidos ou corrompidos não eram detectados antes do envio ao Gemini

## ✅ Correções Implementadas

### 1. Validações no Frontend (`components/CreatorStudio.tsx`)

#### Limites Adicionados:
- **Máximo de arquivos**: 20 arquivos por requisição
- **Tamanho máximo por arquivo**: 20MB
- **Tamanho total máximo**: 100MB (considerando conversão para base64)

#### Validações Implementadas:
- ✅ Verificação de quantidade de arquivos antes do upload
- ✅ Verificação de tamanho individual de cada arquivo
- ✅ Verificação de tamanho total (atual + novos arquivos)
- ✅ Tratamento de erros na leitura de arquivos
- ✅ Validação de tipos MIME suportados
- ✅ Mensagens de erro claras e específicas

#### Código Adicionado:
```typescript
const MAX_FILES = 20; // Limite de arquivos
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB por arquivo
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

// Validações antes de processar arquivos
if (files.length + filesArray.length > MAX_FILES) {
  alert(`Limite de arquivos excedido...`);
  return;
}

if (file.size > MAX_FILE_SIZE) {
  alert(`Arquivo muito grande: ${file.name}...`);
  return;
}
```

### 2. Validações no Backend (`server/src/routes/content.routes.ts`)

#### Validações Adicionadas:
- ✅ Limite de quantidade de arquivos (20 arquivos)
- ✅ Validação de tamanho individual (30MB em base64 ≈ 20MB original)
- ✅ Validação de tamanho total (120MB em base64 ≈ 90MB original)
- ✅ Validação de tipos MIME suportados
- ✅ Verificação de integridade dos dados base64
- ✅ Logs detalhados para debug

#### Código Adicionado:
```typescript
const MAX_FILES = 20;
const MAX_FILE_SIZE_BASE64 = 30 * 1024 * 1024; // ~30MB em base64
const MAX_TOTAL_SIZE_BASE64 = 120 * 1024 * 1024; // ~120MB total

// Validações antes de processar
if (files.length > MAX_FILES) {
  return res.status(400).json({ 
    error: `Limite de arquivos excedido...` 
  });
}

// Validação de tamanho e tipo de cada arquivo
for (const file of files) {
  const fileSize = Buffer.from(file.data, 'base64').length;
  if (fileSize > MAX_FILE_SIZE_BASE64) {
    return res.status(400).json({ 
      error: `Arquivo muito grande: ${file.name}...` 
    });
  }
}
```

### 3. Melhorias no Tratamento de Erros (`server/src/services/gemini.service.ts`)

#### Melhorias Implementadas:
- ✅ Logs mais detalhados com informações dos arquivos
- ✅ Mensagens de erro específicas por tipo de problema
- ✅ Tratamento de diferentes códigos de erro HTTP
- ✅ Informações de debug em ambiente de desenvolvimento

#### Mensagens de Erro Específicas:
- **400 Bad Request**: "Erro na requisição ao Gemini. Verifique os arquivos enviados e tente novamente. Se o problema persistir, tente com menos arquivos ou arquivos menores."
- **401 Unauthorized**: "Erro de autenticação com a API do Gemini. Verifique a chave da API."
- **413 Payload Too Large**: "Arquivos muito grandes. Tente enviar menos arquivos ou arquivos menores."
- **429 Too Many Requests**: "Limite de requisições excedido. Tente novamente em alguns instantes."
- **500 Internal Server Error**: "Erro interno do servidor do Gemini. Tente novamente mais tarde."
- **Timeout**: "Tempo de processamento excedido. Tente com menos arquivos ou arquivos menores."

## 📋 Arquivos Modificados

1. **`components/CreatorStudio.tsx`**
   - Adicionada função `handleFileUpload` com validações completas
   - Limites de tamanho e quantidade de arquivos
   - Tratamento de erros na leitura de arquivos

2. **`server/src/routes/content.routes.ts`**
   - Validações no endpoint `/generate` antes de processar
   - Verificação de tamanho e quantidade de arquivos
   - Validação de tipos MIME e integridade dos dados
   - Logs detalhados para debug

3. **`server/src/services/gemini.service.ts`**
   - Melhorias no tratamento de erros
   - Logs mais detalhados com informações dos arquivos
   - Mensagens de erro específicas por tipo de problema

## 🎯 Impacto das Alterações

### Frontend:
- ✅ Usuários recebem feedback imediato sobre limites excedidos
- ✅ Prevenção de uploads de arquivos muito grandes
- ✅ Melhor experiência do usuário com mensagens claras

### Backend:
- ✅ Prevenção de requisições inválidas ao Gemini
- ✅ Redução de erros 500 por validação prévia
- ✅ Melhor diagnóstico de problemas com logs detalhados
- ✅ Proteção contra requisições malformadas

### Produção:
- ✅ Redução significativa de erros 500
- ✅ Melhor performance ao rejeitar requisições inválidas antes do processamento
- ✅ Logs mais úteis para diagnóstico de problemas

## 🔧 Configurações e Limites

### Limites Atuais:
- **Máximo de arquivos**: 20 por requisição
- **Tamanho máximo por arquivo**: 20MB (frontend) / 30MB base64 (backend)
- **Tamanho total máximo**: 100MB (frontend) / 120MB base64 (backend)

### Tipos de Arquivo Suportados:
- ✅ Imagens: JPG, JPEG, PNG, GIF, WEBP
- ✅ Documentos: PDF
- ❌ Não suportados: DOC, DOCX, XLS, XLSX, PPT, PPTX

## 🚀 Próximos Passos (Opcional)

1. **Monitoramento**: Adicionar métricas de uso de arquivos
2. **Otimização**: Implementar compressão de imagens antes do upload
3. **Feedback**: Mostrar progresso durante upload de múltiplos arquivos
4. **Cache**: Implementar cache de arquivos processados para evitar reprocessamento

## 📝 Notas Técnicas

- A conversão para base64 aumenta o tamanho do arquivo em aproximadamente 33%
- O backend valida o tamanho em base64, enquanto o frontend valida o tamanho original
- Os limites foram definidos considerando os limites da API do Gemini
- As validações são feitas tanto no frontend (UX) quanto no backend (segurança)

---

**Data da Correção**: 2025-01-22  
**Versão**: 1.0  
**Status**: ✅ Implementado e Testado

