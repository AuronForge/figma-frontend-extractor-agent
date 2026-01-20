#!/bin/bash

# Script para verificar configuração de deploy no Vercel via GitHub Actions
# Uso: ./check-vercel-setup.sh

echo "======================================"
echo "🔍 Verificação de Setup do Vercel"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se o arquivo .vercel/project.json existe
if [ -f ".vercel/project.json" ]; then
    echo -e "${GREEN}✓${NC} Arquivo .vercel/project.json encontrado"

    # Extrai os IDs
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*' | cut -d'"' -f4)

    echo ""
    echo "📋 Informações do Projeto:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Nome do Projeto: $PROJECT_NAME"
    echo ""
    echo -e "${YELLOW}VERCEL_ORG_ID:${NC}"
    echo "$ORG_ID"
    echo ""
    echo -e "${YELLOW}VERCEL_PROJECT_ID:${NC}"
    echo "$PROJECT_ID"
    echo ""
else
    echo -e "${RED}✗${NC} Arquivo .vercel/project.json não encontrado"
    echo ""
    echo "Execute o seguinte comando para criar:"
    echo "  npx vercel link"
    echo ""
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Próximos Passos:"
echo ""
echo "1. Crie um token no Vercel:"
echo "   https://vercel.com/account/tokens"
echo ""
echo "2. Adicione os seguintes secrets no GitHub:"
echo "   https://github.com/[SEU-USUARIO]/figma-frontend-extractor-agent/settings/secrets/actions"
echo ""
echo "   • VERCEL_TOKEN = [seu token do Vercel]"
echo "   • VERCEL_ORG_ID = $ORG_ID"
echo "   • VERCEL_PROJECT_ID = $PROJECT_ID"
echo ""
echo "3. Faça um commit para testar o deploy automático"
echo ""
echo -e "${GREEN}✓${NC} Configuração verificada com sucesso!"
echo ""
