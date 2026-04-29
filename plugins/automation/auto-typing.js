const config = require('../config');

/**
 * GURU-MD Auto Typing / Composing Indicator Plugin
 * Shows "typing..." when someone messages the bot
 */

let handler = m => m;

handler.all = async function (m) {
    // Feature disabled in config → exit early
    // We check both global and config to ensure compatibility
    if (config.AUTO_TYPING !== 'true' && !global.autotyping) return;

    // Prevent bot from typing to itself (infinite loop protection)
    if (m.fromMe || m.isBaileys || !m.chat) return;

    try {
        // In GURU-MD, 'conn' is available via 'this' inside handler.all
        const conn = this;

        // Subscribe to presence updates (required for some multi-device sessions)
        await conn.presenceSubscribe(m.chat);

        // Show composing / typing indicator
        await conn.sendPresenceUpdate('composing', m.chat);

        // Stop typing after a natural random delay (2.5–6 seconds)
        const randomDelay = 2500 + Math.floor(Math.random() * 3500);
        
        setTimeout(async () => {
            // 'paused' is the standard way to stop the typing UI in Baileys
            await conn.sendPresenceUpdate('paused', m.chat);
        }, randomDelay);

    } catch (err) {
        // Log error silently — don't crash the bot
        console.log('[AUTO-TYPING ERROR]:', err.message || err);
    }
};

// Plugin Metadata
handler.help = ['autotyping'];
handler.tags = ['main'];
handler.command = false; // Runs on every message, no command needed

module.exports = handler;
