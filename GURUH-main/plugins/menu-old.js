/* ============================================
   GURU MD - STYLISH VERTICAL MENU
   Style: Premium Star-Studded Design
   Features: All commands listed vertically
   Version: 30.0.0 | 2026 Edition
   ============================================ */

const config = require('../config');
const { cmd, commands } = require('../command');
const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

cmd({
    pattern: "menu",
    react: "🌟",
    desc: "Show premium vertical menu",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    try {
        const p = config.PREFIX || ',';
        const uptime = runtime(process.uptime());
        const imageUrl = "https://files.catbox.moe/66h86e.jpg";
        const botVersion = version || "30.0.0";
        
        // Get plugin stats
        const pluginsDir = path.join(__dirname, '../plugins');
        const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
        
        const { commands } = require('../command');
        const allCommands = commands || [];

        // Comprehensive category mapping with emojis
        const categoryData = {
            'main': { emoji: '🏠', name: '𝐌𝐀𝐈𝐍', star: '⭐' },
            'ai': { emoji: '🤖', name: '𝐀𝐈 & 𝐂𝐇𝐀𝐓', star: '✨' },
            'downloader': { emoji: '📥', name: '𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑', star: '⚡' },
            'group': { emoji: '👥', name: '𝐆𝐑𝐎𝐔𝐏', star: '👑' },
            'games': { emoji: '🎮', name: '𝐆𝐀𝐌𝐄𝐒', star: '🎯' },
            'fun': { emoji: '🎨', name: '𝐅𝐔𝐍', star: '🌈' },
            'tools': { emoji: '🔧', name: '𝐓𝐎𝐎𝐋𝐒', star: '🛠️' },
            'owner': { emoji: '👑', name: '𝐎𝐖𝐍𝐄𝐑', star: '💎' },
            'admin': { emoji: '⚡', name: '𝐀𝐃𝐌𝐈𝐍', star: '🔰' },
            'audio': { emoji: '🎵', name: '𝐀𝐔𝐃𝐈𝐎', star: '🎼' },
            'anime': { emoji: '🌸', name: '𝐀𝐍𝐈𝐌𝐄', star: '✨' },
            'info': { emoji: 'ℹ️', name: '𝐈𝐍𝐅𝐎', star: '📌' },
            'search': { emoji: '🔍', name: '𝐒𝐄𝐀𝐑𝐂𝐇', star: '🎯' },
            'sticker': { emoji: '🖼️', name: '𝐒𝐓𝐈𝐂𝐊𝐄𝐑', star: '🎨' },
            'utility': { emoji: '🔧', name: '𝐔𝐓𝐈𝐋𝐈𝐓𝐘', star: '⚙️' },
            'convert': { emoji: '🔄', name: '𝐂𝐎𝐍𝐕𝐄𝐑𝐓', star: '🔄' },
            'media': { emoji: '🎬', name: '𝐌𝐄𝐃𝐈𝐀', star: '📹' },
            'privacy': { emoji: '🔒', name: '𝐏𝐑𝐈𝐕𝐀𝐂𝐘', star: '🛡️' },
            'misc': { emoji: '📌', name: '𝐌𝐈𝐒𝐂', star: '🔹' }
        };

        // Group commands by category
        const categories = {};
        
        allCommands.forEach(cmd => {
            if (cmd.dontAddCommandList) return;
            const category = cmd.category || 'misc';
            if (!categories[category]) {
                categories[category] = [];
            }
            if (!categories[category].includes(cmd.pattern)) {
                categories[category].push(cmd.pattern);
            }
        });

        // Sort commands in each category
        Object.keys(categories).forEach(key => {
            categories[key].sort((a, b) => a.localeCompare(b));
        });

        const totalCommands = allCommands.filter(cmd => !cmd.dontAddCommandList).length;

        // PREMIUM STYLISH HEADER
        let menuText = `🌟 *✨ ＧＵＲＵ ＭＤ ｖ${botVersion} ✨* 🌟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─「 👋 *𝐇𝐞𝐥𝐥𝐨, ${pushname || 'User'} 」
│
├─ 📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐒𝐭𝐚𝐭𝐬*
│  ├─ 📁 𝐏𝐥𝐮𝐠𝐢𝐧𝐬: ${pluginFiles.length}
│  ├─ 🔧 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: ${totalCommands}
│  ├─ ⏱️ 𝐔𝐩𝐭𝐢𝐦𝐞: ${uptime}
│  └─ 🛡️ 𝐌𝐨𝐝𝐞: ${config.MODE || 'public'}
│
`;

        // Add each category with ALL commands vertically
        const sortedCategories = Object.keys(categories).sort((a, b) => {
            if (a === 'owner') return 1;
            if (b === 'owner') return -1;
            if (a === 'main') return -1;
            if (b === 'main') return 1;
            return a.localeCompare(b);
        });

        for (const category of sortedCategories) {
            const cmds = categories[category];
            if (cmds && cmds.length > 0) {
                const catInfo = categoryData[category] || { emoji: '📌', name: category.toUpperCase(), star: '✦' };
                
                menuText += `┌─「 ${catInfo.emoji} *${catInfo.name}* ${catInfo.star} (${cmds.length}) 」\n`;
                
                // List ALL commands vertically with arrows
                cmds.forEach((cmdName, index) => {
                    const isLast = index === cmds.length - 1;
                    const arrow = isLast ? '└─→' : '├─→';
                    menuText += `│ ${arrow} ${p}${cmdName}\n`;
                });
                menuText += `│\n`;
            }
        }

        // STYLISH FOOTER
        menuText += `└─「 🧷 ✦ 🧷 」
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *𝐓𝐨𝐭𝐚𝐥*: ${totalCommands} 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬
📁 *𝐏𝐥𝐮𝐠𝐢𝐧𝐬*: ${pluginFiles.length} 𝐋𝐨𝐚𝐝𝐞𝐝
⚡ *𝐏𝐫𝐞𝐟𝐢𝐱*: ${p}
💡 *𝐓𝐢𝐩*: ${p}help <command>

✨ *© 2026 GURU-TECH SYSTEMS* ✨`;

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: menuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421164015033@newsletter',
                    newsletterName: '✨ GURU MD PREMIUM ✨',
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: `✨ GURU MD v${botVersion} ✨`,
                    body: `🌟 ${totalCommands} Premium Commands`,
                    mediaType: 1,
                    thumbnailUrl: imageUrl,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
    }
});

