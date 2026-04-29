/* Note: GURU MD ALIVE - PREMIUM PAGE STYLE
   Features: Horizontal Banner, RAM/Ping Stats, Newsletter Context.
*/

const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["status", "online", "a"],
    desc: "Check if bot is alive",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const start = new Date().getTime();
        const end = new Date().getTime();
        const ping = end - start;

        // RAM Stats
        const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedRAM = (totalRAM - freeRAM).toFixed(2);
        
        const userTag = `@${m.sender.split('@')[0]}`;

        const status = `
█║▌│█│║▌║││█║▌║▌║
   *𝔾𝕌ℝ𝕌 𝕄𝔻 𝔸𝕃𝕀𝕍𝔼*
█║▌│█│║▌║││█║▌║▌║

👋 𝐇𝐞𝐥𝐥𝐨, ${userTag}

📡 *𝐒𝐭𝐚𝐭𝐮𝐬:* 𝐎𝐧𝐥𝐢𝐧𝐞 🔥
🧠 *𝐑𝐀𝐌:* ${usedRAM}𝐆𝐁 / ${totalRAM}𝐆𝐁
⚡ *𝐏𝐢𝐧𝐠:* ${ping} 𝚖𝚜
⏳ *𝐔𝐩𝐭𝐢𝐦𝐞:* ${runtime(process.uptime())}
🏗️ *𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱

• 𝐅𝐀𝐒𝐓 • 𝐔𝐍𝐅𝐎𝐑𝐆𝐈𝐕𝐈𝐍𝐆 •
     𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅

> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`;

        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/66h86e.jpg" }, // Your horizontal logo
            caption: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406466294627@newsletter',
                    newsletterName: '𝐆𝐔𝐑𝐔 𝐌𝐃: 𝐀𝐋𝐈𝐕𝐄 𝐒𝐓𝐀𝐓𝐔𝐒',
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: "𝔾𝕌ℝ𝕌 𝕄𝔻 𝕀𝕊 𝕆ℕ𝕃𝕀ℕ𝔼",
                    body: "⚡ ᴛʜᴇ ꜰᴜᴛᴜʀᴇ ᴏꜰ ʙᴏᴛꜱ",
                    mediaType: 1,
                    sourceUrl: 'https://github.com/itsguruu/GURU',
                    thumbnailUrl: "https://files.catbox.moe/66h86e.jpg",
                    renderLargerThumbnail: true // Show the horizontal logo clearly
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
