// plugins/commandEnhancer.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'CommandEnhancer',
    version: '1.5.0',
    author: 'ᴳᵁᴿᵁᴹᴰ Team',
    description: 'Enhances command system with aliases, cooldowns, and permissions',
    
    init() {
        console.log('⚡ CommandEnhancer Plugin Loaded');
        this.commandUsage = new Map();
        this.userCooldowns = new Map();
        this.commandStats = new Map();
        this.loadCommandStats();
        
        // Add custom commands
        this.addCustomCommands();
    },
    
    events: {
        'messages.upsert': async ({ conn, mek, from, body, sender, isCmd, command, args, isOwner, isAdmins }) => {
            if (!isCmd) return;
            
            const cmdName = command.toLowerCase();
            
            // Check cooldown
            if (this.isOnCooldown(sender, cmdName)) {
                const cooldown = this.getCooldown(sender, cmdName);
                await conn.sendMessage(from, {
                    text: `⏳ Cooldown active! Wait ${cooldown} seconds.`,
                    quoted: mek
                });
                return;
            }
            
            // Check permissions
            if (!this.checkPermission(cmdName, { isOwner, isAdmins, sender })) {
                await conn.sendMessage(from, {
                    text: `❌ You don't have permission to use this command.`,
                    quoted: mek
                });
                return;
            }
            
            // Track usage
            this.trackCommandUsage(cmdName, sender);
            
            // Set cooldown
            this.setCooldown(sender, cmdName, this.getCommandCooldown(cmdName));
            
            // Handle custom commands
            await this.handleCustomCommand(conn, mek, from, cmdName, args, sender);
        }
    },
    
    addCustomCommands() {
        // These commands will work alongside existing ones
        this.customCommands = {
            'ping': {
                description: 'Check bot response time',
                cooldown: 3,
                permission: 'all',
                handler: async (conn, mek, from, args, sender) => {
                    const start = Date.now();
                    await conn.sendMessage(from, {
                        text: '🏓 Pong!'
                    }, { quoted: mek });
                    const latency = Date.now() - start;
                    
                    await conn.sendMessage(from, {
                        text: `⏱️ Response time: ${latency}ms\n🖥️ Server: ${process.platform}\n📊 Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`
                    });
                }
            },
            
            'stats': {
                description: 'Show command statistics',
                cooldown: 10,
                permission: 'all',
                handler: async (conn, mek, from, args, sender) => {
                    const totalUsage = Array.from(this.commandUsage.values())
                        .reduce((sum, count) => sum + count, 0);
                    
                    const userUsage = Array.from(this.commandUsage.entries())
                        .filter(([key]) => key.includes(sender))
                        .reduce((sum, [, count]) => sum + count, 0);
                    
                    const topCommands = Array.from(this.commandStats.entries())
                        .sort((a, b) => b[1].usage - a[1].usage)
                        .slice(0, 5)
                        .map(([cmd, data]) => `• ${cmd}: ${data.usage} uses`);
                    
                    const statsText = `📊 *Command Statistics*\n\n` +
                                    `📈 *Total Commands:* ${totalUsage}\n` +
                                    `👤 *Your Commands:* ${userUsage}\n` +
                                    `🏆 *Top Commands:*\n${topCommands.join('\n')}\n\n` +
                                    `_ᴳᵁᴿᵁᴹᴰ Command System_`;
                    
                    await conn.sendMessage(from, { text: statsText }, { quoted: mek });
                }
            },
            
            'cooldown': {
                description: 'Check your command cooldowns',
                cooldown: 5,
                permission: 'all',
                handler: async (conn, mek, from, args, sender) => {
                    const cooldowns = [];
                    
                    for (const [key, expiry] of this.userCooldowns.entries()) {
                        if (key.startsWith(sender + ':')) {
                            const cmd = key.split(':')[1];
                            const remaining = Math.ceil((expiry - Date.now()) / 1000);
                            if (remaining > 0) {
                                cooldowns.push(`• ${cmd}: ${remaining}s`);
                            }
                        }
                    }
                    
                    const text = cooldowns.length > 0 
                        ? `⏳ *Your Cooldowns:*\n\n${cooldowns.join('\n')}`
                        : `✅ No active cooldowns! All commands are ready to use.`;
                    
                    await conn.sendMessage(from, { text }, { quoted: mek });
                }
            },
            
            'help': {
                description: 'Enhanced help command',
                cooldown: 5,
                permission: 'all',
                handler: async (conn, mek, from, args, sender) => {
                    const categories = {
                        '🔧 Utility': ['ping', 'stats', 'cooldown', 'help'],
                        '🎨 Media': ['sticker', 'crop', 'enhance'],
                        '🛡️ Admin': ['ban', 'mute', 'warn', 'kick'],
                        '🎮 Fun': ['meme', 'quote', 'joke', 'fact']
                    };
                    
                    let helpText = `*ᴳᵁᴿᵁᴹᴰ Bot Help*\n\n`;
                    
                    Object.entries(categories).forEach(([category, commands]) => {
                        helpText += `*${category}:*\n`;
                        commands.forEach(cmd => {
                            const info = this.customCommands[cmd];
                            if (info) {
                                helpText += `• *${config.PREFIX}${cmd}* - ${info.description}\n`;
                            }
                        });
                        helpText += '\n';
                    });
                    
                    helpText += `\n📖 *Usage:* ${config.PREFIX}command [args]\n`;
                    helpText += `🔐 *Owner:* ${config.OWNER_NUMBER?.split('@')[0] || '254778074353'}\n`;
                    helpText += `_Type ${config.PREFIX}help [command] for details_`;
                    
                    await conn.sendMessage(from, { text: helpText }, { quoted: mek });
                }
            },
            
            'meme': {
                description: 'Generate random memes',
                cooldown: 15,
                permission: 'all',
                handler: async (conn, mek, from, args, sender) => {
                    const memes = [
                        'https://i.imgur.com/8x9Z0.gif',
                        'https://i.imgur.com/B4wZq.gif',
                        'https://i.imgur.com/C5Z8r.gif',
                        'https://i.imgur.com/D3v8Q.gif'
                    ];
                    
                    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
                    
                    await conn.sendMessage(from, {
                        image: { url: randomMeme },
                        caption: '😂 Random Meme Generated!\n\n_ᴳᵁᴿᵁᴹᴰ Meme Factory_'
                    }, { quoted: mek });
                }
            }
        };
    },
    
    async handleCustomCommand(conn, mek, from, cmdName, args, sender) {
        const command = this.customCommands[cmdName];
        
        if (command && command.handler) {
            try {
                await command.handler(conn, mek, from, args, sender);
            } catch (error) {
                console.error(`Command ${cmdName} error:`, error);
                await conn.sendMessage(from, {
                    text: `❌ Error executing command: ${error.message}`,
                    quoted: mek
                });
            }
        }
        // If not a custom command, it will be handled by the existing command system
    },
    
    isOnCooldown(userId, command) {
        const key = `${userId}:${command}`;
        const expiry = this.userCooldowns.get(key);
        
        if (expiry && Date.now() < expiry) {
            return true;
        }
        
        if (expiry && Date.now() >= expiry) {
            this.userCooldowns.delete(key);
        }
        
        return false;
    },
    
    getCooldown(userId, command) {
        const key = `${userId}:${command}`;
        const expiry = this.userCooldowns.get(key);
        
        if (expiry) {
            return Math.ceil((expiry - Date.now()) / 1000);
        }
        
        return 0;
    },
    
    setCooldown(userId, command, seconds) {
        const key = `${userId}:${command}`;
        const expiry = Date.now() + (seconds * 1000);
        this.userCooldowns.set(key, expiry);
        
        // Auto-cleanup after cooldown expires
        setTimeout(() => {
            this.userCooldowns.delete(key);
        }, seconds * 1000);
    },
    
    getCommandCooldown(command) {
        const cmd = this.customCommands[command];
        return cmd ? cmd.cooldown : 3; // Default 3 seconds
    },
    
    checkPermission(command, user) {
        const cmd = this.customCommands[command];
        
        if (!cmd) return true; // Allow existing commands
        
        if (cmd.permission === 'all') return true;
        if (cmd.permission === 'admin' && user.isAdmins) return true;
        if (cmd.permission === 'owner' && user.isOwner) return true;
        
        return false;
    },
    
    trackCommandUsage(command, userId) {
        // Track per user
        const userKey = `${userId}:${command}`;
        const userCount = this.commandUsage.get(userKey) || 0;
        this.commandUsage.set(userKey, userCount + 1);
        
        // Track global
        const globalCount = this.commandStats.get(command) || { usage: 0, lastUsed: null };
        globalCount.usage++;
        globalCount.lastUsed = new Date();
        this.commandStats.set(command, globalCount);
        
        // Save stats periodically
        if (globalCount.usage % 10 === 0) {
            this.saveCommandStats();
        }
    },
    
    loadCommandStats() {
        try {
            const statsFile = path.join(__dirname, '..', 'data', 'command_stats.json');
            
            if (fs.existsSync(statsFile)) {
                const data = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
                this.commandStats = new Map(Object.entries(data.stats || {}));
                console.log('📊 Loaded command statistics');
            }
        } catch (error) {
            console.error('Failed to load command stats:', error);
        }
    },
    
    saveCommandStats() {
        try {
            const dataDir = path.join(__dirname, '..', 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            const statsFile = path.join(dataDir, 'command_stats.json');
            const data = {
                stats: Object.fromEntries(this.commandStats),
                savedAt: new Date().toISOString()
            };
            
            fs.writeFileSync(statsFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save command stats:', error);
        }
    }
};
