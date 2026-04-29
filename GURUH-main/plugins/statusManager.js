// plugins/statusManager.js
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('gifted-baileys');

module.exports = {
    name: 'StatusManager',
    version: '2.0.0',
    author: 'ᴳᵁᴿᵁᴹᴰ Team',
    description: 'Advanced status viewing, reacting, and saving',
    
    init() {
        console.log('📱 StatusManager Plugin Loaded');
        this.statusHistory = new Map();
        this.setupStatusFolders();
        
        // Auto-enable features if not set
        global.AUTO_VIEW_STATUS = global.AUTO_VIEW_STATUS !== undefined ? global.AUTO_VIEW_STATUS : true;
        global.AUTO_REACT_STATUS = global.AUTO_REACT_STATUS !== undefined ? global.AUTO_REACT_STATUS : true;
        global.AUTO_SAVE_STATUS = global.AUTO_SAVE_STATUS !== undefined ? global.AUTO_SAVE_STATUS : false;
    },
    
    events: {
        'messages.upsert': async ({ conn, mek }) => {
            if (mek.key.remoteJid !== 'status@broadcast') return;
            
            const statusData = {
                id: mek.key.id,
                sender: mek.key.participant || mek.key.remoteJid,
                pushName: mek.pushName || 'Unknown',
                timestamp: new Date(),
                hasMedia: !!mek.message?.imageMessage || !!mek.message?.videoMessage,
                mediaType: mek.message?.imageMessage ? 'image' : mek.message?.videoMessage ? 'video' : 'text'
            };
            
            // Store in history
            this.statusHistory.set(mek.key.id, statusData);
            
            // Process status based on settings
            await this.processStatus(conn, mek, statusData);
        },
        
        'connection.update': async ({ conn, update }) => {
            if (update.connection === 'open') {
                // Send status summary to owner
                await this.sendStatusSummary(conn);
            }
        }
    },
    
    async processStatus(conn, mek, statusData) {
        const promises = [];
        
        // 1. Auto View Status
        if (global.AUTO_VIEW_STATUS) {
            promises.push(this.autoViewStatus(conn, mek));
        }
        
        // 2. Auto React to Status
        if (global.AUTO_REACT_STATUS) {
            promises.push(this.autoReactStatus(conn, mek, statusData));
        }
        
        // 3. Auto Save Status
        if (global.AUTO_SAVE_STATUS) {
            promises.push(this.autoSaveStatus(conn, mek, statusData));
        }
        
        // 4. Log Status
        promises.push(this.logStatus(statusData));
        
        await Promise.allSettled(promises);
    },
    
    async autoViewStatus(conn, mek) {
        try {
            // Random delay between 3-10 seconds (looks more natural)
            const delay = 3000 + Math.floor(Math.random() * 7000);
            
            setTimeout(async () => {
                await conn.readMessages([mek.key]);
                console.log(`👁️ Auto-viewed status from ${mek.key.participant?.split('@')[0] || 'unknown'}`);
            }, delay);
            
        } catch (error) {
            console.error('Auto-view error:', error);
        }
    },
    
    async autoReactStatus(conn, mek, statusData) {
        try {
            // Different reactions based on status type and sender
            let emoji = '❤️'; // Default
            
            if (statusData.mediaType === 'image') {
                const imageReactions = ['🔥', '😍', '👏', '✨', '👍', '🎯', '💯'];
                emoji = imageReactions[Math.floor(Math.random() * imageReactions.length)];
            } else if (statusData.mediaType === 'video') {
                const videoReactions = ['🎬', '👌', '😂', '🎉', '🤩', '🚀', '💥'];
                emoji = videoReactions[Math.floor(Math.random() * videoReactions.length)];
            } else {
                const textReactions = ['📝', '💭', '🤔', '👀', '💡', '🎯'];
                emoji = textReactions[Math.floor(Math.random() * textReactions.length)];
            }
            
            // React with random delay
            setTimeout(async () => {
                await conn.sendMessage('status@broadcast', {
                    react: {
                        text: emoji,
                        key: mek.key
                    }
                });
                
                console.log(`🎭 Auto-reacted ${emoji} to status from ${statusData.pushName}`);
                
            }, 2000 + Math.floor(Math.random() * 5000));
            
        } catch (error) {
            console.error('Auto-react error:', error);
        }
    },
    
    async autoSaveStatus(conn, mek, statusData) {
        try {
            if (!statusData.hasMedia) return;
            
            const buffer = await downloadMediaMessage(mek, 'buffer', {}, {
                logger: console
            });
            
            const isImage = statusData.mediaType === 'image';
            const ext = isImage ? '.jpg' : '.mp4';
            const senderName = statusData.pushName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `${senderName}_${Date.now()}${ext}`;
            const filePath = path.join(__dirname, '..', 'saved_statuses', fileName);
            
            fs.writeFileSync(filePath, buffer);
            
            console.log(`💾 Auto-saved status: ${fileName}`);
            
            // Update status data
            statusData.saved = true;
            statusData.fileName = fileName;
            statusData.fileSize = (buffer.length / (1024 * 1024)).toFixed(2) + ' MB';
            
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    },
    
    async logStatus(statusData) {
        const logFile = path.join(__dirname, '..', 'status_logs', 'status_history.json');
        let logs = [];
        
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        logs.push(statusData);
        
        // Keep only last 5000 statuses
        if (logs.length > 5000) {
            logs = logs.slice(-5000);
        }
        
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
        
        // Also update stats
        this.updateStatusStats(statusData);
    },
    
    updateStatusStats(statusData) {
        const statsFile = path.join(__dirname, '..', 'status_logs', 'status_stats.json');
        let stats = {
            total: 0,
            today: 0,
            byUser: {},
            byType: { image: 0, video: 0, text: 0 },
            lastUpdated: new Date().toISOString()
        };
        
        if (fs.existsSync(statsFile)) {
            stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        }
        
        stats.total++;
        
        // Check if today
        const today = new Date().toDateString();
        const statusDate = new Date(statusData.timestamp).toDateString();
        if (statusDate === today) {
            stats.today++;
        }
        
        // Update user stats
        const userId = statusData.sender.split('@')[0];
        stats.byUser[userId] = (stats.byUser[userId] || 0) + 1;
        
        // Update type stats
        stats.byType[statusData.mediaType] = (stats.byType[statusData.mediaType] || 0) + 1;
        
        stats.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    },
    
    setupStatusFolders() {
        const folders = ['saved_statuses', 'status_logs', 'status_backup'];
        folders.forEach(folder => {
            const dir = path.join(__dirname, '..', folder);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    },
    
    async sendStatusSummary(conn) {
        try {
            const owner = config.OWNER_NUMBER || '254778074353@s.whatsapp.net';
            const statsFile = path.join(__dirname, '..', 'status_logs', 'status_stats.json');
            
            if (fs.existsSync(statsFile)) {
                const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
                
                const summary = `📊 *Status Manager Report*\n\n` +
                               `📈 *Total Statuses:* ${stats.total}\n` +
                               `📅 *Today:* ${stats.today}\n` +
                               `🖼️ *Images:* ${stats.byType.image}\n` +
                               `🎬 *Videos:* ${stats.byType.video}\n` +
                               `📝 *Text:* ${stats.byType.text}\n\n` +
                               `⚡ *Auto View:* ${global.AUTO_VIEW_STATUS ? '✅' : '❌'}\n` +
                               `🎭 *Auto React:* ${global.AUTO_REACT_STATUS ? '✅' : '❌'}\n` +
                               `💾 *Auto Save:* ${global.AUTO_SAVE_STATUS ? '✅' : '❌'}\n\n` +
                               `_ᴳᵁᴿᵁᴹᴰ Status Manager Active_`;
                
                await conn.sendMessage(owner, { text: summary });
            }
            
        } catch (error) {
            console.error('Status summary error:', error);
        }
    }
};
