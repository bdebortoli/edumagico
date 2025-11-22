                                                                                                                                                                                                                                # 📊 DOCUMENTAÇÃO EXECUTIVA - EduMágico

## 1. VISÃO GERAç DO PROJETO

**EduMágico** é uma plataforma educacional interativa que utiliza Inteligência Artificial (Google Gemini) para permitir que pais e professores criem, personalizem e compartilhem conteúdos educativos adaptados às necessidades específicas de cada criança.

### Missão
Democratizar a criação de conteúdo educacional de qualidade através de IA, permitindo que educadores e responsáveis criem experiências de aprendizado personalizadas sem necessidade de conhecimento técnico avançado.

### Público-Alvo
- **Responsáveis**: Pais que desejam criar atividades personalizadas para seus filhos
- **Professores**: Educadores que criam e monetizam conteúdo educacional premium
- **Crianças**: Alunos de 4 a 18 anos (Pré-escola ao Ensino Médio)

---

## 2. ARQUITETURA TECNOLÓGICA

### 2.1 Stack Tecnológico

**Frontend**
- React 19.2.0 + TypeScript
- Vite (build tool)
- Lucide React (ícones)
- Canvas Confetti (gamificação)
- Tailwind CSS (estilização)

**Backend**
- Node.js + Express
- TypeScript
- TypeORM (ORM)
- PostgreSQL (banco de dados)
- JWT (autenticação)
- bcryptjs (segurança)

**Inteligência Artificial**
- Google Gemini AI (@google/genai)
- Geração de conteúdo estruturado
- Refinamento conversacional

**APIs Externas**
- ViaCEP (busca de endereços)
- Google Gemini API

### 2.2 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  - Landing Page                                          │
│  - Dashboard (Pais/Professores)                          │
│  - Creator Studio (Geração com IA)                       │
│  - Interactive Player (Quiz/Story/Summary)               │
│  - Marketplace                                           │
│  - Analytics & Família                                   │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API (JWT Auth)
┌──────────────────▼──────────────────────────────────────┐
│                  BACKEND (Express + TypeORM)             │
│  - Autenticação JWT                                      │
│  - Sistema de Rotas e Permissões                         │
│  - CRUD de Usuários, Conteúdo, Perfis                    │
│  - Integração Gemini AI                                  │
│  - Sistema de Marketplace                                │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              POSTGRESQL DATABASE                         │
│  - users, content_items, child_profiles                  │
│  - activity_history, purchases                           │
│  - rotas, rotas_permissões                              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. FUNCIONALIDADES PRINCIPAIS

### 3.1 Estúdio de Criação com IA

**Modos de Criação:**
- **Modo Manual**: Formulário guiado com IA
- **Modo Chat**: Conversação natural com IA
- **Modo Edição**: Editar conteúdo existente

**Tipos de Conteúdo:**
1. **Histórias Interativas** - Narrativas educativas com capítulos
2. **Quiz Gamificado** - Perguntas com feedback imediato e pontuação
3. **Resumos Educativos** - Explicações simplificadas de tópicos complexos

**Recursos Avançados:**
- ✅ Upload de PDFs e imagens (fidelidade ao material fonte)
- ✅ Alinhamento automático com BNCC (Base Nacional Comum Curricular)
- ✅ Sistema de refinamento pós-geração (8 opções rápidas + chat)
- ✅ Faixa etária personalizada (6-18 anos)
- ✅ Seleção de série escolar
- ✅ Tags e palavras-chave
- ✅ Recursos multimídia (vídeo/áudio)

### 3.2 Sistema de Refinamento Inteligente

**Opções Rápidas:**
- Mais Completo
- Mais Lúdico
- Adicionar Exemplos Práticos
- Simplificar
- Mais Desafiador
- Mais Visual
- Adicionar Atividades
- Mais Engajante

**Modo Conversacional:**
- Chat com IA para melhorias específicas
- Histórico de refinamentos
- Contexto preservado

### 3.3 Player Interativo

