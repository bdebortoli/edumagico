-- Migration: Initial Schema
-- This creates the basic tables for the application

-- Users table (already created by TypeORM, but keeping for reference)
-- CREATE TABLE IF NOT EXISTS users (...);

-- Content Items table
-- CREATE TABLE IF NOT EXISTS content_items (...);

-- Child Profiles table
-- CREATE TABLE IF NOT EXISTS child_profiles (...);

-- Activity History table
-- CREATE TABLE IF NOT EXISTS activity_history (...);

-- Purchases table
-- CREATE TABLE IF NOT EXISTS purchases (...);

-- Routes table
CREATE TABLE IF NOT EXISTS rotas (
    id SERIAL PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(path, method)
);

-- Route Permissions table
CREATE TABLE IF NOT EXISTS rotas_permissões (
    id SERIAL PRIMARY KEY,
    rota_id INTEGER NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'teacher', 'admin')),
    allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rota_id, role)
);

