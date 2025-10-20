#!/bin/bash

# Script de setup para Discord Music Bot no Replit
# Execute este script após clonar o repositório no Replit

echo "🎵 Configurando Discord Music Bot para Replit..."

# Verificar se estamos no Replit
if [ -z "$REPL_ID" ]; then
    echo "⚠️ Este script é específico para o Replit"
    echo "💡 Execute no Replit para configuração automática"
fi

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update

# Instalar dependências do sistema
echo "🔧 Instalando dependências do sistema..."
apt install -y ffmpeg python3 python3-pip curl

# Baixar yt-dlp se não existir
if [ ! -f "yt-dlp" ]; then
    echo "📥 Baixando yt-dlp..."
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
    chmod +x yt-dlp
    echo "✅ yt-dlp baixado e configurado"
else
    echo "✅ yt-dlp já existe"
fi

# Instalar dependências do Node.js
echo "📦 Instalando dependências do Node.js..."
npm install

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo "⚠️ Arquivo .env não encontrado!"
    echo "📝 Copiando env.example para .env..."
    cp env.example .env
    echo "💡 IMPORTANTE: Edite o arquivo .env e adicione seu token do Discord!"
    echo "🔑 Token: https://discord.com/developers/applications"
else
    echo "✅ Arquivo .env encontrado"
fi

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p /tmp/audio-cache

# Verificar permissões
echo "🔐 Verificando permissões..."
chmod +x yt-dlp
chmod +x index.js

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env e adicione seu token do Discord"
echo "2. Execute: npm start"
echo "3. Convide o bot para seu servidor Discord"
echo ""
echo "🎵 Bot pronto para tocar música!"