**Quiz Player:**
- Perguntas múltipla escolha
- Feedback imediato (correto/incorreto)
- Explicações educativas
- Sistema de pontuação
- Confetes e efeitos sonoros
- Tela de resultados final

**Story Player:**
- Navegação por capítulos
- Suporte a imagens
- Progresso visual
- Leitura fluida

**Summary Player:**
- Pontos-chave destacados
- Explicação simplificada
- Curiosidades extras

### 3.4 Marketplace de Conteúdo

**Funcionalidades:**
- Listagem de conteúdo premium criado por professores
- Filtros avançados (matéria, série, professor)
- Sistema de compra com moedas virtuais
- Tracking de vendas e popularidade
- Preview de conteúdo antes da compra

**Modelo de Monetização:**
- Professores definem preço em "Coins"
- Plataforma cobra 15% de taxa
- Sistema de pagamentos simulado (preparado para integração real)

### 3.5 Gestão de Perfis

**Perfil de Responsável:**
- Dados pessoais completos (CPF, nascimento, telefone)
- Endereço com busca automática por CEP (ViaCEP)
- Gerenciamento de métodos de pagamento
- Gestão de múltiplos perfis de filhos

**Perfil de Professor:**
- Dados pessoais e profissionais
- Biografia e matérias lecionadas
- Dados bancários (PIX, conta corrente/poupança)
- Dashboard financeiro com analytics

**Perfil de Criança:**
- Nome, idade, série, escola
- Avatar personalizado
- Sistema de pontos e gamificação
- Estado/cidade (para conteúdo regionalizado)

### 3.6 Analytics e Acompanhamento

**Para Responsáveis:**
- Histórico de atividades completo
- Pontuação por matéria
- Tempo dedicado ao aprendizado
- Evolução ao longo do tempo
- Recomendações personalizadas

**Para Professores:**
- Dashboard de vendas
- Gráficos de desempenho (mensal)
- Total de ganhos (bruto/líquido)
- Valores pagos vs pendentes
- Conteúdos mais vendidos

### 3.7 Sistema de Família

**Funcionalidades:**
- Adicionar múltiplos perfis de filhos
- Limites por plano (Basic: 2, Premium: 5)
- Troca rápida entre perfis
- Filtragem de conteúdo por perfil ativo
- Controle individual de progresso

### 3.8 Sistema de Assinaturas

**Planos Disponíveis:**

| Recurso | Basic (Gratuito) | Premium |
|---------|------------------|---------|
| Criar Conteúdo com IA | ❌ | ✅ |
| Perfis de Filhos | 2 | 5 |
| Biblioteca Gratuita | ✅ | ✅ |
| Marketplace | Acesso limitado | Acesso completo |
| Refinamento com IA | ❌ | ✅ |
| Analytics Avançado | ❌ | ✅ |

**Ciclos de Pagamento:**
- Mensal
- Anual (com desconto)

---

## 4. SEGURANÇA E PERMISSÕES

### 4.1 Autenticação
- JWT (JSON Web Tokens) com expiração de 7 dias
- Senhas criptografadas com bcryptjs (10 rounds)
- Tokens enviados via header Authorization

### 4.2 Sistema de Rotas e Permissões

**Tabelas de Controle:**
- `rotas`: Cadastro de todas as rotas da API
- `rotas_permissões`: Permissões por role (parent/teacher/admin)

**Middleware:**
- `authenticate`: Verifica JWT em rotas protegidas
- `checkRoutePermission`: Valida permissões por role

**Roles:**
- **parent**: Responsáveis (acesso a família, analytics pessoal)
- **teacher**: Professores (acesso a criação, analytics financeiro)
- **admin**: Administrador (futuro - acesso total)

---

## 5. BANCO DE DADOS

### 5.1 Estrutura de Tabelas

**users**
- Dados pessoais, role, plano, moedas
- Endereço completo, telefone, CPF
- Perfil específico (teacher/parent)
- Subscription details

