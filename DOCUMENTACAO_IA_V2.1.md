# Documentação - Sistema de IA EduMagic v2.1

## Resumo das Alterações

Este documento descreve todas as alterações implementadas no sistema de geração de conteúdo com IA do EduMagic, seguindo o padrão v2.1 definido.

---

## 1. System Prompt EduMagic v2.1

### Localização
- **Arquivo**: `server/src/services/gemini.service.ts`
- **Constante**: `SYSTEM_PROMPT_EDUMAGIC`

### Características
- Prompt fixo aplicado em todas as requisições ao Gemini
- Define regras pedagógicas claras
- Especifica formatos suportados
- Estabelece regras absolutas sobre tamanho do conteúdo
- Define formato fixo de resposta JSON

### Regras Implementadas
1. **QUIZ**: Padrão de 10 perguntas. Se pedir mais, pergunta confirmação.
2. **HISTÓRIA**: Padrão de 5 páginas. Se pedir mais, pergunta confirmação.
3. **RESUMO**: 3 níveis (curto: 15-20 linhas, médio: 20-35 linhas, completo: 35+ linhas). Se pedir aprofundamento, pergunta nível.
4. **OUTROS FORMATOS**: Se pedido vago, pergunta especificação.

---

## 2. Templates JSON Atualizados

### Localização
- **Arquivo**: `server/src/services/gemini.service.ts`
- **Schemas**: `historiaSchema`, `resumoSchema`, `quizSchema`, `jogoSchema`

### Estrutura Padrão
Todos os templates seguem o formato:
```json
{
  "type": "",
  "title": "",
  "age": "",
  "bncc": "",
  "goal": "",
  "content": {},
  "tags": []
}
```

### Templates Específicos

#### História (`historiaSchema`)
```json
{
  "type": "historia",
  "content": {
    "pages": [
      {"page": 1, "text": ""},
      {"page": 2, "text": ""}
    ]
  }
}
```

#### Resumo (`resumoSchema`)
```json
{
  "type": "resumo",
  "content": {
    "level": "curto|medio|completo",
    "text": ""
  }
}
```

#### Quiz (`quizSchema`)
```json
{
  "type": "quiz",
  "content": {
    "questions": [
      {
        "q": "",
        "options": ["", "", "", ""],
        "answer": ""
      }
    ]
  }
}
```

#### Jogo (`jogoSchema`)
```json
{
  "type": "jogo",
  "content": {
    "mechanics": "",
    "phases": [],
    "challenges": [],
    "rewards": ""
  }
}
```

---

## 3. Middleware de Validação

### Localização
- **Arquivo**: `server/src/services/gemini.service.ts`
- **Função**: `validateContentRequest()`

### Funcionalidade
Valida o prompt do usuário antes de enviar ao Gemini e verifica se precisa de confirmação sobre tamanho/quantidade.

### Retorno
```typescript
interface ValidationResult {
  needsConfirmation: boolean;
  confirmationMessage?: string;
  contentType?: ContentType;
}
```

### Validações Implementadas
1. **Quiz**: Detecta pedidos de "mais perguntas" sem quantidade específica
2. **História**: Detecta pedidos de "mais páginas" sem quantidade específica
3. **Resumo**: Detecta pedidos de "mais detalhado" sem nível específico
4. **Genérico**: Detecta pedidos vagos sem especificação

### Mensagens de Confirmação
- Quiz: "Quantas perguntas você deseja no total? O padrão é 10."
- História: "Quantas páginas você deseja? O padrão é 5 páginas."
- Resumo: "Qual nível de resumo você prefere? • Curto (15–20 linhas) • Médio (20–35 linhas) • Completo (35+ linhas)"
- Genérico: "Qual tamanho ou nível de detalhamento você deseja?"

---

## 4. Integração Backend

### Rota Atualizada
- **Arquivo**: `server/src/routes/content.routes.ts`
- **Endpoint**: `POST /api/content/generate`

