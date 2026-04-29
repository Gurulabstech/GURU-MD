// plugins/autoviewstatus.js
const { cmd } = require('../command');

cmd({
    pattern: "autoviewstatus(?: (on|off))?",
    desc: "Toggle or set auto-view status (mark statuses as seen automatically)",
    category: "utility",
    react: "👀",
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        let newState = global.AUTO_VIEW_STATUS;

        if (args[0]) {
            const input = args[0].toLowerCase();
            if (['on', 'enable', 'true', '1'].includes(input)) {
                newState = true;
            } else if (['off', 'disable', 'false', '0'].includes(input)) {
                newState = false;
            } else {
                return reply("Invalid argument! Use: `.autoviewstatus on` or `.autoviewstatus off`");
            }
        } else {
            newState = !global.AUTO_VIEW_STATUS;
        }

        global.AUTO_VIEW_STATUS = newState;

        const statusText = newState ? "ON ✅" : "OFF ❌";

        await conn.sendMessage(from, { 
            react: { text: newState ? '✅' : '❌', key: mek.key }
        });

        reply(`Auto View Status: *${statusText}*\n\n> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`);

    } catch (e) {
        console.error('[autoviewstatus]', e);
        reply(`Error: ${e.message || 'Failed to toggle'}`);
    }
});