**content_items**
- Título, descrição, tipo, autor
- Matéria, série, faixa etária
- Keywords, recursos multimídia
- Preço, vendas, dados JSONB

**child_profiles**
- Nome, idade, série, escola
- Localização (cidade/estado)
- Pontos, avatar
- Vínculo com responsável

**activity_history**
- Registro de atividades completadas
- Score, data de conclusão
- Vínculo com criança e conteúdo

**purchases**
- Compras do marketplace
- Preço, moedas usadas, status
- Data da transação

**rotas / rotas_permissões**
- Sistema de controle de acesso
- Paths, métodos HTTP
- Permissões por role

---

## 6. INTEGRAÇÕES

### 6.1 Google Gemini AI

**Uso:**
- Geração de conteúdo educacional estruturado
- Refinamento conversacional
- Análise de PDFs e imagens
- Alinhamento com BNCC

**Schemas Estruturados:**
- StorySchema (capítulos)
- QuizSchema (perguntas + explicações)
- SummarySchema (pontos-chave + curiosidades)

**Comportamento:**
- **Com arquivos**: Mantém fidelidade ao material enviado
- **Sem arquivos**: Usa conhecimento da BNCC para a série

### 6.2 ViaCEP

**Uso:**
- Busca automática de endereço por CEP
- Preenchimento de rua, cidade, estado
- Validação de CEP brasileiro
- Formatação automática (00000-000)

---

## 7. ENDPOINTS DA API

### Autenticação (`/api/auth`)
- `POST /register` - Registrar usuário
- `POST /login` - Login (retorna JWT)
- `GET /me` - Dados do usuário atual

### Usuários (`/api/users`)
- `GET /profile` - Obter perfil
- `PUT /profile` - Atualizar perfil
- `PUT /subscription` - Atualizar assinatura

### Conteúdo (`/api/content`)
- `GET /` - Listar conteúdo (com filtros)
- `GET /:id` - Obter por ID
- `POST /` - Criar conteúdo
- `PUT /:id` - Atualizar conteúdo
- `DELETE /:id` - Deletar conteúdo
- `POST /generate` - Gerar com IA
- `POST /chat` - Chat para criação

### Marketplace (`/api/marketplace`)
- `GET /` - Listar conteúdo premium
- `GET /:id` - Detalhes do item
- `POST /:id/purchase` - Comprar conteúdo

### Família (`/api/family`)
- `GET /children` - Listar filhos
- `POST /children` - Criar perfil
- `PUT /children/:id` - Atualizar perfil
- `DELETE /children/:id` - Deletar perfil

### Analytics (`/api/analytics`)
- `POST /activity` - Registrar atividade
- `GET /history` - Histórico
- `GET /performance` - Desempenho (pais)
- `GET /financial` - Financeiro (professores)

---

## 8. COMPONENTES FRONTEND

### Principais Componentes

1. **LandingPage** - Página inicial com login
2. **CreatorStudio** - Estúdio de criação com IA
3. **ContentRefinement** - Modal de refinamento
4. **InteractivePlayer** - Player de conteúdo (Quiz/Story/Summary)
5. **TeacherDashboard** - Painel do professor
6. **ParentProfile** - Perfil do responsável
7. **TeacherProfile** - Perfil do professor
8. **FamilyManager** - Gestão de filhos
9. **PerformanceAnalytics** - Analytics de desempenho
10. **MarketplaceModal** - Modal de compra
11. **SubscriptionPage** - Página de assinaturas

---

## 9. STATUS ATUAL

### ✅ Funcionalidades Implementadas

**Backend:**
- ✅ API RESTful completa
- ✅ Autenticação JWT
- ✅ Sistema de rotas e permissões
- ✅ CRUD completo (usuários, conteúdo, perfis)
- ✅ Integração Gemini AI
- ✅ Sistema de marketplace
- ✅ Analytics e histórico

