/* ============================================
   GURU MD - PREFIX CHANGER PLUGIN
   COMMAND: .setprefix, .prefix
   ============================================ */

const { cmd } = require('../command');

cmd({
    pattern: "setprefix",
    alias: ["changeprefix", "newprefix"],
    desc: "Change bot prefix for this chat",
    category: "admin",
    react: "🔧",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isOwner, sender, reply }) => {
    try {
        const chatId = from;
        
        // Check permissions
        if (isGroup) {
            const groupMetadata = await conn.groupMetadata(from);
            const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
            if (!isAdmin && !isOwner) {
                return reply("❌ Only group admins can change prefix!");
            }
        } else {
            if (!isOwner) {
                return reply("❌ Only bot owner can change prefix in private chat!");
            }
        }

        if (!q) {
            const currentPrefix = global.getPrefix(chatId);
            const defaultPrefix = global.config?.PREFIX || ',';
            
            const menu = `
╔══════════════════════════════════════╗
║     🔧 *𝐏𝐑𝐄𝐅𝐈𝐗 𝐂𝐇𝐀𝐍𝐆𝐄𝐑*           ║
╠══════════════════════════════════════╣
║ 📍 *Current Settings*                ║
║ ├─ Chat: ${isGroup ? 'Group' : 'Private'}
║ ├─ Current Prefix: ${currentPrefix}
║ └─ Default Prefix: ${defaultPrefix}
╠══════════════════════════════════════╣
║ *Commands:*                          ║
║                                      ║
║ 🔹 .setprefix [new]  - Change prefix ║
║ 🔹 .setprefix reset  - Reset to default ║
║ 🔹 .prefix          - View prefix    ║
╠══════════════════════════════════════╣
║ 📌 *Example:* .setprefix !           ║
╚══════════════════════════════════════╝
            `;
            return reply(menu);
        }

        // Handle reset
        if (q.toLowerCase() === 'reset') {
            global.setPrefix(chatId, 'reset');
            return reply(`✅ *Prefix reset to default!*\n\nDefault prefix: ${global.config?.PREFIX || ','}`);
        }

        // Validate new prefix
        if (q.length > 3) {
            return reply("❌ Prefix must be 1-3 characters long!");
        }

        if (q.match(/[<>{}[\]\/\\]/)) {
            return reply("❌ Prefix cannot contain special characters: < > { } [ ] / \\");
        }

        // Save new prefix
        global.setPrefix(chatId, q);

        const successMsg = `
╔══════════════════════════════════════╗
║     ✅ *𝐏𝐑𝐄𝐅𝐈𝐗 𝐔𝐏𝐃𝐀𝐓𝐄𝐃*           ║
╠══════════════════════════════════════╣
║ 📍 *Chat:* ${isGroup ? 'Group' : 'Private'}
║ ✨ *New Prefix:* ${q}
║ 🔧 *Old Prefix:* ${global.getPrefix(chatId)}
╠══════════════════════════════════════╣
║ 📌 *Now use:* ${q}menu              ║
║ 📌 *Reset:* ${q}setprefix reset      ║
╚══════════════════════════════════════╝
        `;

        reply(successMsg);

    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

// View current prefix
cmd({
    pattern: "prefix",
    alias: ["getprefix"],
    desc: "View current prefix for this chat",
    category: "main",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        const currentPrefix = global.getPrefix(from);
        const defaultPrefix = global.config?.PREFIX || ',';
        
        const prefixInfo = `
╔══════════════════════════════════════╗
║     🔍 *𝐏𝐑𝐄𝐅𝐈𝐗 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍*        ║
╠══════════════════════════════════════╣
║ 📍 *Chat:* ${isGroup ? 'Group' : 'Private'}
║ ✨ *Current Prefix:* ${currentPrefix}
║ 🔧 *Default Prefix:* ${defaultPrefix}
╠══════════════════════════════════════╣
║ 📌 *Example:* ${currentPrefix}menu   ║
║ 📌 *Change:* ${currentPrefix}setprefix  ║
╚══════════════════════════════════════╝
        `;
        
        reply(prefixInfo);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});

// Owner command to list all prefixes
cmd({
    pattern: "listprefixes",
    alias: ["allprefixes"],
    desc: "List all chats with custom prefixes",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ Owner only!");
        
        const prefixes = global.getAllPrefixes();
        const entries = Object.entries(prefixes);
        
        if (entries.length === 0) {
            return reply("📋 No custom prefixes set!");
        }
        
        let list = `
╔══════════════════════════════════════╗
║     📋 *𝐂𝐔𝐒𝐓𝐎𝐌 𝐏𝐑𝐄𝐅𝐈𝐗𝐄𝐒*          ║
╠══════════════════════════════════════╣
`;
        
        entries.slice(0, 15).forEach(([chatId, prefix], i) => {
            const type = chatId.includes('@g.us') ? '👥 Group' : '👤 Private';
            list += `║ ${i+1}. ${type}\n║    Prefix: ${prefix}\n║\n`;
        });
        
        if (entries.length > 15) {
            list += `║ ... and ${entries.length - 15} more\n`;
        }
        
        list += `╚══════════════════════════════════════╝`;
        
        reply(list);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});

// Owner command to reset all prefixes
cmd({
    pattern: "resetallprefix",
    alias: ["resetprefixes"],
    desc: "Reset all custom prefixes",
    category: "owner",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ Owner only!");
        
        // Reset by setting empty object
        const prefixFile = path.join(__dirname, '../prefixes.json');
        fs.writeFileSync(prefixFile, JSON.stringify({}, null, 2));
        
        // Clear in-memory cache
        Object.keys(global.getAllPrefixes()).forEach(key => {
            global.setPrefix(key, 'reset');
        });
        
        reply(`✅ *All custom prefixes reset!*\n\nDefault prefix: ${global.config?.PREFIX || ','}`);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});
