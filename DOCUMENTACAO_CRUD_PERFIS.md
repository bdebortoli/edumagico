# 📝 Documentação - CRUD de Perfis (Responsável e Professor)

## ✅ Alterações Realizadas

### 1. Componente ParentProfile (Responsável)

**Arquivo**: `components/ParentProfile.tsx`

**Funcionalidades**:
- ✅ Visualização e edição de informações pessoais
  - Nome completo
  - E-mail
  - CPF
  - Data de nascimento
  - Telefone

- ✅ Visualização e edição de endereço completo
  - Rua
  - Número
  - Complemento
  - Cidade
  - Estado
  - CEP

- ✅ Gerenciamento de métodos de pagamento
  - Listar cartões cadastrados
  - Adicionar novo cartão (bandeira + últimos 4 dígitos)
  - Remover cartão

**Interface**:
- Modo visualização (read-only) com botão "Editar Perfil"
- Modo edição com formulários interativos
- Botões de ação: Salvar / Cancelar

---

### 2. Componente TeacherProfile (Professor)

**Arquivo**: `components/TeacherProfile.tsx`

**Funcionalidades**:
- ✅ Visualização e edição de informações pessoais
  - Nome completo
  - E-mail
  - CPF
  - Data de nascimento
  - Telefone

- ✅ Visualização e edição de endereço completo
  - Rua
  - Número
  - Complemento
  - Cidade
  - Estado
  - CEP

- ✅ Perfil profissional
  - Biografia (textarea)
  - Matérias que leciona (lista com adicionar/remover)
  - Ganhos totais (somente leitura)

- ✅ Dados bancários
  - Nome do banco
  - Tipo de conta (Corrente/Poupança)
  - Agência
  - Número da conta
  - Chave PIX (opcional)

**Interface**:
- Modo visualização (read-only) com botão "Editar Perfil"
- Modo edição com formulários interativos
- Seleção de matérias via dropdown
- Botões de ação: Salvar / Cancelar

---

### 3. Integração no App.tsx

**Alterações**:
- ✅ Importados os novos componentes `ParentProfile` e `TeacherProfile`
- ✅ Adicionada nova view `'profile'` no estado `currentView`
- ✅ Atualizado clique no card do usuário na sidebar para abrir perfil
- ✅ Adicionado item de menu "Meu Perfil" na seção "Conta"
- ✅ Renderização condicional baseada no role do usuário:
  - `parent` → `ParentProfile`
  - `teacher` → `TeacherProfile`

**Navegação**:
- Clicar no card do usuário (sidebar) → Abre "Meu Perfil"
- Menu lateral → "Meu Perfil" → Abre o CRUD correspondente

---

## 🎨 Características dos Componentes

### Design
- ✅ Layout responsivo (mobile-first)
- ✅ Cards com bordas arredondadas e sombras
- ✅ Ícones do Lucide React para melhor UX
- ✅ Cores consistentes com o design system (indigo/slate)
- ✅ Animações suaves (transitions)

### Funcionalidades
- ✅ Modo visualização e edição separados
- ✅ Validação de campos (HTML5)
- ✅ Feedback visual (hover states, focus states)
- ✅ Cancelamento de edição (restaura dados originais)

### Dados Gerenciados

**Responsável (ParentProfile)**:
```typescript
{
  name, email, cpf, birthDate, phoneNumber,
  address: { street, number, complement, city, state, zipCode },
  parentProfile: {
    paymentMethods: [{ last4, brand, token }]
  }
}
```

**Professor (TeacherProfile)**:
```typescript
{
  name, email, cpf, birthDate, phoneNumber,
  address: { street, number, complement, city, state, zipCode },
  teacherProfile: {
    bio,
    subjects: string[],
    bankDetails: {
      bankName, accountType, agency, accountNumber, pixKey
    },
    totalEarnings: number
  }
}
```

---

## 🔄 Fluxo de Uso

### Responsável
1. Acessa "Meu Perfil" (sidebar ou card do usuário)
2. Visualiza todas as informações
3. Clica em "Editar Perfil"
4. Preenche/atualiza os campos desejados
5. Adiciona/remove cartões de pagamento
6. Clica em "Salvar Alterações"
7. Dados são atualizados via `onUpdate` callback

### Professor
1. Acessa "Meu Perfil" (sidebar ou card do usuário)
2. Visualiza todas as informações
3. Clica em "Editar Perfil"
4. Preenche/atualiza os campos desejados
5. Adiciona/remove matérias que leciona
6. Configura dados bancários para recebimentos
7. Clica em "Salvar Alterações"
8. Dados são atualizados via `onUpdate` callback

---

## 📍 Localização dos Arquivos

```
edumágico/
├── components/
│   ├── ParentProfile.tsx      ← Novo componente
│   ├── TeacherProfile.tsx     ← Novo componente
│   └── ...
├── App.tsx                     ← Atualizado
└── types.ts                    ← Já existia (interfaces)
```

---

## 🎯 Próximos Passos (Opcional)

1. **Integração com Backend**: Conectar com API REST
   - `PUT /api/users/profile` para atualizar perfil
   - Validação de dados no backend

2. **Validações Avançadas**:
   - CPF válido
   - CEP com busca automática
   - Telefone formatado

3. **Upload de Foto**: Adicionar campo de avatar

4. **Histórico de Alterações**: Log de mudanças no perfil

---

## ✅ Status

- ✅ CRUD Responsável - Completo
- ✅ CRUD Professor - Completo
- ✅ Integração no App - Completo
- ✅ Design Responsivo - Completo
- ✅ Navegação - Completo

**Data**: 2024-11-19
**Versão**: 1.0.0

