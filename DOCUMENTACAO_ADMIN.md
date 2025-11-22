# Documentação do Sistema Administrativo

## Resumo das Alterações

Este documento descreve todas as alterações realizadas para implementar o sistema completo de administração da plataforma EduMágico.

## 1. Entidades Criadas

### 1.1. UserAccess (`server/src/entities/UserAccess.ts`)
- **Propósito**: Registrar todos os acessos dos usuários à plataforma
- **Campos principais**:
  - `userId`: ID do usuário
  - `loginAt`: Data/hora do login
  - `logoutAt`: Data/hora do logout (opcional)
  - `sessionDuration`: Duração da sessão em segundos
  - `ipAddress`: Endereço IP do acesso
  - `userAgent`: Navegador/dispositivo utilizado
  - `deviceId`: ID do dispositivo

### 1.2. Notification (`server/src/entities/Notification.ts`)
- **Propósito**: Sistema de notificações e comunicações
- **Campos principais**:
  - `targetType`: Tipo de destinatário (all, parents, teachers, students, specific)
  - `title`: Título da notificação
  - `message`: Mensagem
  - `type`: Tipo (info, success, warning, error)
  - `isRead`: Status de leitura
  - `metadata`: Dados adicionais (links, ações, etc.)

### 1.3. FinancialTransaction (`server/src/entities/FinancialTransaction.ts`)
- **Propósito**: Registrar todas as transações financeiras
- **Campos principais**:
  - `type`: Tipo (income, expense)
  - `category`: Categoria (subscription, content_sale, refund, payout, other)
  - `amount`: Valor da transação
  - `description`: Descrição
  - `status`: Status (pending, completed, failed, cancelled)
  - `metadata`: Dados adicionais (IDs relacionados, métodos de pagamento, etc.)

### 1.4. TeacherRating (`server/src/entities/TeacherRating.ts`)
- **Propósito**: Sistema de avaliações de professores
- **Campos principais**:
  - `teacherId`: ID do professor avaliado
  - `raterId`: ID do avaliador
  - `raterType`: Tipo do avaliador (parent, student)
  - `rating`: Nota de 1 a 5
  - `comment`: Comentário opcional

## 2. Atualizações nas Entidades Existentes

### 2.1. User (`server/src/entities/User.ts`)
- **Alteração**: Adicionado `'admin'` ao enum `UserRole`
- **Impacto**: Agora o sistema suporta usuários administradores

## 3. Rotas de Administração

### 3.1. Dashboard (`/api/admin/dashboard`)
- **Método**: GET
- **Descrição**: Retorna estatísticas gerais da plataforma
- **Retorna**: Total de usuários, receita total, receita mensal, total de acessos, etc.

### 3.2. Gerenciamento de Usuários
- **GET `/api/admin/users`**: Listar usuários com filtros (role, search, paginação)
- **GET `/api/admin/users/:id`**: Obter detalhes completos de um usuário (incluindo acessos e tempo total na plataforma)
- **PUT `/api/admin/users/:id`**: Atualizar dados do usuário
- **DELETE `/api/admin/users/:id`**: Deletar usuário

### 3.3. Gerenciamento de Conteúdos
- **GET `/api/admin/content`**: Listar todos os conteúdos com filtros
- **DELETE `/api/admin/content/:id`**: Deletar conteúdo

### 3.4. Gerenciamento de Assinaturas
- **GET `/api/admin/subscriptions`**: Listar assinaturas com filtros por status
- **PUT `/api/admin/subscriptions/:userId`**: Atualizar assinatura (status, ciclo, próxima cobrança)

### 3.5. Notificações e Comunicações
- **POST `/api/admin/notifications`**: Criar notificações (pode ser para todos, por perfil, ou específico)
- **GET `/api/admin/notifications`**: Listar notificações com filtros

### 3.6. Financeiro
- **GET `/api/admin/financial/transactions`**: Listar transações com filtros (tipo, categoria, status, período)
- **GET `/api/admin/financial/reports/monthly`**: Relatório mensal (receita, despesas, lucro)
- **GET `/api/admin/financial/reports/dre`**: DRE - Demonstração do Resultado do Exercício

### 3.7. Rankings
- **GET `/api/admin/rankings/teachers`**: Ranking de professores
  - Ordenação por: receita, materiais criados, avaliação média
  - Retorna: receita total, quantidade de conteúdos, média de avaliações, quantidade de avaliações

### 3.8. Relatórios de Uso
- **GET `/api/admin/reports/usage`**: Relatório de uso da plataforma
  - Total de acessos no período
  - Tempo total na plataforma
  - Total de atividades completadas
  - Usuários únicos

### 3.9. Registro de Acessos
- **GET `/api/admin/accesses`**: Listar todos os acessos com filtros (usuário, período)
  - Mostra: usuário, data/hora de login, logout, duração da sessão, IP

## 4. Middleware de Rastreamento

### 4.1. Access Tracking (`server/src/middleware/accessTracking.middleware.ts`)
- **Funcionalidade**: Rastreia automaticamente os acessos dos usuários
- **Como funciona**:
  - Cria registro de acesso no login
  - Atualiza duração da sessão a cada 30 segundos
  - Registra logout quando o usuário sai
  - Armazena IP, user agent e device ID

