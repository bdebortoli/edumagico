#!/bin/bash

echo "🧪 Testando configuração do Gemini..."
echo ""

# Verificar se backend está rodando
echo "1. Verificando se backend está rodando..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Backend está rodando"
else
    echo "   ❌ Backend NÃO está rodando!"
    echo "   Execute: cd server && npm run dev"
    exit 1
fi

# Verificar chave no arquivo
echo ""
echo "2. Verificando chave no arquivo .env..."
if [ -f "server/.env" ] && grep -q "GEMINI_API_KEY=AIza" server/.env; then
    echo "   ✅ Chave encontrada no arquivo"
    KEY=$(grep "GEMINI_API_KEY" server/.env 2>/dev/null | cut -d '=' -f2)
    echo "   Chave: ${KEY:0:25}..."
else
    echo "   ❌ Chave NÃO encontrada no arquivo!"
    exit 1
fi

# Verificar se Node.js consegue carregar
echo ""
echo "3. Verificando se Node.js consegue carregar a chave..."
cd server
RESULT=$(node -e "require('dotenv').config(); console.log(process.env.GEMINI_API_KEY ? 'OK' : 'FALHOU')" 2>&1)
if [ "$RESULT" = "OK" ]; then
    echo "   ✅ Node.js consegue carregar a chave"
else
    echo "   ❌ Node.js NÃO consegue carregar a chave!"
    echo "   Resultado: $RESULT"
    exit 1
fi
cd ..

# Verificar frontend
echo ""
echo "4. Verificando configuração do frontend..."
if grep -q "VITE_API_URL" .env.local; then
    echo "   ✅ VITE_API_URL configurado"
    cat .env.local | grep "VITE_API_URL"
else
    echo "   ⚠️  VITE_API_URL não encontrado no .env.local"
fi

if grep -q "GEMINI_API_KEY" .env.local; then
    echo "   ⚠️  ATENÇÃO: GEMINI_API_KEY ainda está no .env.local (não deveria estar)"
else
    echo "   ✅ GEMINI_API_KEY não está no .env.local (correto!)"
fi

echo ""
echo "✅ Todas as verificações passaram!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "   2. Ou abra em aba anônima"
echo "   3. Acesse: http://localhost:3000"
echo "   4. Faça login e teste a geração de conteúdo"
echo ""

