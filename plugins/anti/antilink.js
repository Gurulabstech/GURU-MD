/* ============================================
   GURU MD - ANTI-LINK SYSTEM
   COMMAND: .antilink [on/off]
   FIXED: Admin detection for group creator and admins
   STYLE: Clean & Organized
   ============================================ */

const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

// Store anti-link settings per group
let antiLinkSettings = {};

// Load settings
const settingsFile = path.join(__dirname, '../antilink.json');
try {
    if (fs.existsSync(settingsFile)) {
        antiLinkSettings = JSON.parse(fs.readFileSync(settingsFile));
        console.log('[ANTILINK] Settings loaded');
    }
} catch (e) {
    console.log('[ANTILINK] Error loading settings:', e);
}

// Save settings
function saveSettings() {
    try {
        fs.writeFileSync(settingsFile, JSON.stringify(antiLinkSettings, null, 2));
    } catch (e) {
        console.log('[ANTILINK] Error saving settings:', e);
    }
}

// Check if message contains group link
function containsGroupLink(text) {
    if (!text) return false;
    
    const linkPatterns = [
        /chat\.whatsapp\.com\/[A-Za-z0-9]+/i,
        /whatsapp\.com\/channel\/[A-Za-z0-9]+/i,
        /wa\.me\/[A-Za-z0-9]+/i,
        /invite\.whatsapp\.com\/[A-Za-z0-9]+/i,
        /chat\.whatsapp\.com\/[A-Za-z0-9]+/i,
        /https?:\/\/\S+\.whatsapp\.com\S+/i
    ];
    
    return linkPatterns.some(pattern => pattern.test(text));
}

// Function to check if user is admin (more reliable)
async function isUserAdmin(conn, groupId, userId) {
    try {
        const groupMetadata = await conn.groupMetadata(groupId);
        const participants = groupMetadata.participants;
        
        // Clean user ID (remove any extra characters)
        const cleanUserId = userId.split('@')[0] + '@s.whatsapp.net';
        
        // Find the participant
        const participant = participants.find(p => 
            p.id === cleanUserId || 
            p.id === userId || 
            p.id.split('@')[0] === userId.split('@')[0]
        );
        
        if (!participant) return false;
        
        // Check if admin or superadmin
        return participant.admin === 'admin' || participant.admin === 'superadmin';
        
    } catch (err) {
        console.error('[ANTILINK] Error checking admin status:', err);
        return false;
    }
}

// Main command to toggle anti-link
cmd({
    pattern: "antilink",
    alias: ["antilink", "antigroup", "antigrouplink"],
    desc: "Enable/disable anti-link in group",
    category: "group",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, isGroup, sender, pushname }) => {
    try {
        // Initial reaction
        await conn.sendMessage(from, {
            react: {
                text: "🔗",
                key: mek.key
            }
        });

        // Check if in group
        if (!isGroup) {
            return reply("❌ This command can only be used in groups!");
        }

        // Manually check if user is admin
        const isAdmin = await isUserAdmin(conn, from, sender);
        
        if (!isAdmin) {
            return reply("❌ *You are not an admin!*\n\nOnly group admins can change anti-link settings.\n\nIf you are an admin, please try again or promote the bot to admin temporarily.");
        }

        // Check query
        if (!q) {
            const status = antiLinkSettings[from]?.enabled ? 'ON' : 'OFF';
            const setting = antiLinkSettings[from];
            
            let statusMsg = `🔗 *Anti-Link Settings*

• *Group:* ${m.groupName || 'Unknown'}
• *Status:* ${status === 'ON' ? '✅ Enabled' : '❌ Disabled'}`;

            if (setting?.enabled) {
                statusMsg += `\n• *Enabled by:* ${setting.setName || 'Admin'}
• *Enabled on:* ${new Date(setting.time).toLocaleString()}`;
            }

            statusMsg += `\n\n*Usage:* 
• .antilink on  - Enable anti-link
• .antilink off - Disable anti-link

*Note:* When enabled, the bot will warn about links. For auto-delete, bot needs to be admin.`;
            
            return reply(statusMsg);
        }

        // Handle on/off
        if (q.toLowerCase() === 'on') {
            antiLinkSettings[from] = {
                enabled: true,
                setBy: sender,
                setName: pushname || 'Admin',
                time: new Date().toISOString()
            };
            saveSettings();
            
            const onMsg = `✅ *Anti-Link Enabled*

• *Enabled by:* ${pushname || 'Admin'}
• *Status:* Links will be monitored
• *Action:* Non-admins will be warned

⚠️ *Note:* For automatic deletion, please make the bot a group admin.`;

            await reply(onMsg);
            
        } else if (q.toLowerCase() === 'off') {
            delete antiLinkSettings[from];
            saveSettings();
            
            await reply(`❌ *Anti-Link Disabled*\n\n• *Disabled by:* ${pushname || 'Admin'}\n• Members can now share links freely.`);
        } else {
            return reply("❌ Invalid option! Use: .antilink on  or  .antilink off");
        }

        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {
        console.error('[ANTILINK] Error:', err);
        reply(`❌ Error: ${err.message}`);
    }
});

