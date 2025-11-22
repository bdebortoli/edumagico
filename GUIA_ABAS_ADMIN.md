# 📍 Guia - Como Acessar as Configurações do Painel Admin

## 🎯 Onde Encontrar a Aba "Níveis de Acesso"

A aba **"Níveis de Acesso"** está localizada no **topo do painel administrativo**, junto com as outras abas.

### Passo a Passo:

1. **Faça login** como admin (ex: `bdebortoli@gmail.com`)
2. Você será redirecionado automaticamente para o **Painel Administrativo**
3. No **topo da tela**, você verá uma barra horizontal com várias abas:
   - Dashboard
   - Usuários
   - Conteúdos
   - Assinaturas
   - Notificações
   - Financeiro
   - Rankings
   - Relatórios
   - Acessos
   - **🔧 Níveis de Acesso** ← Esta é a aba que você procura!

4. **Clique na aba "Níveis de Acesso"** (última aba, com ícone de engrenagem ⚙️)

## 📋 O que você encontrará na aba "Níveis de Acesso"

Ao clicar na aba "Níveis de Acesso", você verá:

- Uma **tabela** com todas as rotas da API
- Para cada rota, você pode configurar:
  - ✅ **Admin** - Permitir ou negar acesso
  - ✅ **Responsável** - Permitir ou negar acesso
  - ✅ **Professor** - Permitir ou negar acesso

- Você pode **ativar/desativar** cada permissão usando os **switches** (interruptores) na tabela

## 🔍 Se você não está vendo as abas:

1. Verifique se você está logado como **admin**
2. Verifique se o servidor backend está rodando (`npm run dev` na pasta `server`)
3. Recarregue a página (F5)
4. Verifique o console do navegador (F12) para ver se há erros

## 📸 Localização Visual

```
┌─────────────────────────────────────────────────────────┐
│  Painel Administrativo                                  │
├─────────────────────────────────────────────────────────┤
│  [Dashboard] [Usuários] [Conteúdos] [Assinaturas] ... │
│  ... [Acessos] [🔧 Níveis de Acesso] ← CLIQUE AQUI!    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Conteúdo da aba selecionada aparece aqui              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## ✅ Status das Rotas

- ✅ Rotas de permissões cadastradas no banco
- ✅ Permissões configuradas (admin: permitido, outros: negado)
- ✅ Aba "Níveis de Acesso" implementada e funcional
- ✅ Interface de gerenciamento de permissões pronta

---

**Dica**: Se você não encontrar a aba, role a barra de abas horizontalmente (ela pode estar oculta se houver muitas abas).

