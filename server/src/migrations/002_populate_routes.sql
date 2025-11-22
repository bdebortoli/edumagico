-- Migration: Populate Routes and Permissions
-- This script populates all routes and their permissions

-- Insert Routes (starting from ID 1, incrementing)
INSERT INTO rotas (path, method, description) VALUES
('/api/auth/register', 'POST', 'Registrar novo usuário'),
('/api/auth/login', 'POST', 'Fazer login'),
('/api/auth/me', 'GET', 'Obter usuário atual'),

('/api/users/profile', 'GET', 'Obter perfil do usuário'),
('/api/users/profile', 'PUT', 'Atualizar perfil do usuário'),
('/api/users/subscription', 'PUT', 'Atualizar assinatura'),

('/api/content', 'GET', 'Listar conteúdo do usuário'),
('/api/content/:id', 'GET', 'Obter conteúdo por ID'),
('/api/content', 'POST', 'Criar novo conteúdo'),
('/api/content/:id', 'PUT', 'Atualizar conteúdo'),
('/api/content/:id', 'DELETE', 'Deletar conteúdo'),
('/api/content/generate', 'POST', 'Gerar conteúdo com IA'),
('/api/content/chat', 'POST', 'Chat para criação'),

('/api/marketplace', 'GET', 'Listar conteúdo do marketplace'),
('/api/marketplace/:id', 'GET', 'Obter item do marketplace'),
('/api/marketplace/:id/purchase', 'POST', 'Comprar conteúdo'),

('/api/family/children', 'GET', 'Listar filhos'),
('/api/family/children', 'POST', 'Criar perfil de filho'),
('/api/family/children/:id', 'PUT', 'Atualizar perfil de filho'),
('/api/family/children/:id', 'DELETE', 'Deletar perfil de filho'),

('/api/analytics/activity', 'POST', 'Registrar conclusão de atividade'),
('/api/analytics/history', 'GET', 'Obter histórico de atividades'),
('/api/analytics/performance', 'GET', 'Obter desempenho (pais)'),
('/api/analytics/financial', 'GET', 'Obter dados financeiros (professores)')
ON CONFLICT (path, method) DO NOTHING;

-- Insert Route Permissions
-- Get the route IDs (assuming they start from 1)
-- Auth routes - everyone can access
INSERT INTO rotas_permissões (rota_id, role, allowed) VALUES
(1, 'parent', TRUE),
(1, 'teacher', TRUE),
(2, 'parent', TRUE),
(2, 'teacher', TRUE),
(3, 'parent', TRUE),
(3, 'teacher', TRUE)
ON CONFLICT (rota_id, role) DO UPDATE SET allowed = EXCLUDED.allowed;

-- User routes - authenticated users
INSERT INTO rotas_permissões (rota_id, role, allowed) VALUES
(4, 'parent', TRUE),
(4, 'teacher', TRUE),
(5, 'parent', TRUE),
(5, 'teacher', TRUE),
(6, 'parent', TRUE),
(6, 'teacher', TRUE)
ON CONFLICT (rota_id, role) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Content routes - premium or teacher
INSERT INTO rotas_permissões (rota_id, role, allowed) VALUES
(7, 'parent', TRUE),
(7, 'teacher', TRUE),
(8, 'parent', TRUE),
(8, 'teacher', TRUE),
(9, 'parent', TRUE), -- Premium check in route handler
(9, 'teacher', TRUE),
(10, 'parent', TRUE),
(10, 'teacher', TRUE),
(11, 'parent', TRUE),
(11, 'teacher', TRUE),
(12, 'parent', TRUE), -- Premium check in route handler
(12, 'teacher', TRUE),
(13, 'parent', TRUE), -- Premium check in route handler
(13, 'teacher', TRUE)
ON CONFLICT (rota_id, role) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Marketplace routes - authenticated users
INSERT INTO rotas_permissões (rota_id, role, allowed) VALUES
(14, 'parent', TRUE),
(14, 'teacher', TRUE),
(15, 'parent', TRUE),
(15, 'teacher', TRUE),
(16, 'parent', TRUE),
(16, 'teacher', FALSE) -- Teachers can't buy their own content
ON CONFLICT (rota_id, role) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Family routes - parents only
INSERT INTO rotas_permissões (rota_id, role, allowed) VALUES
(17, 'parent', TRUE),
(17, 'teacher', FALSE),
(18, 'parent', TRUE),
(18, 'teacher', FALSE),
(19, 'parent', TRUE),
(19, 'teacher', FALSE),
(20, 'parent', TRUE),
(20, 'teacher', FALSE)
ON CONFLICT (rota_id, role) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Analytics routes
INSERT INTO rotas_permissões (rota_id, role, allowed) VALUES
(21, 'parent', TRUE),
(21, 'teacher', TRUE),
(22, 'parent', TRUE),
(22, 'teacher', TRUE),
(23, 'parent', TRUE),
(23, 'teacher', FALSE),
(24, 'parent', FALSE),
(24, 'teacher', TRUE)
ON CONFLICT (rota_id, role) DO UPDATE SET allowed = EXCLUDED.allowed;

