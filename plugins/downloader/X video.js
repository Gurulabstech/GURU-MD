const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "xvideo",
    alias: ["xv", "xvdl"],
    desc: "Premium XVideo Downloader",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`*─── 🎬 𝐇𝐎𝐖 𝐓𝐎 𝐔𝐒𝐄 🎬 ───*\n\n*Command:* .xvideo <url>\n*Example:* .xvideo https://www.xvideos.com/video123/title\n\n*🏗️ Edition:* Steel Max`);

        await reply("*⚡ GURU-MD IS EXTRACTING VIDEO...*");

        // Fetching from the XVideo endpoint
        const apiUrl = `https://apis.davidcyril.name.ng/downloader/xvideo?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.success) {
            return reply("*❌ ERROR:* Extraction failed. Ensure the link is valid.");
        }

        const data = response.data;

        const status = `
╭━━━━〔 *𝔾𝕌ℝ𝕌 𝕄𝔻 𝕏𝕍* 〕━━━━╮
┃
┃ 🎬 *𝐓𝐈𝐓𝐋𝐄:* ${data.title}
┃ 📥 *𝐒𝐓𝐀𝐓𝐔𝐒:* Ready to Download
┃ 🏗️ *𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*⏳ 𝐒𝐭𝐚𝐭𝐮𝐬:* 𝐔𝐩𝐥𝐨𝐚𝐝𝐢𝐧𝐠 𝐭𝐨 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩...

> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`;

        await conn.sendMessage(from, { 
            video: { url: data.download_url }, 
            caption: status.trim(),
            mimetype: 'video/mp4',
            fileName: `${data.title}.mp4`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406466294627@newsletter',
                    newsletterName: '𝐆𝐔𝐑𝐔 𝐌𝐃: 𝐗𝐕𝐈𝐃𝐄𝐎 𝐃𝐋',
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: "𝔾𝕌ℝ𝕌 𝕄𝔻 𝕏-𝕍𝕀𝔻𝔼𝕆",
                    body: data.title,
                    mediaType: 1,
                    sourceUrl: 'https://github.com/itsguruu/GURU',
                    thumbnailUrl: data.thumbnail,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("XVideo DL Error:", e);
        reply(`❌ *FAILED:* ${e.message}`);
    }
});
