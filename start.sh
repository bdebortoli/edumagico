#!/bin/bash

echo "🚀 Iniciando EduMágico..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar PostgreSQL
echo -e "${YELLOW}📦 Verificando PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"
    else
        echo -e "${RED}❌ PostgreSQL não está rodando${NC}"
        echo "   Inicie com: brew services start postgresql@15"
        echo "   Ou use Docker: docker-compose up -d"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL não encontrado. Usando Docker...${NC}"
    if command -v docker &> /dev/null; then
        docker-compose up -d
        sleep 3
    else
        echo -e "${RED}❌ PostgreSQL não encontrado e Docker não está disponível${NC}"
        echo "   Instale PostgreSQL ou Docker para continuar"
        exit 1
    fi
fi

# Criar banco se não existir
echo -e "${YELLOW}📊 Verificando banco de dados...${NC}"
PGPASSWORD=postgres psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw edumagico
if [ $? -ne 0 ]; then
    echo "   Criando banco de dados..."
    PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE edumagico;" 2>/dev/null
    echo -e "${GREEN}✅ Banco criado${NC}"
else
    echo -e "${GREEN}✅ Banco já existe${NC}"
fi

# Verificar .env do backend
if [ ! -f server/.env ]; then
    echo -e "${YELLOW}📝 Criando .env do backend...${NC}"
    cat > server/.env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=edumagico
JWT_SECRET=edumagico-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGIN=http://localhost:3000
EOF
fi

# Popular rotas
echo -e "${YELLOW}🔐 Populando rotas e permissões...${NC}"
cd server
if [ ! -f edumagico.db ] && [ -f src/scripts/populateRoutes.ts ]; then
    npx ts-node src/scripts/populateRoutes.ts 2>/dev/null || echo "   (Pode ignorar erros se já foi populado)"
fi

# Iniciar backend
echo -e "${GREEN}🎯 Iniciando backend na porta 3001...${NC}"
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 5

# Verificar se backend está rodando
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend rodando (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend não iniciou corretamente${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar frontend
echo -e "${GREEN}🎨 Iniciando frontend na porta 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Plataforma iniciada com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "🔧 Backend:  ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "Para parar: kill $BACKEND_PID $FRONTEND_PID"
echo ""