**Frontend:**
- ✅ Interface completa e responsiva
- ✅ Estúdio de criação com IA
- ✅ Sistema de refinamento
- ✅ Player interativo (3 tipos)
- ✅ Dashboards (pais e professores)
- ✅ CRUD de perfis
- ✅ Busca automática de CEP
- ✅ Sistema de família
- ✅ Analytics visual

**Integração:**
- ✅ Google Gemini AI configurado
- ✅ ViaCEP integrado
- ✅ Banco de dados PostgreSQL
- ✅ Sistema de rotas populado

### 🚀 Servidores Ativos

- **PostgreSQL**: Porta 5432
- **Backend API**: Porta 3001
- **Frontend**: Porta 3000

---

## 10. PRÓXIMOS PASSOS RECOMENDADOS

### Curto Prazo
1. **Migrar frontend** para consumir API ao invés de localStorage
2. **Adicionar validação** com class-validator no backend
3. **Implementar paginação** nas listagens
4. **Adicionar upload real** de arquivos (AWS S3 ou similar)
5. **Configurar ambiente de produção** (desabilitar synchronize)

### Médio Prazo
6. **Implementar testes** unitários e de integração
7. **Adicionar rate limiting** para proteção da API
8. **Implementar cache** com Redis
9. **Sistema de notificações** (email/push)
10. **Integração de pagamento real** (Stripe/PagSeguro)

### Longo Prazo
11. **App mobile** (React Native)
12. **Sistema de recomendações** com ML
13. **Gamificação avançada** (badges, desafios)
14. **Conteúdo colaborativo** (co-autoria)
15. **Marketplace de templates** de atividades

---

## 11. DOCUMENTAÇÃO TÉCNICA DISPONÍVEL

### Documentos Existentes
- ✅ `DOCUMENTACAO_BACKEND.md` - Documentação completa do backend
- ✅ `DOCUMENTACAO_CRUD_PERFIS.md` - CRUD de perfis
- ✅ `DOCUMENTACAO_REFINAMENTO_BNCC.md` - Refinamento com IA
- ✅ `DOCUMENTACAO_BUSCA_CEP.md` - Integração ViaCEP
- ✅ `INICIO_RAPIDO.md` - Guia de início rápido
- ✅ `STATUS.md` - Status dos serviços
- ✅ `RODAR_LOCALMENTE.md` - Como rodar localmente
- ✅ `COMO_CONFIGURAR_GEMINI.md` - Configuração da API Gemini

---

## 12. DIFERENCIAIS COMPETITIVOS

1. **IA Contextualizada**: Geração alinhada com BNCC e materiais específicos
2. **Refinamento Inteligente**: 8 opções rápidas + chat conversacional
3. **Gamificação Completa**: Pontos, ranking, confetes, sons
4. **Marketplace Integrado**: Monetização para professores
5. **Multi-perfil**: Suporte a múltiplas crianças por conta
6. **Analytics Detalhado**: Acompanhamento individual de progresso
7. **Sem Código**: Criação de conteúdo sem conhecimento técnico
8. **Multiplataforma**: Web responsivo (preparado para mobile)

---

## 13. REQUISITOS TÉCNICOS

### Para Desenvolvimento
- Node.js 18+
- PostgreSQL 12+
- Chave API do Google Gemini
- 2GB RAM mínimo
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Para Produção
- Servidor com Node.js
- PostgreSQL (ou RDS na AWS)
- SSL/TLS (HTTPS)
- CDN para assets estáticos
- Backup automatizado do banco

---

## 14. CONCLUSÃO

O **EduMágico** é uma plataforma educacional completa e funcional que combina Inteligência Artificial com gamificação para criar experiências de aprendizado personalizadas. Com backend robusto, frontend intuitivo e integrações poderosas, a plataforma está preparada para escalar e atender milhares de usuários.

A arquitetura modular permite fácil extensão de funcionalidades, e o sistema de permissões garante segurança e controle de acesso adequados para diferentes tipos de usuários.

---

**Versão da Documentação**: 1.0.0  
**Data**: 19 de Novembro de 2025  
**Status**: ✅ Plataforma Operacional