### 4.2. Integração no Login
- **Alteração em `server/src/routes/auth.routes.ts`**:
  - Ao fazer login, cria automaticamente um registro em `UserAccess`
  - Captura IP, user agent e device ID

## 5. Componente Frontend

### 5.1. AdminDashboard (`components/AdminDashboard.tsx`)
- **Funcionalidades**:
  - Dashboard com estatísticas gerais
  - Aba de Usuários: listagem, busca, filtros, visualização de detalhes
  - Aba de Conteúdos: listagem e gerenciamento
  - Aba de Assinaturas: gerenciamento de planos
  - Aba de Notificações: criação e listagem
  - Aba Financeiro: transações, relatórios mensais, DRE
  - Aba Rankings: ranking de professores
  - Aba Relatórios: relatórios de uso
  - Aba Acessos: histórico completo de acessos

## 6. Integração no App.tsx

### 6.1. Alterações
- Adicionado `'admin'` ao tipo de `currentView`
- Adicionado import do `AdminDashboard`
- Atualizado `handleLogin` para suportar role `'admin'`
- Adicionada renderização condicional do `AdminDashboard`

## 7. Sistema de Rotas e Permissões

### 7.1. Migração SQL (`server/src/migrations/003_populate_admin_routes.sql`)
- **Arquivo criado**: Adiciona todas as rotas de admin
- **Rotas cadastradas**: 17 rotas administrativas (IDs 35-51)
- **Permissões**: Todas as rotas são exclusivas para role `'admin'`
- **Parent e Teacher**: Todas as permissões definidas como `FALSE` para essas rotas

## 8. Configuração do Banco de Dados

### 8.1. Atualização em `server/src/config/database.ts`
- Adicionadas as novas entidades ao array `entities`:
  - `UserAccess`
  - `Notification`
  - `FinancialTransaction`
  - `TeacherRating`

## 9. Impactos e Considerações

### 9.1. Performance
- O tracking de acessos atualiza a cada 30 segundos, o que pode gerar muitas escritas no banco
- **Recomendação**: Em produção, considerar usar Redis para sessões ativas e fazer batch updates

### 9.2. Segurança
- Todas as rotas de admin requerem autenticação e role `'admin'`
- Middleware `requireRole(['admin'])` protege todas as rotas

### 9.3. Escalabilidade
- O sistema de notificações pode enviar para muitos usuários simultaneamente
- **Recomendação**: Em produção, usar filas (RabbitMQ, Bull) para processar notificações em background

### 9.4. Dados Financeiros
- Todas as transações são registradas em `FinancialTransaction`
- **Importante**: Garantir que todas as operações financeiras (compras, assinaturas, pagamentos) criem registros nesta tabela

## 10. Próximos Passos Recomendados

1. **Criar usuário admin inicial**: Script ou comando para criar primeiro admin
2. **Implementar logout tracking**: Garantir que o logout atualize `UserAccess.logoutAt`
3. **Adicionar gráficos**: Implementar visualizações gráficas no dashboard
4. **Exportar relatórios**: Adicionar funcionalidade de exportação (PDF, Excel)
5. **Filtros avançados**: Melhorar filtros nas listagens
6. **Paginação**: Implementar paginação completa em todas as listagens
7. **Validações**: Adicionar validações mais robustas nas rotas
8. **Testes**: Criar testes unitários e de integração

## 11. Arquivos Modificados

### Backend
- `server/src/entities/User.ts` - Adicionado role 'admin'
- `server/src/config/database.ts` - Adicionadas novas entidades
- `server/src/routes/auth.routes.ts` - Integrado tracking de acesso no login
- `server/src/index.ts` - Adicionada rota `/api/admin`
- `server/src/middleware/accessTracking.middleware.ts` - **NOVO**
- `server/src/routes/admin.routes.ts` - **NOVO**
- `server/src/entities/UserAccess.ts` - **NOVO**
- `server/src/entities/Notification.ts` - **NOVO**
- `server/src/entities/FinancialTransaction.ts` - **NOVO**
- `server/src/entities/TeacherRating.ts` - **NOVO**
- `server/src/migrations/003_populate_admin_routes.sql` - **NOVO**

### Frontend
- `types.ts` - Adicionado 'admin' ao UserRole
- `App.tsx` - Integrado AdminDashboard
- `components/AdminDashboard.tsx` - **NOVO**

## 12. Como Usar

### 12.1. Criar Usuário Admin
```sql
-- Exemplo de criação de admin (ajustar conforme necessário)
INSERT INTO users (name, email, password, role, plan, coins)
VALUES ('Admin', 'admin@edumagico.com', '$2b$10$hash...', 'admin', 'premium', 0);
```

### 12.2. Acessar Painel Admin
1. Fazer login com usuário admin
2. O sistema redireciona automaticamente para o painel administrativo
3. Navegar pelas abas para gerenciar diferentes aspectos da plataforma

### 12.3. Executar Migração de Rotas
```bash
cd server
psql -U seu_usuario -d edumagico -f src/migrations/003_populate_admin_routes.sql
```

## 13. Observações Finais

- O sistema está funcionalmente completo conforme solicitado
- Algumas funcionalidades podem precisar de ajustes finos após testes
- Recomenda-se testar todas as rotas antes de colocar em produção
- O tracking de acessos funciona automaticamente após o login

