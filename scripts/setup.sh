#!/bin/bash

# Script de setup inicial para desenvolvimento local

set -e

echo "🚀 Setup Inicial - AEE Digital API"
echo "======================================"
echo ""

# 1. Verificar se Docker está instalado
echo "✓ Verificando dependências..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale em https://docker.com"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado"
    exit 1
fi

echo "✅ Docker e Docker Compose ok"
echo ""

# 2. Copiar .env se não existir
echo "📝 Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    cp .env.local .env
    echo "✅ Arquivo .env criado (baseado em .env.local)"
else
    echo "⚠️  .env já existe, pulando"
fi
echo ""

# 3. Instalar dependências npm se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências npm..."
    npm install
    echo "✅ Dependências instaladas"
else
    echo "✅ node_modules já existe"
fi
echo ""

# 4. Construir aplicação
echo "🔨 Building aplicação..."
npm run build
echo "✅ Build concluído"
echo ""

# 5. Iniciar Docker Compose
echo "🐳 Iniciando Docker container..."
docker-compose up -d
echo "✅ Container iniciado"
echo ""

# Success message
echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "📍 Seus endpoints locais:"
echo "   - API NestJS:      http://localhost:5001"
echo "   - MongoDB:         Produção (aee.pvgzm2s.mongodb.net)"
echo "   - Debug:           localhost:9229"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Verifique se a API está rodando: curl http://localhost:5001"
echo "   2. Configure seu frontend para apontar a: http://localhost:5001"
echo "   3. Use VSCode com F5 para debugar (porta 9229)"
echo ""
echo "📚 Para mais detalhes: cat DEBUG_LOCAL.md"
echo ""

