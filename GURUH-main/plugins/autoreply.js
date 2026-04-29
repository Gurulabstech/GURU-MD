const { cmd } = require('../command');

let autoReplyText = global.AUTO_REPLY_TEXT || "Hello! I'm currently busy. Will check later 😎";

cmd({
    pattern: "autoreply(?: (on|off|set))? ?(.*)?",
    desc: "Toggle or set auto-reply message",
    category: "utility",
    react: "💬",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, q }) => {
    try {
        if (global.AUTO_REPLY === undefined) global.AUTO_REPLY = false;

        const cmd = args[0] ? args[0].toLowerCase() : '';
        const text = q || args.slice(1).join(' ');

        if (!cmd) {
            return reply(
                `*Auto-Reply Status:* ${global.AUTO_REPLY ? "ON ✅" : "OFF ❌"}\n` +
                `*Current message:* ${autoReplyText}\n\n` +
                `Usage:\n` +
                `• .autoreply on\n` +
                `• .autoreply off\n` +
                `• .autoreply set <your text>\n\n` +
                `> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`
            );
        }

        if (cmd === 'on') {
            global.AUTO_REPLY = true;
            return reply(`*Auto-Reply turned ON ✅*\nReply: "${autoReplyText}"`);
        }

        if (cmd === 'off') {
            global.AUTO_REPLY = false;
            return reply(`*Auto-Reply turned OFF ❌*`);
        }

        if (cmd === 'set') {
            if (!text) return reply("Please provide the reply text!\nExample: .autoreply set Assalamu alaikum! Busy rn 🔥");
            autoReplyText = text;
            global.AUTO_REPLY_TEXT = text;
            return reply(`*Auto-reply text updated!*\nNew: "${autoReplyText}"`);
        }

        reply("Invalid command. Use on / off / set <text>");

    } catch (e) {
        reply(`Error: ${e.message}`);
    }
});
