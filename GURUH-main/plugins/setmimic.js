// plugins/setmimic.js
const { cmd } = require('../command');

global.MIMIC_TARGET = null; // jid to mimic

cmd({
    pattern: "mimic ?(.*)",
    desc: "Make bot copy someone's typing/presence style",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { reply, args, isOwner }) => {
    if (!isOwner) return reply("Owner only!");

    if (!args[0]) {
        return reply(global.MIMIC_TARGET 
            ? `Currently mimicking ${global.MIMIC_TARGET}` 
            : "No one is being mimicked.\n.mimic 2547xxx@s.whatsapp.net");
    }

    if (args[0].toLowerCase() === 'stop') {
        global.MIMIC_TARGET = null;
        return reply("Mimic stopped.");
    }

    const target = args[0].trim();
    if (!target.includes('@s.whatsapp.net')) return reply("Invalid JID");

    global.MIMIC_TARGET = target;
    await reply(`Now mimicking ${target}'s typing style 😏`);
});

// Mimic presence is handled in index.cjs messages.upsert handler
// via global.MIMIC_TARGET check — no module-level conn available here