// Category-specific menu with ALL commands
cmd({
    pattern: "list",
    alias: ["all"],
    desc: "List all commands in one place",
    category: "main",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, p, reply }) => {
    try {
        const { commands } = require('../command');
        const allCmds = commands.filter(cmd => !cmd.dontAddCommandList);
        
        let list = `📋 *𝐀𝐋𝐋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* 📋\n━━━━━━━━━━━━━━━━━━\n`;
        
        allCmds.forEach((cmd, i) => {
            const number = (i + 1).toString().padStart(2, '0');
            list += `${number}. ${p}${cmd.pattern} ${cmd.emoji || ''}\n`;
        });
        
        list += `━━━━━━━━━━━━━━━━━━\n🌟 *Total*: ${allCmds.length} Commands`;
        
        reply(list);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});

// Search commands
cmd({
    pattern: "find",
    alias: ["searchcmd"],
    desc: "Search for commands",
    category: "main",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, p, reply }) => {
    try {
        if (!q) return reply("❌ What command are you looking for?");
        
        const { commands } = require('../command');
        const results = commands.filter(cmd => 
            !cmd.dontAddCommandList && 
            (cmd.pattern.includes(q.toLowerCase()) || 
             (cmd.desc && cmd.desc.toLowerCase().includes(q.toLowerCase())))
        );
        
        if (results.length === 0) {
            return reply(`❌ No commands found matching "${q}"`);
        }
        
        let searchRes = `🔍 *𝐒𝐞𝐚𝐫𝐜𝐡 𝐑𝐞𝐬𝐮𝐥𝐭𝐬:* "${q}"\n━━━━━━━━━━━━━━━━━━\n`;
        
        results.slice(0, 20).forEach((cmd, i) => {
            searchRes += `${i+1}. ${p}${cmd.pattern} ${cmd.emoji || ''}\n   📝 ${cmd.desc || 'No description'}\n`;
        });
        
        if (results.length > 20) {
            searchRes += `\n... and ${results.length - 20} more`;
        }
        
        searchRes += `\n━━━━━━━━━━━━━━━━━━\n📊 Found: ${results.length} commands`;
        
        reply(searchRes);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});

// Category viewer
cmd({
    pattern: "category",
    alias: ["cat", "viewcat"],
    desc: "View all commands in a category",
    category: "main",
    react: "📂",
    filename: __filename
}, async (conn, mek, m, { from, q, p, reply }) => {
    try {
        const { commands } = require('../command');
        
        // Get unique categories
        const categories = [...new Set(commands.map(c => c.category).filter(Boolean))];
        
        if (!q) {
            let catList = `📂 *𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒*\n━━━━━━━━━━━━━━━━━━\n`;
            categories.sort().forEach((cat, i) => {
                const count = commands.filter(c => c.category === cat).length;
                catList += `${i+1}. ${cat.toUpperCase()} (${count} commands)\n`;
            });
            catList += `━━━━━━━━━━━━━━━━━━\n💡 Use: .category [name]`;
            return reply(catList);
        }
        
        const catCommands = commands.filter(cmd => 
            cmd.category === q.toLowerCase() && !cmd.dontAddCommandList
        );
        
        if (catCommands.length === 0) {
            return reply(`❌ Category "${q}" not found!`);
        }
        
        let result = `📂 *${q.toUpperCase()}* [${catCommands.length}]\n━━━━━━━━━━━━━━━━━━\n`;
        
        catCommands.forEach((cmd, i) => {
            result += `${i+1}. ${p}${cmd.pattern} ${cmd.emoji || ''}\n`;
        });
        
        result += `━━━━━━━━━━━━━━━━━━\n📌 Total: ${catCommands.length} commands`;
        
        reply(result);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});
