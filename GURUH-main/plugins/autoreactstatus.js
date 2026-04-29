const { cmd } = require('../command');

global.AUTO_REACT_STATUS = false; // default off

cmd({
    pattern: "autoreactstatus",
    alias: ["autostatusreact", "reactstatus"],
    desc: "Toggle auto react to status updates with random emoji",
    category: "utility",
    react: "🎭",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        global.AUTO_REACT_STATUS = !global.AUTO_REACT_STATUS;

        const status = global.AUTO_REACT_STATUS ? "ON ✅" : "OFF ❌";

        await reply(`Auto react to status: *${status}*`);

        // Optional: react to the command message itself
        await conn.sendMessage(from, { react: { text: global.AUTO_REACT_STATUS ? '🎉' : '❌', key: mek.key } });
    } catch (e) {
        console.log(e);
        await reply(`Error: ${e.message || e}`);
    }
});

// The actual auto-react logic (runs when any status is posted)
if (!global.AUTO_REACT_STATUS_HANDLER_ADDED) {
    global.AUTO_REACT_STATUS_HANDLER_ADDED = true;

    const { getContentType } = require('gifted-baileys');

    // Add this to your main index.js OR here if you prefer single-file plugins
    // But recommended: put in your main connection handler (messages.upsert)

    // Example how it should look in index.js (messages.upsert event):
    /*
    conn.ev.on('messages.upsert', async (mekUpdate) => {
        const msg = mekUpdate.messages[0];
        if (!msg?.message) return;

        if (msg.key.remoteJid === 'status@broadcast') {
            if (global.AUTO_REACT_STATUS) {
                const emojis = [
                    '🔥', '❤️', '💯', '😂', '😍', '👏', '🙌', '🎉', '✨', '💪',
                    '🥰', '😎', '🤩', '🌟', '💥', '👀', '😭', '🤣', '🥳', '💜'
                ];

                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                try {
                    await conn.sendMessage(msg.key.remoteJid, {
                        react: {
                            text: randomEmoji,
                            key: msg.key
                        }
                    }, { statusJidList: [msg.key.participant, conn.user.id] });

                    console.log(`[AUTO-REACT STATUS] Reacted with ${randomEmoji} to ${msg.key.participant || 'unknown'}`);
                } catch (err) {
                    console.error("Auto react failed:", err);
                }
            }
        }

        // ... rest of your messages.upsert code
    });
    */
}
