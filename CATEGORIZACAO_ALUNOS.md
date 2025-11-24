# 📚 Categorização Automática de Alunos

## 🎯 Objetivo

Categorizar automaticamente os alunos baseado na série cadastrada, independente da idade (devido às diferenças nas datas de corte).

## ✅ Categorização Implementada

### Regras de Categorização

- **Pré-escola**: "Pré-escola"
- **Fundamental 1**: 1º a 5º Ano Fund.
- **Fundamental 2**: 6º a 9º Ano Fund.
- **Ensino Médio**: 1º a 3º Ano Médio

### Mapeamento

```
Pré-escola          → pre-escola
1º Ano Fund.        → fundamental1
2º Ano Fund.        → fundamental1
3º Ano Fund.        → fundamental1
4º Ano Fund.        → fundamental1
5º Ano Fund.        → fundamental1
6º Ano Fund.        → fundamental2
7º Ano Fund.        → fundamental2
8º Ano Fund.        → fundamental2
9º Ano Fund.        → fundamental2
1º Ano Médio        → ensino-medio
2º Ano Médio        → ensino-medio
3º Ano Médio        → ensino-medio
```

## 🔧 Implementação

### 1. Backend - Entidade

**Arquivo:** `server/src/entities/ChildProfile.ts`

Adicionado campo `educationLevel`:
```typescript
@Column({ nullable: true })
educationLevel?: 'pre-escola' | 'fundamental1' | 'fundamental2' | 'ensino-medio';
```

### 2. Backend - Função de Categorização

**Arquivo:** `server/src/routes/family.routes.ts`

Função `getEducationLevel()` que:
- Analisa a série cadastrada
- Retorna a categoria correspondente
- É chamada automaticamente ao criar/atualizar aluno

### 3. Backend - Criação/Atualização

**Arquivo:** `server/src/routes/family.routes.ts`

- **POST `/children`**: Calcula `educationLevel` automaticamente ao criar
- **PUT `/children/:id`**: Recalcula `educationLevel` quando a série é alterada
- **GET `/children`**: Atualiza `educationLevel` se não estiver definido (retrocompatibilidade)

### 4. Frontend - Tipo

**Arquivo:** `types.ts`

Adicionado `educationLevel` ao tipo `ChildProfile`:
```typescript
educationLevel?: 'pre-escola' | 'fundamental1' | 'fundamental2' | 'ensino-medio';
```

### 5. Frontend - Exibição

**Arquivo:** `components/FamilyManager.tsx`

- Função `getEducationLevelName()` para exibir nome amigável
- Exibição no card do aluno: `8 anos • 4º Ano Fund. • Fundamental 1`

### 6. Script de Migração

**Arquivo:** `server/src/scripts/updateEducationLevels.ts`

Script para atualizar alunos existentes:
```bash
npm run update:education-levels
```

## 📋 Fluxo

### Ao Cadastrar Aluno:

1. ✅ Responsável cadastra nome, data de nascimento e **série**
2. ✅ Sistema calcula automaticamente `educationLevel` baseado na série
3. ✅ Aluno é salvo com a categorização

### Ao Editar Aluno:

1. ✅ Responsável altera a série
2. ✅ Sistema recalcula automaticamente `educationLevel`
3. ✅ Aluno é atualizado com nova categorização

### Ao Carregar Alunos:

1. ✅ Sistema verifica se `educationLevel` está definido
2. ✅ Se não estiver, calcula automaticamente (retrocompatibilidade)
3. ✅ Atualiza no banco em background

## 🎨 Exibição

### Card do Aluno

```
┌─────────────────────────────────────┐
│ [Avatar]  Maria                     │
│          8 anos • 4º Ano Fund.      │
│          • Fundamental 1            │
│          ⭐ 1250 pontos              │
└─────────────────────────────────────┘
```

## 📝 Arquivos Modificados

- ✅ `server/src/entities/ChildProfile.ts` - Campo `educationLevel`
- ✅ `server/src/routes/family.routes.ts` - Função `getEducationLevel()` e aplicação automática
- ✅ `types.ts` - Tipo `ChildProfile` atualizado
- ✅ `components/FamilyManager.tsx` - Exibição da categorização
- ✅ `server/src/scripts/updateEducationLevels.ts` - Script de migração

## 🚀 Status

✅ **Categorização automática implementada**
✅ **Alunos existentes atualizados** (4 alunos)
✅ **Exibição no frontend**
✅ **Cálculo automático ao criar/editar**

## 🔄 Para Atualizar Alunos Existentes

Se houver alunos sem categorização, execute:

```bash
cd server
npm run update:education-levels
```

---

**Status:** ✅ Implementado e funcionando
**Teste:** Cadastre um aluno e verifique a categorização automática! 📚

