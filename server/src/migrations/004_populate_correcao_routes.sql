-- Migration: Adicionar rotas de correção discursiva (EduMagic IA v5.0)
-- Data: 2025-01-XX
-- Descrição: Cadastra rotas e permissões para o módulo de correção de respostas discursivas

-- Inserir rota de correção
INSERT INTO rotas (path, method, description, created_at, updated_at)
VALUES ('/api/correcao', 'POST', 'Corrigir resposta discursiva do aluno', NOW(), NOW())
ON CONFLICT (path, method) DO UPDATE
SET description = EXCLUDED.description, updated_at = NOW();

-- Obter ID da rota inserida
DO $$
DECLARE
    rota_correcao_id INTEGER;
BEGIN
    -- Obter ID da rota de correção
    SELECT id INTO rota_correcao_id
    FROM rotas
    WHERE path = '/api/correcao' AND method = 'POST';

    -- Inserir permissões para a rota de correção
    -- Pais e professores podem usar a correção
    INSERT INTO rotas_permissões (rota_id, role, allowed, created_at, updated_at)
    VALUES 
        (rota_correcao_id, 'parent', true, NOW(), NOW()),
        (rota_correcao_id, 'teacher', true, NOW(), NOW())
    ON CONFLICT (rota_id, role) DO UPDATE
    SET allowed = EXCLUDED.allowed, updated_at = NOW();

    RAISE NOTICE 'Rotas de correção cadastradas com sucesso. ID da rota: %', rota_correcao_id;
END $$;

