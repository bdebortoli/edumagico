#!/bin/bash

echo "🚀 Iniciando EduMágico Backend..."

# Verifica se o .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado. Criando..."
    cat > .env << 'EOF'
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=edumagico

# JWT
JWT_SECRET=edumagico-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# CORS
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Arquivo .env criado"
fi

# Tenta criar o banco de dados (pode falhar se já existir, mas não é problema)
echo "📦 Verificando banco de dados..."
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE edumagico;" 2>/dev/null || echo "Banco de dados já existe ou PostgreSQL não está rodando"

# Instala dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
fi

# Inicia o servidor
echo "🎯 Iniciando servidor na porta 3001..."
npm run dev

