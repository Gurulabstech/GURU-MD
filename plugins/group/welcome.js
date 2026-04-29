// plugins/welcome.js
const { cmd } = require('../command');

// Store welcome state per group (in-memory for simplicity)
// You can later move this to a database if needed
const welcomeSettings = new Map(); // groupJid → boolean

cmd({
    pattern: "welcome(?:\\s+(on|off|enable|disable))?",
    desc: "Toggle welcome messages for new group members (per-group)",
    category: "group",
    react: "👋",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, isGroup, isBotAdmins, groupMetadata }) => {
    if (!isGroup) return reply("This command works only in groups!");
    if (!isBotAdmins) return reply("I need to be an admin to manage welcome messages!");

    try {
        const currentState = welcomeSettings.get(from) ?? false;

        // Show current status
        if (!args[0]) {
            return reply(`Welcome messages are currently *${currentState ? 'ON ✅' : 'OFF ❌'}* in this group.\n\nUse: \`.welcome on/off\``);
        }

        const input = args[0].toLowerCase().trim();
        let newState;

        if (['on', 'enable'].includes(input)) {
            newState = true;
        } else if (['off', 'disable'].includes(input)) {
            newState = false;
        } else {
            return reply("Invalid! Use: `.welcome on` or `.welcome off`");
        }

        // Save per-group setting
        welcomeSettings.set(from, newState);

        // Optional: Send a test welcome message when turning ON
        if (newState) {
            await conn.sendMessage(from, { 
                text: `Welcome messages are now *ENABLED* in ${groupMetadata.subject || 'this group'}! 👋\nNew members will be greeted.\n\n> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech` 
            });
        } else {
            await conn.sendMessage(from, { 
                text: `Welcome messages are now *DISABLED*. No more greetings for new members.\n\n> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech` 
            });
        }

        return reply(`Welcome status updated to: *${newState ? 'ON ✅' : 'OFF ❌'}*`);

    } catch (e) {
        console.error('[welcome command]', e);
        return reply(`Error: ${e.message || 'Something went wrong'}`);
    }
});

// Export a function so index.js can call it safely
module.exports = {
    // This function will be called from index.js
    handleWelcome: async (conn, update) => {
        try {
            if (!welcomeSettings.get(update.id)) return; // disabled for this group
            if (update.action !== 'add') return;

            const group = await conn.groupMetadata(update.id).catch(() => null);
            if (!group) return;

            const newMembers = update.participants || [];
            if (!newMembers.length) return;

            for (const member of newMembers) {
                const welcomeMsg = `Welcome @\( {member.split('@')[0]} to * \){group.subject || 'our group'}*! 👋\n\nEnjoy your stay!\n\n> © GuruTech`;
                await conn.sendMessage(update.id, { 
                    text: welcomeMsg,
                    mentions: [member]
                }).catch(() => {});
            }
        } catch (err) {
            console.error('[welcome event]', err);
        }
    }
};
