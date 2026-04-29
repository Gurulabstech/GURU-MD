/* ============================================
   GURU MD - GROUP LORE & INTELLIGENCE
   COMMAND: .lore, .grouphistory
   FEATURES: Auto-document conversations, create summaries, track inside jokes
   ============================================ */

const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

const loreDir = path.join(__dirname, '../group_lores');
if (!fs.existsSync(loreDir)) fs.mkdirSync(loreDir);

cmd({
    pattern: "lore",
    alias: ["grouphistory", "summary"],
    desc: "View group conversation history and insights",
    category: "group",
    react: "📖",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ Groups only!");
        
        const groupId = from.replace('@g.us', '');
        const loreFile = path.join(loreDir, `${groupId}.json`);
        
        if (!fs.existsSync(loreFile)) {
            return reply("📖 No lore documented yet. Start chatting!");
        }
        
        const lore = JSON.parse(fs.readFileSync(loreFile));
        
        const stats = `
╔══════════════════════════════════════╗
║     📖 *GROUP LORE & INSIGHTS*       ║
╠══════════════════════════════════════╣
║ 📌 *Group:* ${mek?.chat?.name || 'Unknown'}
║ 📊 *Total Messages:* ${lore.totalMessages || 0}
║ 👥 *Active Members:* ${lore.activeMembers || 0}
║ 📅 *Since:* ${new Date(lore.createdAt).toLocaleDateString()}
╠══════════════════════════════════════╣
║ *🔥 HOT TOPICS THIS WEEK*            ║
${lore.topics?.slice(0, 5).map(t => `║ • ${t.topic} (${t.count} msgs)`).join('\n')}
╠══════════════════════════════════════╣
║ *😂 INSIDE JOKES DETECTED*           ║
${lore.insideJokes?.slice(0, 3).map(j => `║ • "${j.phrase}" (${j.count}x)`).join('\n')}
╠══════════════════════════════════════╣
║ *📝 WEEKLY SUMMARY*                  ║
║ ${lore.weeklySummary || 'No summary yet'}
╚══════════════════════════════════════╝
        `;
        
        reply(stats);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});

// Message handler to build lore
cmd({
    pattern: "lorelistener",
    desc: "Document group conversations",
    category: "system",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, sender, msg }) => {
    try {
        if (!isGroup) return;
        
        const groupId = from.replace('@g.us', '');
        const loreFile = path.join(loreDir, `${groupId}.json`);
        
        let lore = { messages: [], topics: [], insideJokes: [], totalMessages: 0 };
        if (fs.existsSync(loreFile)) {
            lore = JSON.parse(fs.readFileSync(loreFile));
        } else {
            lore.createdAt = Date.now();
        }
        
        // Store message
        const message = {
            sender: sender,
            text: m.text || '',
            timestamp: Date.now(),
            type: m.messageType
        };
        
        lore.messages.push(message);
        lore.totalMessages++;
        
        // Keep only last 1000 messages
        if (lore.messages.length > 1000) {
            lore.messages = lore.messages.slice(-1000);
        }
        
        // Detect repeated phrases (potential inside jokes)
        if (m.text && m.text.length > 10) {
            const words = m.text.toLowerCase().split(' ');
            for (let i = 0; i < words.length - 2; i++) {
                const phrase = words.slice(i, i+3).join(' ');
                const existing = lore.insideJokes?.find(j => j.phrase === phrase);
                if (existing) {
                    existing.count++;
                    if (existing.count > 5 && !existing.established) {
                        existing.established = true;
                        existing.establishedAt = Date.now();
                    }
                } else {
                    if (!lore.insideJokes) lore.insideJokes = [];
                    lore.insideJokes.push({ phrase, count: 1, established: false });
                }
            }
        }
        
        // Generate weekly summary every 100 messages
        if (lore.totalMessages % 100 === 0) {
            // Simple summary generation
            const weekMessages = lore.messages.filter(m => 
                m.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
            );
            
            if (weekMessages.length > 0) {
                const topics = {};
                weekMessages.forEach(m => {
                    if (m.text) {
                        const words = m.text.split(' ').filter(w => w.length > 4);
                        words.forEach(w => {
                            topics[w] = (topics[w] || 0) + 1;
                        });
                    }
                });
                
                lore.weeklySummary = `This week: ${weekMessages.length} messages about ` +
                    Object.entries(topics)
                        .sort((a,b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([word]) => word)
                        .join(', ');
            }
        }
        
        fs.writeFileSync(loreFile, JSON.stringify(lore, null, 2));
        
    } catch (err) {
        console.error("Lore error:", err);
    }
});
