// plugins/antiDeletePro.js
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('gifted-baileys');

module.exports = {
    name: 'AntiDeletePro',
    version: '2.0.0',
    author: 'ᴳᵁᴿᵁᴹᴰ Team',
    description: 'Advanced message deletion tracking and recovery',
    
    init() {
        console.log('🛡️ AntiDeletePro Plugin Loaded');
        this.messageCache = new Map();
        this.deletedMessages = new Map();
        this.setupStorage();
        this.startCleanupInterval();
    },
    
    events: {
        'messages.upsert': async ({ conn, mek }) => {
            // Cache all messages
            await this.cacheMessage(mek);
        },
        
        'messages.update': async ({ conn, updates }) => {
            const updateArray = Array.isArray(updates) ? updates : [updates];
            
            for (const update of updateArray) {
                if (update.update?.message === null) {
                    await this.handleDeletedMessage(conn, update);
                }
            }
        }
    },
    
    setupStorage() {
        const folders = ['deleted_messages', 'recovered_files', 'logs'];
        folders.forEach(folder => {
            const dir = path.join(__dirname, '..', folder);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    },
    
    async cacheMessage(message) {
        if (!message.key.id || !message.message) return;
        
        const messageData = {
            ...message,
            cachedAt: new Date().toISOString(),
            hasMedia: this.hasMedia(message)
        };
        
        this.messageCache.set(message.key.id, messageData);
        
        // Extract and save media immediately for important messages
        if (this.isImportantMessage(message) && this.hasMedia(message)) {
            await this.extractAndSaveMedia(message);
        }
    },
    
    async handleDeletedMessage(conn, update) {
        const messageId = update.key.id;
        const deletedBy = update.update.participant || 'unknown';
        const chatId = update.key.remoteJid;
        
        // Get cached message
        const originalMessage = this.messageCache.get(messageId);
        
        if (originalMessage) {
            console.log(`🚨 Message deleted: ${messageId} by ${deletedBy}`);
            
            // Save deleted message details
            const deletedData = {
                ...originalMessage,
                deletedBy,
                deletedAt: new Date().toISOString(),
                chatId
            };
            
            this.deletedMessages.set(messageId, deletedData);
            
            // Save to file
            await this.saveDeletedMessage(deletedData);
            
            // Notify owner
            await this.notifyOwner(conn, deletedData);
            
            // Attempt to recover media
            if (deletedData.hasMedia) {
                await this.recoverMedia(conn, deletedData);
            }
            
            // Clear from cache
            this.messageCache.delete(messageId);
        }
    },
    
    async notifyOwner(conn, deletedData) {
        try {
            const owner = config.OWNER_NUMBER || '254778074353@s.whatsapp.net';
            const deleter = deletedData.deletedBy.split('@')[0];
            const chat = deletedData.chatId.split('@')[0];
            
            const notification = `🚨 *MESSAGE DELETED ALERT!*\n\n` +
                                `📝 *Content:* ${this.getMessageText(deletedData)}\n` +
                                `👤 *Deleted by:* ${deleter}\n` +
                                `💬 *Chat:* ${chat}\n` +
                                `🕒 *Time:* ${new Date().toLocaleTimeString()}\n` +
                                `🔍 *Message ID:* ${deletedData.key.id}\n\n` +
                                `_Use !recover ${deletedData.key.id} to recover_`;
            
            await conn.sendMessage(owner, { text: notification });
            
        } catch (error) {
            console.error('Notification error:', error);
        }
    },
    
    async recoverMedia(conn, deletedData) {
        try {
            if (deletedData.hasMedia && !deletedData.mediaRecovered) {
                const buffer = await downloadMediaMessage(deletedData, 'buffer', {}, {
                    logger: console
                });
                
                if (buffer) {
                    const ext = this.getMediaExtension(deletedData);
                    const fileName = `recovered_${deletedData.key.id}${ext}`;
                    const filePath = path.join(__dirname, '..', 'recovered_files', fileName);
                    
                    fs.writeFileSync(filePath, buffer);
                    
                    deletedData.mediaRecovered = true;
                    deletedData.recoveredFile = fileName;
                    
                    console.log(`✅ Media recovered: ${fileName}`);
                    
                    // Send to owner
                    const owner = config.OWNER_NUMBER || '254778074353@s.whatsapp.net';
                    await conn.sendMessage(owner, {
                        text: `✅ Media recovered from deleted message!\n📁 ${fileName}`
                    });
                }
            }
        } catch (error) {
            console.error('Media recovery error:', error);
        }
    },
    
    async saveDeletedMessage(data) {
        try {
            const logDir = path.join(__dirname, '..', 'deleted_messages');
            const fileName = `deleted_${data.key.id}.json`;
            const filePath = path.join(logDir, fileName);
            
            // Clean sensitive data
            const cleanData = {
                ...data,
                pushName: 'REDACTED',
                message: this.sanitizeMessage(data.message)
            };
            
            fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2));
            
            // Update log file
            this.updateDeletionLog(cleanData);
            
        } catch (error) {
            console.error('Save deleted message error:', error);
        }
    },
    
    updateDeletionLog(data) {
        const logFile = path.join(__dirname, '..', 'logs', 'deletions.json');
        let logs = [];
        
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        logs.push({
            id: data.key.id,
            deletedBy: data.deletedBy.split('@')[0],
            chat: data.chatId.split('@')[0],
            content: this.getMessageText(data).substring(0, 100),
            timestamp: data.deletedAt,
            hasMedia: data.hasMedia,
            recovered: data.mediaRecovered || false
        });
        
        // Keep only last 1000 entries
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }
        
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    },
    
    getMessageText(message) {
        if (!message.message) return '[No Content]';
        
        const type = Object.keys(message.message)[0];
        switch(type) {
            case 'conversation':
                return message.message.conversation;
            case 'extendedTextMessage':
                return message.message.extendedTextMessage.text;
            case 'imageMessage':
                return message.message.imageMessage.caption || '[Image]';
            case 'videoMessage':
                return message.message.videoMessage.caption || '[Video]';
            case 'audioMessage':
                return message.message.audioMessage.ptt ? '[Voice Note]' : '[Audio]';
            default:
                return `[${type.replace('Message', '')}]`;
        }
    },
    
    hasMedia(message) {
        if (!message.message) return false;
        
        const type = Object.keys(message.message)[0];
        return ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(type);
    },
    
    getMediaExtension(message) {
        if (!message.message) return '.dat';
        
        const type = Object.keys(message.message)[0];
        switch(type) {
            case 'imageMessage':
                return '.jpg';
            case 'videoMessage':
                return '.mp4';
            case 'audioMessage':
                return message.message.audioMessage.ptt ? '.ogg' : '.mp3';
            case 'documentMessage':
                const doc = message.message.documentMessage;
                return doc.fileName?.split('.').pop() || '.bin';
            default:
                return '.dat';
        }
    },
    
    isImportantMessage(message) {
        const text = this.getMessageText(message).toLowerCase();
        const importantKeywords = ['password', 'bank', 'credit card', 'secret', 'confidential', 'important'];
        return importantKeywords.some(keyword => text.includes(keyword));
    },
    
    sanitizeMessage(message) {
        // Remove sensitive data from message object
        const sanitized = { ...message };
        
        if (sanitized.extendedTextMessage?.contextInfo?.quotedMessage) {
            sanitized.extendedTextMessage.contextInfo.quotedMessage = '[REDACTED]';
        }
        
        return sanitized;
    },
    
    startCleanupInterval() {
        // Clean old cache every hour
        setInterval(() => {
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);
            
            for (const [id, message] of this.messageCache.entries()) {
                const messageTime = new Date(message.cachedAt).getTime();
                if (messageTime < oneHourAgo) {
                    this.messageCache.delete(id);
                }
            }
            
            console.log(`🧹 Cleaned message cache. Remaining: ${this.messageCache.size}`);
            
        }, 60 * 60 * 1000); // Every hour
    },
    
    async extractAndSaveMedia(message) {
        try {
            if (this.hasMedia(message)) {
                const buffer = await downloadMediaMessage(message, 'buffer', {}, {
                    logger: console
                });
                
                const ext = this.getMediaExtension(message);
                const fileName = `auto_save_${message.key.id}${ext}`;
                const filePath = path.join(__dirname, '..', 'auto_saved_media', fileName);
                
                // Ensure directory exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                fs.writeFileSync(filePath, buffer);
                console.log(`✅ Auto-saved media: ${fileName}`);
            }
        } catch (error) {
            console.error('Auto-save media error:', error);
        }
    }
};
