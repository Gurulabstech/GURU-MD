/* Note: GURU MD STEEL EDITION - LIGHTWEIGHT VERTICAL
   - Design: Minimalist Steel (Optimized for long lists)
   - Layout: 100% Vertical (Single Column)
   - Status: Reduced character payload to prevent "Unable to send"
*/

const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu3",
    alias: ["allmenu", "fullmenu"],
    desc: "Vertical Steel Menu",
    category: "menu",
    react: "⛓️",
    filename: __filename
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const logoUrl = "https://files.catbox.moe/66h86e.jpg"; 

        // Main Caption - Minimalist vertical style
        let dec = `║ 𝔾𝕌ℝ𝕌 𝕄𝔻 𝔸𝕃𝕃 𝕄𝔼ℕ𝕌 ║
        
『 🛰️ 𝐒𝐘𝐒𝐓𝐄𝐌 』
┃ 👤 *User:* @${m.sender.split('@')[0]}
┃ ⏳ *Up:* ${runtime(process.uptime())}
┃ ⚙️ *Mode:* ${config.MODE || 'public'}
┃ 🔑 *Prefix:* ${config.PREFIX || '.'}

『 📥 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 』
┃◈ facebook | tiktok | twitter
┃◈ instagram | ytmp3 | ytmp4
┃◈ mediafire | gdrive | apk
┃◈ spotify | pinterest | play

『 👥 𝐆𝐑𝐎𝐔𝐏 』
┃◈ kick | add | promote | demote
┃◈ tagall | hidetag | mute | unmute
┃◈ lock | unlock | invitelink
┃◈ welcome | groupinfo | everyone

『 🤖 𝐀𝐈 』
┃◈ ai | gpt | ask | chat
┃◈ imagine | openai | deepseek
┃◈ aivideo | fluxai | stability
┃◈ imgscan | aivoice

『 🛠️ 𝐓𝐎𝐎𝐋𝐒 』
┃◈ sticker | vsticker | take
┃◈ tts | tomp3 | topdf | tourl
┃◈ fancy | base64 | calc | weather
┃◈ tempmail | tempnum | translate

『 🎉 𝐅𝐔𝐍 』
┃◈ ship | 8ball | coinflip
┃◈ compliment | joke | aura
┃◈ bite | bonk | hug | kiss
┃◈ waifu | neko | maid

『 👑 𝐎𝐖𝐍𝐄𝐑 』
┃◈ owner | restart | shutdown
┃◈ setpp | block | unblock
┃◈ broadcast | ban | unban
┃◈ alive | ping | botinfo

『 ⚙️ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 』
┃◈ mode | setprefix | autoreply
┃◈ autoreact | autoread | autoview
┃◈ antidelete | autobio | welcome

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢᴜʀᴜᴛᴇᴄʜ 𝟐𝟎𝟐𝟔`;

        await conn.sendMessage(from, {
            image: { url: logoUrl },
            caption: dec,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: "𝔾𝕌ℝ𝕌 𝕄𝔻: 𝕊𝕋𝔼𝔼𝕃 𝕍𝔼ℝ𝕋𝕀ℂ𝔸𝕃",
                    body: "⚡ LIGHTWEIGHT STABLE EDITION",
                    mediaType: 1,
                    sourceUrl: 'https://github.com/itsguruu/GURU',
                    thumbnailUrl: logoUrl,
                    renderLargerThumbnail: true 
                }
            }
        }, { quoted: mek });

        // Optional Audio - wrapped to prevent failure
        try {
            await conn.sendMessage(from, {
                audio: { url: 'https://github.com/criss-vevo/CRISS-DATA/raw/refs/heads/main/autovoice/menunew.m4a' },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: mek });
        } catch (e) {}
        
    } catch (e) {
        console.error(e);
        // Final fallback: Text only if image caption is still too long
        reply("❌ Error with Image Caption. Sending Text Version:\n\n" + dec);
    }
});
