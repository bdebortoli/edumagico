# 📝 Documentação - Busca Automática de Endereço por CEP

## ✅ Funcionalidade Implementada

Integração com a API dos Correios do Brasil (ViaCEP) para preenchimento automático de endereço através do CEP.

## 🔧 Arquivos Criados/Modificados

### 1. Novo Serviço: `services/cepService.ts`

**Funcionalidades**:
- ✅ `buscarCEP(cep: string)` - Busca endereço na API ViaCEP
- ✅ `formatarCEP(cep: string)` - Aplica máscara ao CEP (00000-000)
- ✅ Validação de CEP (8 dígitos)
- ✅ Tratamento de erros

**API Utilizada**: ViaCEP (https://viacep.com.br/)
- Gratuita
- Não requer autenticação
- Retorna: logradouro, bairro, cidade, estado

---

### 2. Componente ParentProfile Atualizado

**Alterações**:
- ✅ Campo CEP com busca automática
- ✅ Campos de endereço preenchidos automaticamente:
  - **Rua** (read-only após busca)
  - **Cidade** (read-only após busca)
  - **Estado** (read-only após busca)
- ✅ Campos editáveis pelo usuário:
  - **Número** (editável)
  - **Complemento** (editável)
- ✅ Indicador de carregamento (spinner)
- ✅ Mensagens de erro

**Comportamento**:
1. Usuário digita CEP
2. Quando completa 8 dígitos, busca automática é acionada
3. Campos são preenchidos automaticamente
4. Usuário preenche apenas número e complemento

---

### 3. Componente TeacherProfile Atualizado

**Alterações**: Mesmas funcionalidades do ParentProfile
- ✅ Busca automática por CEP
- ✅ Campos read-only (rua, cidade, estado)
- ✅ Campos editáveis (número, complemento)
- ✅ Feedback visual (loading, erros)

---

## 🎯 Fluxo de Uso

### Responsável ou Professor

1. **Acessa "Meu Perfil"**
2. **Clica em "Editar Perfil"**
3. **Na seção Endereço**:
   - Digita o CEP (ex: `01310-100`)
   - Ao completar 8 dígitos, a busca é automática
   - Spinner aparece durante a busca
   - Campos são preenchidos:
     - ✅ Rua: Preenchido automaticamente (read-only)
     - ✅ Cidade: Preenchido automaticamente (read-only)
     - ✅ Estado: Preenchido automaticamente (read-only)
   - Usuário preenche:
     - ✏️ Número: Editável
     - ✏️ Complemento: Editável

4. **Se CEP inválido**:
   - Mensagem de erro aparece abaixo do campo
   - Campos não são preenchidos
   - Usuário pode tentar novamente

---

## 🎨 Interface

### Estados Visuais

**Campo CEP**:
- Normal: Input com placeholder "00000-000"
- Buscando: Spinner animado à direita
- Erro: Mensagem vermelha abaixo do campo
- Sucesso: Campos preenchidos automaticamente

**Campos de Endereço**:
- **Rua, Cidade, Estado**: 
  - Fundo cinza claro (`bg-slate-50`)
  - `readOnly` e `cursor-not-allowed`
  - Indicam que são preenchidos automaticamente

- **Número, Complemento**:
  - Fundo branco
  - Editáveis normalmente
  - Usuário pode preencher livremente

---

## 🔍 Exemplo de Resposta da API

```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "complemento": "",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP",
  "erro": false
}
```

**Mapeamento**:
- `logradouro` → `address.street`
- `localidade` → `address.city`
- `uf` → `address.state`

---

## ⚠️ Tratamento de Erros

1. **CEP inválido** (< 8 dígitos)
   - Não aciona busca
   - Apenas formata o CEP

2. **CEP não encontrado**
   - Mensagem: "CEP não encontrado"
   - Campos não são preenchidos

3. **Erro de rede**
   - Mensagem: "Erro ao buscar CEP"
   - Usuário pode tentar novamente

---

## 📋 Validações

- ✅ CEP deve ter exatamente 8 dígitos para acionar busca
- ✅ Máscara automática aplicada (00000-000)
- ✅ Remove caracteres não numéricos antes de buscar
- ✅ Mantém número e complemento se já existirem

---

## 🔄 Integração

### Dependências
- Nenhuma dependência adicional necessária
- Usa `fetch` nativo do navegador
- API pública e gratuita

### Compatibilidade
- ✅ Funciona em todos os navegadores modernos
- ✅ Não requer configuração adicional
- ✅ Funciona offline? Não (requer conexão)

---

## 📝 Notas Técnicas

1. **Formatação do CEP**:
   - Aplicada enquanto o usuário digita
   - Máscara: `00000-000`
   - Máximo de 9 caracteres (8 dígitos + 1 hífen)

2. **Debounce**:
   - Busca acionada apenas quando CEP tem 8 dígitos
   - Não há debounce adicional (pode ser adicionado se necessário)

3. **Preservação de Dados**:
   - Número e complemento são mantidos ao buscar novo CEP
   - Apenas rua, cidade e estado são atualizados

---

## ✅ Status

- ✅ Serviço CEP criado
- ✅ ParentProfile atualizado
- ✅ TeacherProfile atualizado
- ✅ Validações implementadas
- ✅ Feedback visual implementado
- ✅ Tratamento de erros implementado

**Data**: 2024-11-19
**Versão**: 1.0.0

