# Discord Music Bot

Um bot de música para Discord que reproduz áudios do YouTube com uma interface simples e intuitiva.

## 🚀 Funcionalidades

- ▶️ Reproduzir músicas do YouTube
- ⏭️ Pular músicas
- ⏹️ Parar reprodução
- 📋 Visualizar fila de músicas
- 🎵 Interface com embeds bonitos
- 🔄 Reprodução automática da próxima música

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- Conta no Discord
- Servidor Discord com permissões para adicionar bots

## 🛠️ Instalação

1. **Clone ou baixe este projeto**
   ```bash
   git clone <url-do-repositorio>
   cd discord-music-bot
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o token do bot**
   - Copie o arquivo `env.example` para `.env`
   ```bash
   cp env.example .env
   ```
   - Edite o arquivo `.env` e adicione seu token do Discord:
   ```
   DISCORD_BOT_TOKEN=seu_token_aqui
   ```

## 🤖 Como criar um bot no Discord

1. Acesse o [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications)
2. Clique em "New Application" e dê um nome ao seu bot
3. Vá para a aba "Bot" no menu lateral
4. Clique em "Add Bot"
5. Copie o token do bot (mantenha-o seguro!)
6. Na aba "OAuth2" > "URL Generator":
   - Selecione "bot" em Scopes
   - Selecione as permissões: "Send Messages", "Connect", "Speak", "Read Message History"
   - Copie a URL gerada e use-a para adicionar o bot ao seu servidor

## 🎮 Comandos

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `!play <link>` | Toca uma música do YouTube | `!play https://youtube.com/watch?v=...` |
| `!play <nome>` | Pesquisa e toca uma música automaticamente | `!play evanescence bring me to life` |
| `!search <nome>` | Pesquisa músicas e mostra opções | `!search bohemian rhapsody` |
| `!play <número>` | Escolhe uma música da pesquisa anterior | `!play 3` |
| `!skip` | Pula a música atual | `!skip` |
| `!stop` | Para a música e limpa a fila | `!stop` |
| `!loop` | Ativa/desativa o loop da fila | `!loop` |
| `!queue` | Mostra a fila de músicas | `!queue` |
| `!help` | Mostra os comandos disponíveis | `!help` |

## 🚀 Executando o bot

### 🖥️ **Execução Local:**
```bash
npm start
```

### ☁️ **Execução no Replit:**

1. **Importe o projeto no Replit:**
   - Vá para [replit.com](https://replit.com)
   - Clique em "Create Repl"
   - Escolha "Import from GitHub"
   - Cole a URL do seu repositório

2. **Configure automaticamente:**
   ```bash
   ./setup-replit.sh
   ```

3. **Configure o token:**
   - Edite o arquivo `.env`
   - Adicione seu token do Discord

4. **Execute o bot:**
   ```bash
   npm start
   ```

### 🌐 **Deploy no Replit (Always On):**

Para manter o bot online 24/7 no Replit:

1. **Configure Always On:**
   - No Replit, vá para "Secrets" (🔒)
   - Adicione sua variável `DISCORD_BOT_TOKEN`
   - Ative "Always On" no plano do Replit

2. **Configuração automática:**
   - O Replit executará automaticamente o script de setup
   - Baixará yt-dlp e instalará dependências
   - Bot ficará online continuamente

Ou para desenvolvimento:

```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
discord-music-bot/
├── index.js          # Arquivo principal do bot
├── package.json      # Dependências e scripts
├── env.example       # Exemplo de configuração
├── .env              # Suas configurações (criar manualmente)
└── README.md         # Este arquivo
```

## 🔧 Dependências

- **discord.js**: Biblioteca principal para interagir com a API do Discord
- **@discordjs/voice**: Para funcionalidade de áudio/voz
- **ytdl-core**: Para baixar áudio do YouTube
- **ffmpeg-static**: Binários do FFmpeg para processamento de áudio
- **dotenv**: Para gerenciar variáveis de ambiente

## ⚠️ Problemas Comuns

### Bot não consegue conectar ao canal de voz
- Verifique se o bot tem as permissões "Connect" e "Speak"
- Certifique-se de que você está em um canal de voz

### Erro ao reproduzir música
- Verifique se o link do YouTube é válido
- Alguns vídeos podem ter restrições de região

### Bot não responde aos comandos
- Verifique se o token está correto no arquivo `.env`
- Certifique-se de que o bot está online no seu servidor

## 🎯 Funcionalidades Implementadas

- ✅ Controle de volume
- ✅ Loop de música
- ✅ Pesquisa por nome (sem link)
- ✅ Interface com embeds bonitos
- ✅ Reprodução automática da próxima música
- ✅ **Streaming em tempo real** - baixa e toca simultaneamente
- ✅ **Cache inteligente** para músicas populares
- ✅ **Início instantâneo** - toca em menos de 3 segundos

## 🎯 Funcionalidades Futuras

- [ ] Playlists
- [ ] Comandos de slash (/) do Discord
- [ ] Controle de volume por comando

## 📝 Licença

Este projeto está sob a licença ISC.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

**Nota**: Este bot é para fins educacionais. Certifique-se de respeitar os termos de uso do YouTube e do Discord.
