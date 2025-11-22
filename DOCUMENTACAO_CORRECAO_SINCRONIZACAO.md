# 🔧 Documentação - Correção de Erro de Sincronização do Banco de Dados

## 📋 Resumo

Foi corrigido um erro que impedia a sincronização automática do schema do banco de dados pelo TypeORM. O erro ocorria porque a tabela `rotas_permissões` continha registros com valores `NULL` na coluna `role`, e o TypeORM tentava adicionar essa coluna como `NOT NULL`.

## ❌ Problema Identificado

### Erro
```
error: column "role" of relation "rotas_permissões" contains null values
```

### Causa
- A tabela `rotas_permissões` já existia no banco de dados
- Alguns registros tinham valores `NULL` na coluna `role`
- O TypeORM tentava modificar a coluna para `NOT NULL` durante a sincronização
- PostgreSQL não permite adicionar uma constraint `NOT NULL` em uma coluna que contém valores `NULL`

## ✅ Solução Implementada

### Arquivo Modificado
- `server/src/index.ts`

### Mudanças Realizadas

1. **Importação do cliente PostgreSQL**
   - Adicionado `import { Client } from 'pg'` para conexão direta ao banco

2. **Função `fixDatabaseBeforeSync()`**
   - Conecta diretamente ao banco usando o cliente `pg` (antes do TypeORM)
   - Verifica se a tabela `rotas_permissões` existe
   - Verifica o tipo atual da coluna `role` (data_type, udt_name, is_nullable)
   - **Caso 1**: Se a coluna é `character varying` ou `text`:
     - Valida e corrige valores inválidos
     - Cria o tipo enum `rotas_permissões_role_enum`
     - Remove constraints que usam a coluna
     - Cria coluna temporária `role_temp` com tipo enum
     - Copia dados validados para a coluna temporária
     - Remove coluna antiga e renomeia `role_temp` para `role`
     - Define a coluna como NOT NULL
   - **Caso 2**: Se a coluna já é enum:
     - Preenche valores NULL com `'parent'`
     - Define a coluna como NOT NULL se ainda for nullable
   - Desconecta do banco

3. **Função `startServer()`**
   - Chama `fixDatabaseBeforeSync()` antes de inicializar o `AppDataSource`
   - Inicializa o `AppDataSource` normalmente (que sincroniza automaticamente)
   - Inicia o servidor Express

### Estratégia de Conversão

A função implementa uma estratégia robusta que:

1. **Detecta o tipo atual** da coluna `role` (varchar, text, ou enum)
2. **Converte de varchar/text para enum** usando uma coluna temporária:
   - Cria `role_temp` com tipo enum
   - Copia dados validados
   - Remove coluna antiga
   - Renomeia `role_temp` para `role`
3. **Garante valores válidos** (preenche NULL com 'parent')
4. **Define NOT NULL** se a coluna ainda for nullable

Esta abordagem evita o erro do TypeORM ao tentar fazer `ALTER COLUMN` diretamente, que falha quando há incompatibilidade de tipos.

// Initialize database
async function startServer() {
  try {
    // Primeiro, corrige os dados se necessário
    await fixDatabaseBeforeSync();
    
    // Agora inicializa o AppDataSource (que vai sincronizar automaticamente se synchronize: true)
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

startServer();
```

## 🎯 Impacto das Alterações

### Positivo
- ✅ O servidor agora inicia corretamente sem erros de sincronização
- ✅ Dados existentes são preservados e corrigidos automaticamente
- ✅ A solução é robusta e trata casos onde a tabela ainda não existe
- ✅ Não requer intervenção manual no banco de dados

### Considerações
- ⚠️ A função `fixDatabaseBeforeSync()` é executada toda vez que o servidor inicia
- ⚠️ Em produção, considere desabilitar `synchronize: true` e usar migrations
- ⚠️ O valor padrão `'parent'` pode não ser apropriado para todos os registros (mas é seguro como fallback)

## 🔄 Fluxo de Execução

1. **Servidor inicia** → `startServer()` é chamado
2. **Correção de dados** → `fixDatabaseBeforeSync()` conecta ao banco e corrige valores NULL
3. **Inicialização TypeORM** → `AppDataSource.initialize()` sincroniza o schema
4. **Servidor Express** → Inicia na porta configurada

## 📝 Notas Técnicas

- A correção usa o cliente `pg` diretamente para evitar conflitos com o TypeORM
- A verificação de existência da tabela/coluna evita erros se o banco estiver vazio
- O tratamento de erros permite que o servidor inicie mesmo se a correção falhar (útil para primeira execução)
- O valor padrão `'parent'` foi escolhido porque é o role mais comum no sistema

## 🚀 Próximos Passos Recomendados

1. **Em Produção**: Desabilitar `synchronize: true` e usar migrations
2. **Validação**: Adicionar validação para garantir que novos registros sempre tenham `role` definido
3. **Migração**: Criar uma migration SQL para corrigir dados existentes em produção
4. **Monitoramento**: Adicionar logs mais detalhados sobre a correção de dados

---

**Data**: 2024-12-19
**Versão**: 1.0.0
**Status**: ✅ Corrigido e Testado

