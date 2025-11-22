# Documentação das Alterações - Backend EduMágico

## 📋 Resumo

Foi criado um backend completo para a plataforma EduMágico, incluindo banco de dados PostgreSQL, API RESTful com Express/TypeScript, autenticação JWT, sistema de rotas e permissões, e integração com Google Gemini AI.

## 🗂️ Estrutura Criada

### Diretório: `/server/`

```
server/
├── src/
│   ├── config/
│   │   └── database.ts              # Configuração TypeORM + PostgreSQL
│   ├── entities/                     # Entidades do banco de dados
│   │   ├── User.ts                  # Usuários (pais e professores)
│   │   ├── ContentItem.ts           # Conteúdo educacional
│   │   ├── ChildProfile.ts          # Perfis de filhos
│   │   ├── ActivityHistory.ts       # Histórico de atividades
│   │   ├── Purchase.ts              # Compras do marketplace
│   │   ├── Route.ts                 # Rotas da API
│   │   └── RoutePermission.ts       # Permissões por role
│   ├── middleware/
│   │   ├── auth.middleware.ts       # Autenticação JWT
│   │   └── routePermission.middleware.ts  # Verificação de permissões
│   ├── routes/
│   │   ├── auth.routes.ts           # POST /register, POST /login, GET /me
│   │   ├── user.routes.ts           # GET/PUT /profile, PUT /subscription
│   │   ├── content.routes.ts        # CRUD de conteúdo + IA
│   │   ├── marketplace.routes.ts    # Listagem e compras
│   │   ├── family.routes.ts         # CRUD de filhos
│   │   └── analytics.routes.ts      # Histórico e analytics
│   ├── services/
│   │   ├── auth.service.ts          # Hash de senhas, JWT
│   │   └── gemini.service.ts        # Integração Gemini AI
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Schema inicial
│   │   └── 002_populate_routes.sql  # População de rotas
│   ├── scripts/
│   │   └── populateRoutes.ts        # Script TypeScript para rotas
│   └── index.ts                     # Entry point do servidor
├── package.json                     # Dependências e scripts
├── tsconfig.json                    # Configuração TypeScript
├── .gitignore
└── README.md                        # Documentação completa
```

## 🗄️ Banco de Dados

### Tabelas Criadas

1. **users** - Usuários do sistema
   - Campos: id, name, email, password (hashed), role, plan, coins, cpf, birthDate, address, phoneNumber, teacherProfile, parentProfile, subscription
   - Relações: contents, children, activityHistory, purchases

2. **content_items** - Conteúdo educacional
   - Campos: id, title, description, type, authorId, authorName, authorRole, subject, ageRange, grade, keywords, resources, isAiGenerated, price, salesCount, data (JSONB)
   - Relação: author (User)

3. **child_profiles** - Perfis de filhos
   - Campos: id, name, age, grade, school, state, city, points, avatar, parentId
   - Relação: parent (User)

4. **activity_history** - Histórico de atividades
   - Campos: id, userId, childId, contentId, contentTitle, subject, score, maxScore, completedAt
   - Relações: user, child, content

5. **purchases** - Compras do marketplace
   - Campos: id, userId, contentId, price, coinsUsed, status, createdAt
   - Relações: user, content

6. **rotas** - Rotas da API
   - Campos: id, path, method, description, createdAt
   - Usado para controle de permissões

7. **rotas_permissões** - Permissões por role
   - Campos: id, rotaId, role, allowed, createdAt
   - Relação: route

## 🔐 Autenticação

- **JWT (JSON Web Tokens)** para autenticação
- Senhas hasheadas com **bcryptjs** (10 rounds)
- Middleware `authenticate` verifica token em todas as rotas protegidas
- Token expira em 7 dias (configurável via env)

## 📡 Endpoints Implementados

### Autenticação (`/api/auth`)
- `POST /register` - Registrar novo usuário
- `POST /login` - Fazer login (retorna token)
- `GET /me` - Obter usuário atual (requer auth)

### Usuários (`/api/users`)
- `GET /profile` - Obter perfil (requer auth)
- `PUT /profile` - Atualizar perfil (requer auth)
- `PUT /subscription` - Atualizar assinatura (requer auth)

### Conteúdo (`/api/content`)
- `GET /` - Listar conteúdo do usuário (filtros: subject, grade, childAge)
- `GET /:id` - Obter conteúdo por ID
- `POST /` - Criar novo conteúdo (premium/teacher only)
- `PUT /:id` - Atualizar conteúdo (owner only)
- `DELETE /:id` - Deletar conteúdo (owner only)
- `POST /generate` - Gerar conteúdo com IA (premium/teacher only)
- `POST /chat` - Chat para criação (premium/teacher only)

