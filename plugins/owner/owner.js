/* Note: GURU MD OWNER - PREMIUM CONTACT STYLE
   Features: Horizontal Banner, Automated vCard, Premium Fonts.
*/

const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "owner",
    react: "👑", 
    desc: "Get owner contact details",
    category: "main",
    filename: __filename
}, 
async (conn, mek, m, { from }) => {
    try {
        const ownerNumber = config.OWNER_NUMBER.replace('+', ''); 
        const ownerName = config.OWNER_NAME;     

        // Structured vCard for a professional look
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${ownerName}\n` +  
                      `ORG:GuruTech Lab;\n` +
                      `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n` + 
                      'END:VCARD';

        // 1. Send the professional vCard
        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: mek });

        // 2. Send the stylish Info Page with Horizontal Logo
        const ownerCaption = `
█║▌│█│║▌║││█║▌║▌║
   *𝔾𝕌ℝ𝕌 𝕄𝔻 𝕆𝕎ℕ𝔼ℝ*
█║▌│█│║▌║││█║▌║▌║

╭━━〔 👑 *𝐎𝐰𝐧𝐞𝐫 𝐈𝐧𝐟𝐨* 〕━━┈⊷
┃◈ 👤 *𝐍𝐚𝐦𝐞:* ${ownerName}
┃◈ 📞 *𝐍𝐮𝐦𝐛𝐞𝐫:* +${ownerNumber}
┃◈ 🛰️ *𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱
┃◈ 🦾 *𝐒𝐭𝐚𝐭𝐮𝐬:* 𝐀𝐜𝐭𝐢𝐯𝐞
╰──────────────┈⊷

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢᴜʀᴜᴛᴇᴄʜ`;

        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/66h86e.jpg' }, // Updated Horizontal Logo
            caption: ownerCaption,
            contextInfo: {
                mentionedJid: [`${ownerNumber}@s.whatsapp.net`], 
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421164015033@newsletter',
                    newsletterName: '𝐆𝐔𝐑𝐔 𝐌𝐃: 𝐎𝐖𝐍𝐄𝐑 𝐎𝐅𝐅𝐈𝐂𝐄',
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: `ℂ𝕆ℕ𝕋𝔸ℂ𝕋: ${ownerName}`,
                    body: "ɢᴜʀᴜ ᴍᴅ ᴏꜰꜰɪᴄɪᴀʟ ᴏᴡɴᴇʀ",
                    mediaType: 1,
                    sourceUrl: `https://wa.me/${ownerNumber}`,
                    thumbnailUrl: 'https://files.catbox.moe/66h86e.jpg',
                    renderLargerThumbnail: true
                }            
            }
        }, { quoted: mek });

        // 3. Send Voice Note
        await conn.sendMessage(from, {
            audio: { url: 'https://github.com/criss-vevo/CRISS-DATA/raw/refs/heads/main/autovoice/menunew.m4a' },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
    }
});