// Link detector (runs automatically)
cmd({
    pattern: "linkdetector",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, isGroup, sender, reply }) => {
    try {
        // Only work in groups where anti-link is enabled
        if (!isGroup || !antiLinkSettings[from]?.enabled) return;

        // Get message text
        const body = m.message?.conversation || 
                     m.message?.extendedTextMessage?.text || 
                     m.message?.imageMessage?.caption || 
                     m.message?.videoMessage?.caption || '';

        // Check if contains link
        if (containsGroupLink(body)) {
            console.log('[ANTILINK] Link detected in:', from);

            // Check if sender is admin
            const isAdmin = await isUserAdmin(conn, from, sender);
            
            if (isAdmin) {
                // Allow admins to share links
                return;
            }

            // Get the admin who enabled it
            const setting = antiLinkSettings[from];
            const adminName = setting?.setName || 'Admin';

            // Warn the user
            const warnMsg = `⚠️ *Anti-Link System*

@${sender.split('@')[0]}, WhatsApp group/channel links are not allowed in this group!

• *Enabled by:* ${adminName}
• *Action:* Please avoid sharing links

_If you're an admin, use .antilink off to disable_`;

            await conn.sendMessage(from, {
                text: warnMsg,
                mentions: [sender]
            }, { quoted: m });

            // Try to delete if bot is admin (optional)
            try {
                const groupMetadata = await conn.groupMetadata(from);
                const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                const isBotAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin === 'admin' || 
                                  groupMetadata.participants.find(p => p.id === botNumber)?.admin === 'superadmin';
                
                if (isBotAdmin) {
                    await conn.sendMessage(from, {
                        delete: m.key
                    });
                }
            } catch (e) {
                // Bot not admin, can't delete
                console.log('[ANTILINK] Bot not admin, skipping delete');
            }
        }
    } catch (err) {
        console.error('[ANTILINK] Detector error:', err);
    }
});

// Status check command
cmd({
    pattern: "antilinkstatus",
    alias: ["antistatus"],
    desc: "Check anti-link status in group",
    category: "group",
    react: "📊",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup, sender }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    
    const setting = antiLinkSettings[from];
    const status = setting?.enabled ? '✅ Enabled' : '❌ Disabled';
    const isAdmin = await isUserAdmin(conn, from, sender);
    
    let msg = `📊 *Anti-Link Status*

• *Group:* ${m.groupName || 'Unknown'}
• *Status:* ${status}
• *Your Role:* ${isAdmin ? '👑 Admin' : '👤 Member'}`;

    if (setting?.enabled) {
        msg += `\n• *Enabled by:* ${setting.setName || 'Admin'}
• *Enabled on:* ${new Date(setting.time).toLocaleString()}`;
    }

    msg += `\n\n${setting?.enabled ? '⚠️ Links from non-admins are monitored.' : '💡 Use .antilink on to enable protection (admin only).'}`;

    await reply(msg);
});

// Debug command to check admin status
cmd({
    pattern: "checkadmin",
    alias: ["amidadmin", "admincheck"],
    desc: "Check if you are admin",
    category: "group",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup, sender, pushname }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    
    const isAdmin = await isUserAdmin(conn, from, sender);
    
    if (isAdmin) {
        reply(`✅ *${pushname || 'You'} are an admin!*\n\nYou have full access to admin commands.`);
    } else {
        reply(`❌ *${pushname || 'You'} are NOT an admin!*\n\nYou cannot use admin commands.`);
    }
});
