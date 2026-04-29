/* ============================================
   GURU MD - AUTO SAVE VIEW ONCE MEDIA
   COMMAND: .autosave (on/off)
   FEATURES: Automatically saves view-once media to PM
   ============================================ */

const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

// Store user preferences
const userSettings = {};

cmd({
    pattern: "autosave",
    alias: ["saveonce", "autoview"],
    desc: "Auto-save view-once media to your PM",
    category: "tools",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { from, args, q, isGroup, sender, reply }) => {
    try {
        const userId = sender;
        
        if (!q) {
            const status = userSettings[userId]?.autosave ? 'ON' : 'OFF';
            const menu = `
╔══════════════════════════════════════╗
║     📸 *AUTO SAVE VIEW ONCE*         ║
╠══════════════════════════════════════╣
║ 👤 *User:* @${userId.split('@')[0]}
║ ⚙️ *Status:* ${status === 'ON' ? '🟢 ENABLED' : '🔴 DISABLED'}
╠══════════════════════════════════════╣
║ *Commands:*                          ║
║ ├─ .autosave on  - Enable auto-save  ║
║ ├─ .autosave off - Disable auto-save ║
║ └─ .autosave     - Check status      ║
╠══════════════════════════════════════╣
║ 📌 *How it works:*                    ║
║ When someone sends view-once media,   ║
║ it will be automatically saved and    ║
║ forwarded to your private chat.       ║
╚══════════════════════════════════════╝
            `;
            return reply(menu);
        }
        
        if (q === 'on') {
            userSettings[userId] = { ...userSettings[userId], autosave: true };
            return reply(`✅ *Auto-save enabled!*\n\nView-once media will be sent to your PM.`);
        }
        
        if (q === 'off') {
            userSettings[userId] = { ...userSettings[userId], autosave: false };
            return reply(`❌ *Auto-save disabled!*`);
        }
        
    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

// Event handler for view-once messages
cmd({
    pattern: "viewonce",
    desc: "Handle view-once media",
    category: "system",
    filename: __filename
}, async (conn, mek, m, { from, isGroup }) => {
    try {
        // Check if message has view-once media
        if (m.message?.viewOnceMessage || m.message?.viewOnceMessageV2) {
            
            // Extract the view-once content
            const viewOnceMsg = m.message.viewOnceMessage || m.message.viewOnceMessageV2;
            const sender = m.key.participant || m.key.remoteJid;
            const senderId = sender.split('@')[0];
            
            // Get all users who enabled auto-save
            for (const [userId, settings] of Object.entries(userSettings)) {
                if (settings.autosave) {
                    try {
                        // Forward to user's PM
                        await conn.sendMessage(userId, {
                            text: `📸 *View-Once Media Received*\n\n👤 From: @${senderId}\n⏱️ Time: ${new Date().toLocaleString()}`,
                            mentions: [sender]
                        });
                        
                        // Forward the media
                        await conn.sendMessage(userId, {
                            forward: m,
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true
                            }
                        });
                        
                        console.log(`✅ View-once saved for ${userId}`);
                    } catch (err) {
                        console.log(`Failed to send to ${userId}: ${err.message}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error("View-once handler error:", err);
    }
});

// List all enabled users
cmd({
    pattern: "autolist",
    desc: "List users with auto-save enabled",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ Owner only!");
        
        const enabledUsers = Object.entries(userSettings)
            .filter(([_, settings]) => settings.autosave)
            .map(([userId]) => `👤 @${userId.split('@')[0]}`);
        
        let list = `
╔══════════════════════════════════════╗
║     📋 *AUTO-SAVE ENABLED USERS*     ║
╠══════════════════════════════════════╣
`;
        
        if (enabledUsers.length === 0) {
            list += `║ No users enabled                         ║`;
        } else {
            enabledUsers.forEach(user => {
                list += `║ ${user}\n`;
            });
        }
        
        list += `╠══════════════════════════════════════╣
║ Total: ${enabledUsers.length} users                ║
╚══════════════════════════════════════╝`;
        
        reply(list);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});