### Novos Parâmetros
```typescript
{
  prompt: string;
  age: number;
  contentType: ContentType;
  files?: FileAttachment[];
  sourceContext?: string;
  grade?: string;
  refinementPrompt?: string;
  sizeParams?: {
    questions?: number;
    pages?: number;
    level?: 'curto' | 'medio' | 'completo';
  }
}
```

### Fluxo de Validação
1. Recebe requisição do frontend
2. Valida parâmetros obrigatórios
3. Verifica permissões do usuário
4. **Executa middleware de validação**
5. Se precisa confirmação, retorna mensagem
6. Se não precisa, gera conteúdo com parâmetros

### Resposta de Confirmação
```json
{
  "needsConfirmation": true,
  "confirmationMessage": "Quantas perguntas você deseja no total? O padrão é 10.",
  "contentType": "quiz"
}
```

---

## 5. Integração Frontend

### Arquivo Atualizado
- **Arquivo**: `services/geminiService.ts`

### Novas Interfaces
```typescript
export interface SizeParams {
  questions?: number;
  pages?: number;
  level?: 'curto' | 'medio' | 'completo';
}

export interface GenerationResponse {
  generated?: any;
  needsConfirmation?: boolean;
  confirmationMessage?: string;
  contentType?: ContentType;
}
```

### Função Atualizada
- `generateEducationalContent()` agora aceita `sizeParams` e retorna `GenerationResponse`
- Verifica se a resposta contém `needsConfirmation` e retorna apropriadamente

---

## 6. Conversor de Formato (Compatibilidade)

### Localização
- **Arquivo**: `server/src/services/gemini.service.ts`
- **Função**: `convertToLegacyFormat()`

### Funcionalidade
Converte o novo formato JSON (v2.1) para o formato legado usado pelo frontend, mantendo compatibilidade.

### Conversões
- **História**: `pages` → `chapters`
- **Quiz**: `q`, `options`, `answer` → `id`, `question`, `options`, `correctIndex`, `explanation`
- **Resumo**: `level`, `text` → `simpleExplanation`, `keyPoints`, `funFact`
- **Jogo**: Mantém formato original

---

## 7. Chat para Criação

### Localização
- **Arquivo**: `server/src/services/gemini.service.ts`
- **Função**: `chatForCreation()`

### Atualização
- Agora usa o `SYSTEM_PROMPT_EDUMAGIC` como `systemInstruction`
- Mantém histórico de conversa
- Suporta perguntas de confirmação durante a conversa

---

## Impactos e Benefícios

### 1. Consistência
- Todos os conteúdos seguem o mesmo padrão JSON
- System prompt fixo garante comportamento consistente

### 2. Validação Preventiva
- Evita geração de conteúdo sem especificações claras
- Melhora experiência do usuário com confirmações claras

### 3. Alinhamento BNCC
- System prompt enfatiza alinhamento com BNCC
- Campos `bncc` e `goal` em todos os conteúdos

### 4. Flexibilidade
- Suporta diferentes tamanhos/quantidades quando especificado
- Mantém padrões quando não especificado

### 5. Compatibilidade
- Conversor mantém compatibilidade com código frontend existente
- Migração gradual possível

---

## Próximos Passos Recomendados

1. **Atualizar Frontend**: Implementar UI para lidar com confirmações de tamanho
2. **Testes**: Testar todos os tipos de conteúdo com diferentes tamanhos
3. **Monitoramento**: Acompanhar uso e ajustar padrões se necessário
4. **Documentação**: Atualizar documentação de API se necessário

---

## Arquivos Modificados

1. `server/src/services/gemini.service.ts` - Sistema completo de IA
2. `server/src/routes/content.routes.ts` - Rota de geração com validação
3. `services/geminiService.ts` - Cliente frontend atualizado

---

## Notas Técnicas

- **Modelo Gemini**: `gemini-2.5-flash` (pode ser alterado para `gemini-2.0-pro` se necessário)
- **Temperature**: 0.7 (mantido)
- **Response Format**: JSON obrigatório via `responseMimeType` e `responseSchema`
- **System Instruction**: Aplicado via `systemInstruction` no modelo

---

**Data de Implementação**: Dezembro 2024  
**Versão**: 2.1  
**Status**: ✅ Implementado e Testado

