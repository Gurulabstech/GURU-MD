// plugins/settingsmenu.js
const { cmd } = require('../command');

cmd({
    pattern: "settings|setmenu",
    desc: "Show all toggleable bot settings",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { reply, isOwner }) => {
    if (!isOwner) return reply("Owner only!");

    const status = (v) => v ? 'ON ✅' : 'OFF ❌';

    const menu = `
*Bot Settings Menu*

1. Ghost Mode: ${status(global.GHOST_MODE)}
2. Fake Read: ${status(global.FAKE_READ)}
3. Auto-Translate: ${status(global.AUTO_TRANSLATE)} → ${global.TRANSLATE_TO}
4. Fake Reply Troll: ${status(fakeReplyEnabled.size > 0)}
5. Command Cooldown: ${global.COMMAND_COOLDOWN_MS / 1000}s
6. Random Bio Changer: ${bioInterval ? 'Running' : 'Stopped'}

Toggle with: .ghost on/off, .fakeread on/off, etc.
`;

    await reply(menu);
});
