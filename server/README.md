# EduMágico - Backend API

Backend completo para a plataforma EduMágico, desenvolvido com Node.js, Express, TypeScript e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** + **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **TypeORM** - ORM para gerenciamento do banco
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Google Gemini AI** - Geração de conteúdo educacional

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- NPM ou Yarn

## 🔧 Instalação

1. Instale as dependências:
```bash
cd server
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=edumagico

JWT_SECRET=seu-jwt-secret-super-seguro
JWT_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development

GEMINI_API_KEY=sua-chave-gemini

CORS_ORIGIN=http://localhost:3000
```

3. Crie o banco de dados:
```sql
CREATE DATABASE edumagico;
```

4. Execute as migrations (o TypeORM criará as tabelas automaticamente em desenvolvimento):
```bash
npm run dev
```

5. Popule as rotas e permissões:
```bash
npx ts-node src/scripts/populateRoutes.ts
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3001`

## 📚 Estrutura do Projeto

```
server/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuração do TypeORM
│   ├── entities/                 # Entidades do banco de dados
│   │   ├── User.ts
│   │   ├── ContentItem.ts
│   │   ├── ChildProfile.ts
│   │   ├── ActivityHistory.ts
│   │   ├── Purchase.ts
│   │   ├── Route.ts
│   │   └── RoutePermission.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Autenticação JWT
│   │   └── routePermission.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts        # Autenticação
│   │   ├── user.routes.ts        # Usuários
│   │   ├── content.routes.ts     # Conteúdo
│   │   ├── marketplace.routes.ts # Marketplace
│   │   ├── family.routes.ts      # Família/Filhos
│   │   └── analytics.routes.ts    # Analytics
│   ├── services/
│   │   ├── auth.service.ts       # Serviços de autenticação
│   │   └── gemini.service.ts     # Integração Gemini AI
│   ├── migrations/               # Migrations SQL
│   ├── scripts/
│   │   └── populateRoutes.ts     # Script para popular rotas
│   └── index.ts                  # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

## 📡 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter usuário atual

### Usuários
- `GET /api/users/profile` - Obter perfil
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/subscription` - Atualizar assinatura

### Conteúdo
- `GET /api/content` - Listar conteúdo
- `GET /api/content/:id` - Obter conteúdo
- `POST /api/content` - Criar conteúdo
- `PUT /api/content/:id` - Atualizar conteúdo
- `DELETE /api/content/:id` - Deletar conteúdo
- `POST /api/content/generate` - Gerar conteúdo com IA
- `POST /api/content/chat` - Chat para criação

### Marketplace
- `GET /api/marketplace` - Listar marketplace
- `GET /api/marketplace/:id` - Obter item
- `POST /api/marketplace/:id/purchase` - Comprar conteúdo

### Família
- `GET /api/family/children` - Listar filhos
- `POST /api/family/children` - Criar perfil
- `PUT /api/family/children/:id` - Atualizar perfil
- `DELETE /api/family/children/:id` - Deletar perfil

### Analytics
- `POST /api/analytics/activity` - Registrar atividade
- `GET /api/analytics/history` - Histórico
- `GET /api/analytics/performance` - Desempenho (pais)
- `GET /api/analytics/financial` - Financeiro (professores)

## 🔒 Sistema de Rotas e Permissões

O sistema possui um controle de rotas e permissões baseado em roles:
- **parent** - Responsáveis
- **teacher** - Professores
- **admin** - Administradores

As rotas são cadastradas na tabela `rotas` e as permissões em `rotas_permissões`.

Para adicionar novas rotas, execute o script `populateRoutes.ts` ou adicione manualmente via SQL seguindo o padrão das migrations.

## 🗄️ Banco de Dados

### Tabelas Principais

- **users** - Usuários (pais e professores)
- **content_items** - Conteúdo educacional
- **child_profiles** - Perfis de filhos
- **activity_history** - Histórico de atividades
- **purchases** - Compras do marketplace
- **rotas** - Rotas da API
- **rotas_permissões** - Permissões por role

## 🧪 Testes

Em desenvolvimento. Adicionar testes unitários e de integração.

## 📝 Notas

- O sistema usa `synchronize: true` apenas em desenvolvimento. Em produção, use migrations.
- As senhas são hasheadas com bcrypt (10 rounds).
- O JWT expira em 7 dias por padrão (configurável via env).

## 🤝 Contribuindo

Siga os padrões de código existentes e mantenha a documentação atualizada.

