# 🚀 Configuração do Discord Music Bot no Replit

## 📋 Pré-requisitos

1. **Conta no Replit** - [replit.com](https://replit.com)
2. **Token do Discord Bot** - [discord.com/developers](https://discord.com/developers/applications)
3. **Servidor Discord** onde o bot será usado

## 🔧 Configuração Automática

### 1. **Importar Projeto no Replit:**

```bash
# Opção 1: Import from GitHub
1. Vá para replit.com
2. Clique em "Create Repl"
3. Escolha "Import from GitHub"
4. Cole a URL do seu repositório

# Opção 2: Upload Files
1. Crie um novo Repl
2. Faça upload dos arquivos do projeto
```

### 2. **Executar Setup Automático:**

```bash
./setup-replit.sh
```

Este script irá:
- ✅ Atualizar o sistema
- ✅ Instalar ffmpeg e python3
- ✅ Baixar yt-dlp
- ✅ Instalar dependências do Node.js
- ✅ Criar arquivo .env
- ✅ Configurar permissões

### 3. **Configurar Token do Discord:**

```bash
# Editar arquivo .env
DISCORD_BOT_TOKEN=seu_token_aqui
```

## 🌐 Deploy 24/7 (Always On)

### Para manter o bot online continuamente:

1. **Configurar Secrets:**
   - No Replit, vá para "Secrets" (🔒)
   - Adicione: `DISCORD_BOT_TOKEN` = `seu_token_do_discord`

2. **Ativar Always On:**
   - Upgrade para plano com "Always On"
   - O bot ficará online 24/7

3. **Configuração Automática:**
   - O Replit executará `.config/replit/run.sh` automaticamente
   - Baixará dependências se necessário
   - Iniciará o bot automaticamente

## 🎵 Comandos do Bot

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `!play <nome>` | Pesquisa e toca música | `!play evanescence bring me to life` |
| `!play <link>` | Toca música por URL | `!play https://youtube.com/...` |
| `!skip` | Pula música atual | `!skip` |
| `!stop` | Para a música | `!stop` |
| `!loop` | Ativa/desativa loop | `!loop` |
| `!queue` | Mostra fila de músicas | `!queue` |
| `!help` | Mostra comandos | `!help` |

## 🔍 Solução de Problemas

### Bot não inicia:
```bash
# Verificar dependências
npm install

# Verificar token
cat .env

# Verificar yt-dlp
./yt-dlp --version
```

### Erro de permissões:
```bash
chmod +x yt-dlp
chmod +x setup-replit.sh
```

### Erro de ffmpeg:
```bash
apt update && apt install -y ffmpeg
```

## 📊 Recursos do Bot

- ⚡ **Streaming em tempo real** - Baixa e toca simultaneamente
- 🧠 **Cache inteligente** - Músicas populares instantâneas
- 🎵 **Qualidade máxima** - Sempre melhor áudio
- 🔄 **Loop de música** - Repetir fila ou música
- 🎯 **Pesquisa por nome** - Sempre encontra a música
- 📱 **Interface limpa** - Sem spam no chat

## 🎉 Sucesso!

Se tudo foi configurado corretamente, você verá:

```
Bot de música está online!
Conectado como: SeuBot#1234
```

Agora é só usar `!play nome da música` no Discord! 🎵
