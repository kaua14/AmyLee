require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const prefix = '!';
const queue = new Map();
const audioCache = new Map();

// Cache inteligente para músicas populares
const popularSongs = new Map([
    ['evanescence bring me to life', 'https://www.youtube.com/watch?v=3YxaaGgTQYM'],
    ['bohemian rhapsody', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'],
    ['imagine dragons thunder', 'https://www.youtube.com/watch?v=fKopy74weus'],
    ['queen', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'],
    ['ac dc thunderstruck', 'https://www.youtube.com/watch?v=v2AC41dglnM']
]);

// Função para verificar cache inteligente
function getSmartCache(query) {
    const lowerQuery = query.toLowerCase();
    for (const [key, url] of popularSongs.entries()) {
        if (lowerQuery.includes(key)) {
            console.log('🧠 Cache inteligente ativado para:', key);
            return url;
        }
    }
    return null;
}

client.once('ready', () => {
    console.log('Bot de música está online!');
    console.log(`Conectado como: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'play') {
        if (args[0] && !isNaN(args[0]) && global.searchResults && global.searchResults.has(message.author.id)) {
            const searchResults = global.searchResults.get(message.author.id);
            const selectedIndex = parseInt(args[0]) - 1;
            
            if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                const selectedVideo = searchResults[selectedIndex];
                message.content = `!play ${selectedVideo.url}`;
                global.searchResults.delete(message.author.id);
                execute(message, serverQueue);
                return;
            } else {
                return message.channel.send('❌ Número inválido! Escolha um número entre 1 e ' + searchResults.length);
            }
        }
        execute(message, serverQueue);
        return;
    } else if (command === 'search') {
        searchMusic(message, serverQueue);
        return;
    } else if (command === 'skip') {
        skip(message, serverQueue);
        return;
    } else if (command === 'stop') {
        stop(message, serverQueue);
        return;
    } else if (command === 'queue') {
        showQueue(message, serverQueue);
        return;
    } else if (command === 'loop') {
        toggleLoop(message, serverQueue);
        return;
    } else if (command === 'help') {
        showHelp(message);
        return;
    } else {
        message.channel.send('Você precisa especificar um comando válido! Use `!help` para ver os comandos disponíveis.');
    }
});

async function execute(message, serverQueue) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.channel.send('Você precisa estar em um canal de voz para tocar música!');
    }
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send('Preciso de permissões para entrar e falar no seu canal de voz!');
    }

    if (!args[1]) {
        return message.channel.send('❌ Por favor, forneça um link do YouTube ou nome da música!');
    }

    const input = args.slice(1).join(' ');
    
    // Verificar se é um URL do YouTube
    const isYouTubeUrl = input.includes('youtube.com') || input.includes('youtu.be');
    
    let videoUrl;
    
    if (isYouTubeUrl) {
        videoUrl = input;
    } else {
        // É uma pesquisa por nome
        console.log('🔍 Pesquisando música por nome:', input);
        
        // Verificar cache inteligente primeiro
        const smartCacheUrl = getSmartCache(input);
        if (smartCacheUrl) {
            videoUrl = smartCacheUrl;
            console.log('⚡ Cache inteligente usado - resposta instantânea!');
            // Cache inteligente ativado (sem spam no chat)
        } else {
            try {
                const results = await searchYoutube(input);
                if (results.length === 0) {
                    return message.channel.send('❌ Nenhuma música encontrada para sua pesquisa!');
                }
                videoUrl = results[0].url;
                console.log('✅ Música encontrada:', results[0].title);
                // Música encontrada (sem spam no chat)
            } catch (searchError) {
                console.error('❌ Erro na pesquisa:', searchError);
                return message.channel.send('❌ Erro ao pesquisar música!');
            }
        }
    }

    try {
        console.log('🔗 Tentando conectar ao canal de voz:', voiceChannel.name);
        
        // Conectar primeiro, sem aguardar informações do vídeo
        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: null,
                songs: [],
                volume: 5,
                playing: true,
                loop: false,
            };

            queue.set(message.guild.id, queueContruct);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                
                console.log('✅ Conectado ao canal de voz com sucesso!');
                queueContruct.connection = connection;
                queueContruct.player = createAudioPlayer();
                connection.subscribe(queueContruct.player);

                // Conectado com sucesso (sem spam no chat)
                
                // Criar música imediatamente e começar a tocar
                const song = {
                    title: 'Música do YouTube',
                    url: videoUrl,
                    duration: 180,
                    thumbnail: 'https://via.placeholder.com/320x180/000000/FFFFFF?text=YouTube+Music'
                };
                
                console.log('Song criado imediatamente:', song.title);
                queueContruct.songs.push(song);
                
                // Música adicionada à fila (sem spam no chat)
                playMusicFast(message.guild, song);
                
                // Obter informações do vídeo em background (sem bloquear)
                setTimeout(async () => {
                    try {
                        const videoInfo = await getVideoInfo(videoUrl);
                        song.title = videoInfo.title;
                        song.duration = videoInfo.duration;
                        song.thumbnail = videoInfo.thumbnail;
                        
                        console.log('✅ Informações atualizadas:', song.title);
                        // Informações atualizadas (sem spam no chat)
                    } catch (error) {
                        console.error('❌ Erro ao obter informações do vídeo:', error.message);
                        // Manter informações básicas
                    }
                }, 1000); // Reduzido para 1 segundo

            } catch (err) {
                console.error('❌ Erro ao conectar ao canal de voz:', err);
                queue.delete(message.guild.id);
                return message.channel.send('❌ Erro ao conectar ao canal de voz! Verifique as permissões do bot.');
            }
        } else {
            // Se já tem fila, adicionar música
            try {
                const videoInfo = await getVideoInfo(videoUrl);
                const song = {
                    title: videoInfo.title,
                    url: videoUrl,
                    duration: videoInfo.duration,
                    thumbnail: videoInfo.thumbnail
                };
                
                serverQueue.songs.push(song);
                return message.channel.send(`🎵 **${song.title}** foi adicionada à fila!`);
            } catch (error) {
                console.error('❌ Erro ao obter informações:', error.message);
                return message.channel.send('❌ Erro ao obter informações do vídeo!');
            }
        }
    } catch (error) {
        console.error('❌ Erro geral:', error);
        return message.channel.send('❌ Erro ao processar o comando. Tente novamente!');
    }
}

async function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        console.log('🔍 Obtendo informações do vídeo:', url);
        
        const ytdlp = spawn('./yt-dlp', [
            '--dump-json',
            '--no-warnings',
            '--no-playlist',
            url
        ], { cwd: '/home/kaua/AmyLee' });

        let output = '';
        let error = '';
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ytdlp.kill();
                reject(new Error('Timeout ao obter informações do vídeo'));
            }
        }, 30000); // Reduzido para 30 segundos

        ytdlp.stdout.on('data', (data) => {
            output += data.toString();
        });

        ytdlp.stderr.on('data', (data) => {
            error += data.toString();
        });

        ytdlp.on('close', (code) => {
            clearTimeout(timeout);
            if (!resolved) {
                resolved = true;
                if (code === 0) {
                    try {
                        const info = JSON.parse(output);
                        console.log('✅ Informações obtidas:', info.title);
                        resolve({
                            title: info.title,
                            duration: info.duration || 180,
                            thumbnail: info.thumbnail
                        });
                    } catch (parseError) {
                        reject(new Error('Erro ao processar informações do vídeo'));
                    }
                } else {
                    reject(new Error(error || 'Erro ao obter informações do vídeo'));
                }
            }
        });
    });
}

async function downloadAudioReal(url, outputPath) {
    return new Promise((resolve, reject) => {
        console.log('📥 Baixando áudio real...');
        
        const ytdlp = spawn('./yt-dlp', [
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--output', outputPath,
            '--no-warnings',
            '--no-playlist',
            url
        ], { cwd: '/home/kaua/AmyLee' });

        let error = '';
        let progress = '';

        ytdlp.stderr.on('data', (data) => {
            const output = data.toString();
            error += output;
            if (output.includes('[download]')) {
                progress += output;
                console.log('📊 Download:', output.trim());
            }
        });

        ytdlp.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Áudio baixado com sucesso!');
                resolve();
            } else {
                console.error('❌ Erro ao baixar áudio:', error);
                reject(new Error(error || 'Erro ao baixar áudio'));
            }
        });
    });
}

async function playMusicFast(guild, song) {
    console.log('⚡ Reprodução em tempo real iniciada...');
    
    const serverQueue = queue.get(guild.id);
    if (!serverQueue) return;

    try {
        // Verificar se já tem conexão
        if (!serverQueue.connection || !serverQueue.player) {
            console.log('❌ Sem conexão para reprodução');
            return;
        }

        const cacheKey = song.url;
        let audioPath = audioCache.get(cacheKey);
        
        if (!audioPath) {
            console.log('📥 Iniciando download em tempo real...');
            const outputDir = '/tmp/audio-cache';
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            audioPath = path.join(outputDir, `${Date.now()}.mp3`);
            
            // Iniciando download em tempo real (sem spam no chat)
            
            // Baixar e tocar simultaneamente
            downloadAndPlayRealtime(song.url, audioPath, serverQueue);
            audioCache.set(cacheKey, audioPath);
        } else {
            console.log('♻️ Usando áudio do cache (instantâneo!)');
            
            // Criar stream do arquivo em cache
            console.log('📡 Criando stream de áudio do cache...');
            const audioStream = fs.createReadStream(audioPath);
            const resource = createAudioResource(audioStream);
            
            console.log('▶️ Iniciando reprodução do cache...');
            serverQueue.player.play(resource);
        }

        // Enviar embed de reprodução em tempo real
        const embed = {
            color: 0x00ff00,
            title: '🎵 Tocando agora (Streaming em Tempo Real)',
            description: `**${song.title}**`,
            thumbnail: {
                url: song.thumbnail
            },
            fields: [
                {
                    name: 'Duração',
                    value: formatDuration(song.duration),
                    inline: true
                },
                {
                    name: 'Posição na fila',
                    value: `1 de ${serverQueue.songs.length}`,
                    inline: true
                },
                {
                    name: 'Loop',
                    value: serverQueue.loop ? '🔄 Ativado' : '⏹️ Desativado',
                    inline: true
                }
            ],
            footer: {
                text: 'Baixando e tocando simultaneamente - início instantâneo!'
            }
        };

        serverQueue.textChannel.send({ embeds: [embed] });

        // Configurar eventos do player
        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            if (serverQueue.loop) {
                const currentSong = serverQueue.songs.shift();
                serverQueue.songs.push(currentSong);
            } else {
                serverQueue.songs.shift();
            }
            if (serverQueue.songs.length > 0) {
                playMusicFast(guild, serverQueue.songs[0]);
            } else {
                serverQueue.textChannel.send('🎵 Fila de músicas vazia!');
            }
        });

        serverQueue.player.once(AudioPlayerStatus.Playing, () => {
            console.log('✅ Áudio tocando com sucesso!');
        });

        serverQueue.player.on('error', (error) => {
            console.error('❌ Erro no player de áudio:', error);
            serverQueue.textChannel.send(`❌ Erro ao reproduzir música: ${error.message}`);
            serverQueue.songs.shift();
            if (serverQueue.songs.length > 0) {
                playMusicFast(guild, serverQueue.songs[0]);
            }
        });

    } catch (error) {
        console.error('❌ Erro na reprodução rápida:', error);
        serverQueue.textChannel.send(`❌ Erro ao reproduzir música: ${error.message}`);
    }
}

async function downloadAndPlayRealtime(url, outputPath, serverQueue) {
    console.log('🎵 Iniciando download e reprodução simultânea...');
    
    return new Promise((resolve, reject) => {
        const ytdlp = spawn('./yt-dlp', [
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0', // Qualidade máxima para streaming
            '--output', outputPath,
            '--no-warnings',
            '--no-playlist',
            '--no-check-certificates',
            '--buffer-size', '16K', // Buffer menor para início mais rápido
            url
        ], { cwd: '/home/kaua/AmyLee' });

        let error = '';
        let resolved = false;
        let playbackStarted = false;

        // Monitorar o arquivo sendo criado
        const checkFile = setInterval(() => {
            if (fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                if (stats.size > 10000 && !playbackStarted) { // Quando arquivo tem pelo menos 10KB
                    playbackStarted = true;
                    console.log('▶️ Iniciando reprodução em tempo real...');
                    
                    try {
                        // Criar stream do arquivo sendo baixado
                        const audioStream = fs.createReadStream(outputPath);
                        const resource = createAudioResource(audioStream);
                        serverQueue.player.play(resource);
                        
                        // Reproduzindo em tempo real (sem spam no chat)
                        
                        // Configurar eventos do player
                        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
                            if (serverQueue.loop) {
                                const currentSong = serverQueue.songs.shift();
                                serverQueue.songs.push(currentSong);
                            } else {
                                serverQueue.songs.shift();
                            }
                            if (serverQueue.songs.length > 0) {
                                playMusicFast(guild, serverQueue.songs[0]);
                            } else {
                                serverQueue.textChannel.send('🎵 Fila de músicas vazia!');
                            }
                        });

                        serverQueue.player.once(AudioPlayerStatus.Playing, () => {
                            console.log('✅ Áudio tocando em tempo real!');
                        });

                        serverQueue.player.on('error', (error) => {
                            console.error('❌ Erro no player de áudio:', error);
                            serverQueue.textChannel.send(`❌ Erro ao reproduzir música: ${error.message}`);
                        });
                        
                    } catch (playError) {
                        console.error('❌ Erro ao iniciar reprodução:', playError);
                    }
                }
            }
        }, 1000); // Verificar a cada segundo

        ytdlp.stderr.on('data', (data) => {
            const output = data.toString();
            error += output;
            if (output.includes('[download]')) {
                console.log('📊 Download progress:', output.trim());
            }
        });

        ytdlp.on('close', (code) => {
            clearInterval(checkFile);
            if (!resolved) {
                resolved = true;
                if (code === 0) {
                    console.log('✅ Download concluído!');
                    // Download concluído (sem spam no chat)
                    resolve();
                } else {
                    reject(new Error(error || 'Erro no download em tempo real'));
                }
            }
        });

        // Timeout de segurança
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                clearInterval(checkFile);
                ytdlp.kill();
                reject(new Error('Timeout no download em tempo real (30s)'));
            }
        }, 30000);
    });
}

async function downloadAudioFast(url, outputPath) {
    return new Promise((resolve, reject) => {
        console.log('⚡ Download rápido iniciado...');
        
        const ytdlp = spawn('./yt-dlp', [
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '9', // Qualidade mais baixa para máxima velocidade
            '--output', outputPath,
            '--no-warnings',
            '--no-playlist',
            '--no-check-certificates',
            '--prefer-free-formats',
            '--concurrent-fragments', '1',
            '--fragment-retries', '1',
            '--retries', '1',
            '--socket-timeout', '10',
            url
        ], { cwd: '/home/kaua/AmyLee' });

        let error = '';
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ytdlp.kill();
                reject(new Error('Timeout no download rápido (10s)'));
            }
        }, 10000); // Timeout reduzido para 10s

        ytdlp.stderr.on('data', (data) => {
            const output = data.toString();
            error += output;
            if (output.includes('[download]')) {
                console.log('📊 Download rápido:', output.trim());
            }
        });

        ytdlp.on('close', (code) => {
            clearTimeout(timeout);
            if (!resolved) {
                resolved = true;
                if (code === 0) {
                    console.log('✅ Download rápido concluído!');
                    resolve();
                } else {
                    reject(new Error(error || 'Erro no download rápido'));
                }
            }
        });
    });
}

async function playMusic(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        console.log('❌ Nenhuma música para tocar, desconectando...');
        if (serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        queue.delete(guild.id);
        return;
    }

    try {
        console.log('🎵 Tentando reproduzir:', song.title);
        
        if (!serverQueue.connection) {
            console.log('❌ Conexão perdida, tentando reconectar...');
            const connection = joinVoiceChannel({
                channelId: serverQueue.voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });
            serverQueue.connection = connection;
            serverQueue.player = createAudioPlayer();
            connection.subscribe(serverQueue.player);
        }
        
        // Baixar áudio correto do vídeo especificado
        console.log('📥 Baixando áudio correto do vídeo...');
        
        const cacheKey = song.url;
        let audioPath = audioCache.get(cacheKey);
        
        if (!audioPath) {
            console.log('📥 Baixando áudio real do vídeo:', song.url);
            const outputDir = '/tmp/audio-cache';
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            audioPath = path.join(outputDir, `${Date.now()}.mp3`);
            
            try {
                await downloadAudioReal(song.url, audioPath);
                audioCache.set(cacheKey, audioPath);
                console.log('✅ Áudio real baixado com sucesso!');
            } catch (downloadError) {
                console.error('❌ Erro ao baixar áudio:', downloadError.message);
                serverQueue.textChannel.send('❌ Erro ao baixar áudio do vídeo!');
                return;
            }
        } else {
            console.log('♻️ Usando áudio do cache');
        }
        
        // Criar stream do arquivo de áudio correto
        console.log('📡 Criando stream do arquivo de áudio correto...');
        const audioStream = fs.createReadStream(audioPath);
        
        const resource = createAudioResource(audioStream);
        
        console.log('▶️ Iniciando reprodução do áudio correto...');
        serverQueue.player.play(resource);


        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            if (serverQueue.loop) {
                const currentSong = serverQueue.songs.shift();
                serverQueue.songs.push(currentSong);
                serverQueue.textChannel.send(`🔄 **${currentSong.title}** foi adicionada novamente à fila (loop ativo)`);
            } else {
                serverQueue.songs.shift();
            }
            playMusic(guild, serverQueue.songs[0]);
        });

        serverQueue.player.on('error', error => {
            console.error('❌ Erro no player de áudio:', error);
            serverQueue.textChannel.send(`❌ Ocorreu um erro ao tocar a música: ${error.message}`);
            serverQueue.songs.shift();
            playMusic(guild, serverQueue.songs[0]);
        });

        const embed = {
            color: 0x00ff00,
            title: '🎵 Tocando agora (Áudio Correto)',
            description: `**${song.title}**`,
            thumbnail: {
                url: song.thumbnail
            },
            fields: [
                {
                    name: 'Duração',
                    value: formatDuration(song.duration),
                    inline: true
                },
                {
                    name: 'Posição na fila',
                    value: `1 de ${serverQueue.songs.length}`,
                    inline: true
                },
                {
                    name: 'Loop',
                    value: serverQueue.loop ? '🔄 Ativado' : '⏹️ Desativado',
                    inline: true
                }
            ],
            footer: {
                text: 'Reproduzindo áudio correto do vídeo especificado'
            }
        };

        serverQueue.textChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Erro ao reproduzir música:', error);
        serverQueue.textChannel.send(`❌ Erro ao reproduzir a música: ${error.message}`);
        serverQueue.songs.shift();
        playMusic(guild, serverQueue.songs[0]);
    }
}

async function searchMusic(message, serverQueue) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.channel.send('Você precisa estar em um canal de voz para tocar música!');
    }
    
    if (!args[1]) {
        return message.channel.send('Por favor, forneça o nome da música para pesquisar!');
    }

    const searchQuery = args.slice(1).join(' ');
    
    try {
        message.channel.send('🔍 Pesquisando...');
        console.log('🔍 Pesquisando:', searchQuery);
        
        const results = await searchYoutube(searchQuery);
        
        if (results.length === 0) {
            return message.channel.send('❌ Nenhum resultado encontrado para sua pesquisa!');
        }

        const embed = {
            color: 0x0099ff,
            title: '🔍 Resultados da Pesquisa',
            description: 'Escolha uma música digitando o número:',
            fields: results.map((result, index) => ({
                name: `${index + 1}. ${result.title}`,
                value: `Duração: ${result.duration || 'Desconhecida'}`,
                inline: false
            })),
            footer: {
                text: 'Digite !play <número> para escolher uma música'
            }
        };

        await message.channel.send({ embeds: [embed] });
        
        if (!global.searchResults) global.searchResults = new Map();
        global.searchResults.set(message.author.id, results);
        
        setTimeout(() => {
            global.searchResults.delete(message.author.id);
        }, 30000);

    } catch (error) {
        console.error('Erro na pesquisa:', error);
        return message.channel.send('❌ Erro ao pesquisar no YouTube!');
    }
}

async function searchYoutube(query) {
    return new Promise((resolve, reject) => {
        console.log('🔍 Pesquisando no YouTube:', query);
        
        const ytdlp = spawn('./yt-dlp', [
            'ytsearch5:' + query,
            '--dump-json',
            '--no-warnings'
        ], { cwd: '/home/kaua/AmyLee' });

        let output = '';
        let error = '';

        ytdlp.stdout.on('data', (data) => {
            output += data.toString();
        });

        ytdlp.stderr.on('data', (data) => {
            error += data.toString();
        });

        ytdlp.on('close', (code) => {
            if (code === 0) {
                try {
                    const lines = output.trim().split('\n');
                    const results = lines.map(line => {
                        const info = JSON.parse(line);
                        return {
                            title: info.title,
                            url: info.webpage_url,
                            duration: info.duration,
                            thumbnail: info.thumbnail
                        };
                    });
                    resolve(results);
                } catch (parseError) {
                    reject(new Error('Erro ao processar resultados da pesquisa'));
                }
            } else {
                reject(new Error(error || 'Erro ao pesquisar'));
            }
        });
    });
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('Você precisa estar em um canal de voz para pular a música!');
    }
    if (!serverQueue) {
        return message.channel.send('Não há músicas para pular!');
    }
    serverQueue.player.stop();
    message.channel.send('⏭️ Música pulada!');
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('Você precisa estar em um canal de voz para parar a música!');
    }
    if (!serverQueue) {
        return message.channel.send('Não há músicas para parar!');
    }

    serverQueue.songs = [];
    if (serverQueue.player) {
        serverQueue.player.stop();
    }
    if (serverQueue.connection) {
        serverQueue.connection.destroy();
    }
    queue.delete(message.guild.id);
    message.channel.send('⏹️ Bot parado e fila limpa!');
}

function toggleLoop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send('Você precisa estar em um canal de voz para usar este comando!');
    }
    if (!serverQueue) {
        return message.channel.send('Não há fila de música ativa!');
    }

    serverQueue.loop = !serverQueue.loop;
    const status = serverQueue.loop ? '🔄 **ativado**' : '⏹️ **desativado**';
    message.channel.send(`Loop da fila foi ${status}!`);
}

function showQueue(message, serverQueue) {
    if (!serverQueue || serverQueue.songs.length === 0) {
        return message.channel.send('A fila está vazia!');
    }

    const queueList = serverQueue.songs.map((song, index) => 
        `${index + 1}. **${song.title}**`
    ).join('\n');

    const embed = {
        color: 0x0099ff,
        title: '📋 Fila de Músicas',
        description: queueList,
        fields: [
            {
                name: 'Loop',
                value: serverQueue.loop ? '🔄 Ativado' : '⏹️ Desativado',
                inline: true
            }
        ],
        footer: {
            text: `Total: ${serverQueue.songs.length} música(s)`
        }
    };

    message.channel.send({ embeds: [embed] });
}

function showHelp(message) {
    const embed = {
        color: 0x0099ff,
        title: '🎵 Comandos do Bot de Música (Áudio Real)',
        description: 'Aqui estão todos os comandos disponíveis:',
        fields: [
            {
                name: '!play <link_do_youtube>',
                value: 'Toca uma música do YouTube usando link direto',
                inline: false
            },
            {
                name: '!search <nome_da_musica>',
                value: 'Pesquisa músicas no YouTube por nome',
                inline: false
            },
            {
                name: '!play <número>',
                value: 'Escolhe uma música da pesquisa anterior',
                inline: false
            },
            {
                name: '!skip',
                value: 'Pula a música atual',
                inline: false
            },
            {
                name: '!stop',
                value: 'Para a música e limpa a fila',
                inline: false
            },
            {
                name: '!loop',
                value: 'Ativa/desativa o loop da fila de músicas',
                inline: false
            },
            {
                name: '!queue',
                value: 'Mostra a fila de músicas',
                inline: false
            },
            {
                name: '!help',
                value: 'Mostra esta mensagem de ajuda',
                inline: false
            }
        ],
        footer: {
            text: 'Reproduzindo áudio real extraído do YouTube!'
        }
    };

    message.channel.send({ embeds: [embed] });
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

process.on('unhandledRejection', error => {
    console.error('Erro não tratado:', error);
});

process.on('uncaughtException', error => {
    console.error('Exceção não capturada:', error);
});

client.login(process.env.DISCORD_BOT_TOKEN);
