const { cmd } = require('../command');

global.AUTO_SAVE_STATUS = false;  // Default OFF - survives reloads

cmd({
    pattern: "autosavestatus",
    desc: "Toggle auto save status (downloads photos/videos to ./statuses/)",
    category: "utility",
    react: "💾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        global.AUTO_SAVE_STATUS = !global.AUTO_SAVE_STATUS;

        const status = global.AUTO_SAVE_STATUS ? "ON ✅" : "OFF ❌";

        reply(`Auto Save Status: *${status}*\nSaved to: ./statuses/\n\n> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`);

    } catch (e) {
        console.log(e);
        reply(`Error: ${e.message || e}`);
    }
});
