#!/bin/bash

# Script para atualizar a chave do Gemini no backend

echo "🔐 Atualizar Chave do Gemini"
echo ""
echo "⚠️  IMPORTANTE: Você precisa ter gerado uma nova chave no Google AI Studio"
echo "   Acesse: https://aistudio.google.com/apikey"
echo ""

# Verificar se nova chave foi fornecida
if [ -z "$1" ]; then
    echo "❌ Uso: ./ATUALIZAR_CHAVE_GEMINI.sh SUA_NOVA_CHAVE_AQUI"
    echo ""
    echo "Exemplo:"
    echo "  ./ATUALIZAR_CHAVE_GEMINI.sh AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

NOVA_CHAVE="$1"

# Verificar se arquivo existe
if [ ! -f "server/.env" ]; then
    echo "❌ Arquivo server/.env não encontrado!"
    exit 1
fi

# Fazer backup
cp server/.env server/.env.backup
echo "✅ Backup criado: server/.env.backup"

# Atualizar chave
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=$NOVA_CHAVE|" server/.env
else
    # Linux
    sed -i "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=$NOVA_CHAVE|" server/.env
fi

echo "✅ Chave atualizada no server/.env"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Reinicie o backend: cd server && npm run dev"
echo "   2. Teste a geração de conteúdo"
echo ""

