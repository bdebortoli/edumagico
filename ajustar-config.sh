#!/bin/bash

# Script para ajustar configuração do EduMágico
# Move a chave do Gemini do frontend para o backend

echo "🔧 Ajustando configuração do EduMágico..."
echo ""

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "❌ Arquivo .env.local não encontrado!"
    exit 1
fi

# Extrair chave do Gemini do .env.local
GEMINI_KEY=$(grep "GEMINI_API_KEY" .env.local | cut -d '=' -f2)

if [ -z "$GEMINI_KEY" ]; then
    echo "⚠️  Chave do Gemini não encontrada no .env.local"
    echo "   Você precisa adicionar manualmente no server/.env"
else
    echo "✅ Chave do Gemini encontrada: ${GEMINI_KEY:0:20}..."
    
    # Atualizar server/.env
    if [ -f "server/.env" ]; then
        # Backup do arquivo original
        cp server/.env server/.env.backup
        
        # Atualizar GEMINI_API_KEY
        if grep -q "GEMINI_API_KEY" server/.env; then
            # Substituir linha existente
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|" server/.env
            else
                # Linux
                sed -i "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|" server/.env
            fi
            echo "✅ Chave do Gemini atualizada no server/.env"
        else
            # Adicionar linha se não existir
            echo "" >> server/.env
            echo "GEMINI_API_KEY=$GEMINI_KEY" >> server/.env
            echo "✅ Chave do Gemini adicionada ao server/.env"
        fi
    else
        echo "❌ Arquivo server/.env não encontrado!"
        exit 1
    fi
fi

# Remover GEMINI_API_KEY do .env.local
if grep -q "GEMINI_API_KEY" .env.local; then
    # Backup do arquivo original
    cp .env.local .env.local.backup
    
    # Remover linha (compatível com macOS e Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' '/^GEMINI_API_KEY=/d' .env.local
    else
        # Linux
        sed -i '/^GEMINI_API_KEY=/d' .env.local
    fi
    
    echo "✅ Chave do Gemini removida do .env.local (não é mais necessária no frontend)"
fi

# Verificar VITE_API_URL
if ! grep -q "VITE_API_URL" .env.local; then
    echo ""
    echo "⚠️  VITE_API_URL não encontrado no .env.local"
    echo "   Adicionando configuração padrão..."
    
    # Adicionar VITE_API_URL
    echo "" >> .env.local
    echo "# URL da API do Backend" >> .env.local
    echo "# Para desenvolvimento local, use: http://localhost:3001/api" >> .env.local
    echo "# Para produção, use: https://seu-backend.railway.app/api" >> .env.local
    echo "VITE_API_URL=http://localhost:3001/api" >> .env.local
    
    echo "✅ VITE_API_URL adicionado ao .env.local"
fi

echo ""
echo "✅ Configuração ajustada com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   ✅ Chave do Gemini movida para server/.env"
echo "   ✅ Chave do Gemini removida do .env.local"
echo "   ✅ VITE_API_URL mantido no .env.local"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Reinicie o backend: cd server && npm run dev"
echo "   2. Reinicie o frontend: npm run dev"
echo "   3. Teste a geração de conteúdo"
echo ""

