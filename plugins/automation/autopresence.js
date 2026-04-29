const { cmd } = require('../command');

// Initialize global variable if not exists
if (!global.AUTO_PRESENCE) {
    global.AUTO_PRESENCE = 'off';
}

cmd({
    pattern: "autopresence",
    alias: ["presence", "autostatus"],
    desc: "Set or view auto-presence status (online | typing | recording | off)",
    category: "utility",
    react: "📱",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        // Show current status if no arguments
        if (!args || args.length === 0) {
            return reply(`📱 *Current Auto-Presence*\n\nStatus: *${global.AUTO_PRESENCE.toUpperCase()}*\n\n*Available options:*\n• online\n• typing\n• recording\n• off\n\nExample: .autopresence online`);
        }

        // Get the first argument
        const input = args[0].toLowerCase().trim();
        const validOptions = ['online', 'typing', 'recording', 'off'];

        // Check if input is valid
        if (!validOptions.includes(input)) {
            return reply(`❌ Invalid option!\n\n*Valid options:*\n${validOptions.map(v => `• ${v}`).join('\n')}\n\nExample: .autopresence online`);
        }

        // Update global setting
        global.AUTO_PRESENCE = input;

        // Apply presence update if not 'off'
        if (input !== 'off') {
            try {
                await conn.sendPresenceUpdate(input, from);
            } catch (presenceErr) {
                console.log('[Presence] Failed to set presence:', presenceErr.message);
            }
        }

        // Send confirmation
        return reply(`✅ *Auto-Presence Updated*\n\nStatus: *${input.toUpperCase()}*\n\n> © GURU BOT`);

    } catch (e) {
        console.error('[autopresence Error]:', e);
        return reply(`❌ Error: ${e.message || 'Something went wrong'}`);
    }
});

// Auto-presence handler - add this to automatically apply presence
// You can call this function from your main message handler
async function applyAutoPresence(conn, from) {
    if (!global.AUTO_PRESENCE || global.AUTO_PRESENCE === 'off') return;
    
    try {
        await conn.sendPresenceUpdate(global.AUTO_PRESENCE, from);
    } catch (e) {
        // Silently fail - presence is optional
    }
}

// Export for use in main handler
module.exports = {
    applyAutoPresence
};
