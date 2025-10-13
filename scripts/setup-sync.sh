#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Configurando sincronização com Apps Script...${NC}\n"

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Por favor, instale o Node.js primeiro.${NC}"
    exit 1
fi

# Instala dependências
echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install googleapis chokidar dotenv

# Cria arquivo de credenciais se não existir
if [ ! -f scripts/.env.apps-script ]; then
    echo -e "${BLUE}🔑 Configurando credenciais...${NC}"
    
    # Pede informações ao usuário
    echo -n "ID do projeto Apps Script (da URL): "
    read SCRIPT_ID
    
    echo -n "Email do service account: "
    read CLIENT_EMAIL
    
    echo "Cole a chave privada do service account (termine com Ctrl+D):"
    PRIVATE_KEY=$(cat)
    
    # Cria arquivo .env
    cat > scripts/.env.apps-script << EOF
APPS_SCRIPT_ID="$SCRIPT_ID"
GOOGLE_CLIENT_EMAIL="$CLIENT_EMAIL"
GOOGLE_PRIVATE_KEY="$PRIVATE_KEY"
WATCH_DELAY=2000
MAX_RETRIES=3
EOF
fi

# Adiciona script ao package.json
if ! grep -q '"sync-gas"' package.json; then
    echo -e "${BLUE}📝 Adicionando script ao package.json...${NC}"
    sed -i '/"scripts": {/a\    "sync-gas": "node scripts/sync-apps-script.js",' package.json
fi

# Cria .gitignore se não existir
if [ ! -f .gitignore ]; then
    echo -e "${BLUE}📝 Criando .gitignore...${NC}"
    echo "scripts/.env.apps-script" > .gitignore
else
    # Adiciona apenas se não existir
    if ! grep -q "scripts/.env.apps-script" .gitignore; then
        echo "scripts/.env.apps-script" >> .gitignore
    fi
fi

echo -e "\n${GREEN}✅ Configuração concluída!${NC}"
echo -e "\nPara iniciar a sincronização:"
echo -e "  ${BLUE}npm run sync-gas${NC}"
echo -e "\nO script irá monitorar mudanças no frontend e"
echo -e "sincronizar automaticamente com o Apps Script."