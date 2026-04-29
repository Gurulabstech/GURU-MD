/* Note: Enhanced with Premium Fonts & Aesthetic Emojis. 
   Optimized for Guru MD Steel Edition.
*/

const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu2",
    desc: "Show premium aesthetic menu",
    category: "menu",
    react: "💎",
    filename: __filename
}, async (conn, mek, m, { from, quoted, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '✨', key: mek.key } });

        const userTag = `@${m.sender.split('@')[0]}`;
        const imageUrl = config.MENU_IMAGE_URL || 'https://files.catbox.moe/66h86e.jpg';

        const menuCaption = `
╭━━━〔 𝐆𝐔𝐑𝐔 𝐌𝐃 𝐕𝟓 〕━━━┈⊷
┃ 👤 *𝐔𝐬𝐞𝐫:* ${userTag}
┃ ⏳ *𝐔𝐩𝐭𝐢𝐦𝐞:* ${runtime(process.uptime())}
┃ ⚙️ *𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱
┃ 🛰️ *𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦:* 𝐕𝐞𝐫𝐜𝐞𝐥
╰━━━━━━━━━━━━━━━┈⊷

⚡ *𝕊𝔼𝕃𝔼ℂ𝕋 𝔸 ℂ𝔸𝕋𝔼𝔾𝕆ℝ𝕐* ⚡

📥 𝟙 || 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗠𝗲𝗻𝘂
🛡️ 𝟚 || 𝗚𝗿𝗼𝘂𝗽 𝗠𝗲𝗻𝘂
🎮 𝟛 || 𝗙𝘂𝗻 𝗠𝗲𝗻𝘂
👑 𝟜 || 𝗢𝘄𝗻𝗲𝗿 𝗠𝗲𝗻𝘂
🤖 𝟝 || 𝗔𝗜 𝗠𝗲𝗻𝘂
🏮 𝟞 || 𝗔𝗻𝗶𝗺𝗲 𝗠𝗲𝗻𝘂
♻️ 𝟟 || 𝗖𝗼𝗻𝘃𝗲𝗿𝘁 𝗠𝗲𝗻𝘂
🌐 𝟠 || 𝗢𝘁𝗵𝗲𝗿 𝗠𝗲𝗻𝘂
🎭 𝟡 || 𝗥𝗲𝗮𝗰𝘁𝗶𝗼𝗻𝘀 𝗠𝗲𝗻𝘂
🏠 𝟙𝟘 || 𝗠𝗮𝗶𝗻 𝗠𝗲𝗻𝘂

📌 *𝚁𝚎𝚙𝚕𝚢 𝚠𝚒𝚝𝚑 𝚝𝚑𝚎 𝙽𝚞𝚖𝚋𝚎𝚛 𝚝𝚘 𝙾𝚙𝚎𝚗*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢᴜʀᴜᴛᴇᴄʜ 𝟸𝟶𝟸𝟼`;

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: "ＧＵＲＵ  ＭＤ  Ｖ５",
                body: "ᴛʜᴇ ꜰᴜᴛᴜʀᴇ ᴏꜰ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛꜱ",
                thumbnailUrl: imageUrl,
                sourceUrl: 'https://github.com/itsguruu/GURU',
                mediaType: 1,
                renderLargerThumbnail: false // Keeps the image horizontal/small
            }
        };

        const sentMsg = await conn.sendMessage(from, {
            text: menuCaption,
            contextInfo: contextInfo
        }, { quoted: mek });

        // Play the menu audio
        await conn.sendMessage(from, {
            audio: { url: 'https://github.com/criss-vevo/CRISS-DATA/raw/refs/heads/main/autovoice/menunew.m4a' },
            mimetype: 'audio/mp4',
            ptt: true,
        }, { quoted: mek });

        // === SIMPLE SELECTION HANDLER ===
        const handler = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg.message) return;
            
            const body = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const isReply = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

            if (isReply) {
                const selections = {
                    '1': { name: '𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃', list: '• fb, • tt, • insta, • play, • song' },
                    '2': { name: '𝐆𝐑𝐎𝐔𝐏', list: '• kick, • add, • promote, • tagall' },
                    '3': { name: '𝐅𝐔𝐍', list: '• joke, • hack, • ship, • kiss' },
                    '4': { name: '𝐎𝐖𝐍𝐄𝐑', list: '• restart, • shutdown, • update' },
                    '5': { name: '𝐀𝐈', list: '• gpt, • imagine, • bing, • meta' },
                    '6': { name: '𝐀𝐍𝐈𝐌𝐄', list: '• waifu, • neko, • naruto' },
                    '7': { name: '𝐂𝐎𝐍𝐕𝐄𝐑𝐓', list: '• sticker, • tomp3, • tts' },
                    '8': { name: '𝐎𝐓𝐇𝐄𝐑', list: '• weather, • news, • movie' },
                    '9': { name: '𝐑𝐄𝐀𝐂𝐓', list: '• slap, • hug, • kiss, • kill' },
                    '10': { name: '𝐌𝐀𝐈𝐍', list: '• menu, • alive, • ping' }
                };

                if (selections[body]) {
                    const item = selections[body];
                    await conn.sendMessage(from, { react: { text: '📂', key: receivedMsg.key } });
                    await reply(`✨ *${item.name} 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* ✨\n\n${item.list}\n\n> © ɢᴜʀᴜ ᴍᴅ`);
                }
            }
        };

        conn.ev.on("messages.upsert", handler);
        setTimeout(() => conn.ev.off("messages.upsert", handler), 300000); // Stop listening after 5 mins

    } catch (e) {
        console.error(e);
        reply("⚠️ Error generating menu.");
    }
});