### Marketplace (`/api/marketplace`)
- `GET /` - Listar conteúdo pago (filtros: subject, grade, teacher)
- `GET /:id` - Obter item do marketplace
- `POST /:id/purchase` - Comprar conteúdo (deduz coins, cria cópia)

### Família (`/api/family`)
- `GET /children` - Listar filhos (parent only)
- `POST /children` - Criar perfil de filho (parent only, respeita limite do plano)
- `PUT /children/:id` - Atualizar perfil (parent only)
- `DELETE /children/:id` - Deletar perfil (parent only)

### Analytics (`/api/analytics`)
- `POST /activity` - Registrar conclusão de atividade
- `GET /history` - Obter histórico (filtro: childId)
- `GET /performance` - Obter desempenho (parent only)
- `GET /financial` - Obter dados financeiros (teacher only)

## 🔒 Sistema de Rotas e Permissões

### Implementação

1. **Tabela `rotas`**: Armazena todas as rotas da API (path + method)
2. **Tabela `rotas_permissões`**: Define quais roles podem acessar cada rota
3. **Middleware `checkRoutePermission`**: Verifica permissões antes de processar requisição

### Roles
- **parent** - Responsáveis
- **teacher** - Professores  
- **admin** - Administradores (futuro)

### Cadastro de Rotas

Todas as rotas foram cadastradas seguindo o padrão:
- IDs incrementais começando em 1
- Paths normalizados (ex: `/api/content/:id`)
- Permissões definidas por role

### Scripts de População

- **SQL**: `src/migrations/002_populate_routes.sql`
- **TypeScript**: `src/scripts/populateRoutes.ts`

Para adicionar novas rotas, execute o script TypeScript ou adicione manualmente via SQL seguindo o padrão.

## 🤖 Integração Gemini AI

O serviço `gemini.service.ts` integra com Google Gemini AI para:
- **Geração de conteúdo educacional** (stories, quizzes, summaries)
- **Chat para criação** (assistente conversacional)

Schemas estruturados garantem respostas no formato esperado.

## ⚙️ Configuração

### Variáveis de Ambiente (`.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=edumagico

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Como Executar

1. **Instalar dependências**:
```bash
cd server
npm install
```

2. **Configurar .env** (copiar de .env.example)

3. **Criar banco de dados**:
```sql
CREATE DATABASE edumagico;
```

4. **Executar servidor** (cria tabelas automaticamente em dev):
```bash
npm run dev
```

5. **Popular rotas e permissões**:
```bash
npx ts-node src/scripts/populateRoutes.ts
```

## 📦 Dependências Principais

- `express` - Framework web
- `typeorm` - ORM
- `pg` - Driver PostgreSQL
- `jsonwebtoken` - JWT
- `bcryptjs` - Hash de senhas
- `@google/genai` - Gemini AI
- `cors` - CORS middleware
- `dotenv` - Variáveis de ambiente

## 🔄 Próximos Passos

1. **Migrar frontend** para usar a API ao invés de localStorage
2. **Adicionar validação** com class-validator
3. **Implementar testes** unitários e de integração
4. **Adicionar rate limiting**
5. **Implementar upload de arquivos** (imagens, PDFs)
6. **Adicionar paginação** nas listagens
7. **Implementar cache** (Redis) para performance
8. **Adicionar logs** estruturados
9. **Configurar CI/CD**

## 📝 Notas Importantes

- O sistema usa `synchronize: true` apenas em **desenvolvimento**
- Em **produção**, desative `synchronize` e use migrations
- As senhas são **hasheadas** antes de salvar
- O JWT é **verificado** em todas as rotas protegidas
- O sistema de permissões é **flexível** e permite adicionar novas rotas facilmente

## 🎯 Impacto das Alterações

### Frontend
O frontend precisará ser atualizado para:
- Fazer chamadas HTTP para a API ao invés de usar localStorage
- Incluir token JWT no header `Authorization: Bearer <token>`
- Tratar respostas da API (sucesso/erro)

### Banco de Dados
- Todas as tabelas são criadas automaticamente em desenvolvimento
- Dados mockados do localStorage precisarão ser migrados ou recriados
- Sistema de rotas e permissões está pronto para uso

### Segurança
- Autenticação implementada
- Senhas protegidas com hash
- Permissões por role
- CORS configurável

---

**Data**: $(date)
**Versão**: 1.0.0
**Status**: ✅ Completo

