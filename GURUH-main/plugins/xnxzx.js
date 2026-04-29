const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "xnxx",
    alias: ["dlvideo", "xvid"],
    desc: "Premium XNXX Video Downloader",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`*─── 📥 𝐇𝐎𝐖 𝐓𝐎 𝐔𝐒𝐄 📥 ───*\n\n*Command:* .xnxx <url>\n*Example:* .xnxx https://www.xnxx.com/video-xxxx/title\n\n*🏗️ Edition:* Steel Max`);

        await reply("*⚡ GURU-MD IS PROCESSING...*");

        const apiUrl = `https://apis.davidcyril.name.ng/downloader/xnxx?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.status) {
            return reply("*❌ ERROR:* Link invalid or API down.");
        }

        const data = response.data.result;

        const status = `
╭━━━━〔 *𝔾𝕌ℝ𝕌 𝕄𝔻 𝔻𝕃* 〕━━━━╮
┃
┃ 🎬 *𝐓𝐈𝐓𝐋𝐄:* ${data.title}
┃ 🕒 *𝐃𝐔𝐑𝐀𝐓𝐈𝐎𝐍:* ${data.duration}
┃ 📊 *𝐒𝐓𝐀𝐓𝐒:* ${data.info}
┃ 📥 *𝐐𝐔𝐀𝐋𝐈𝐓𝐘:* High Quality
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*🏗️ 𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱
*⏳ 𝐒𝐭𝐚𝐭𝐮𝐬:* 𝐒𝐞𝐧𝐝𝐢𝐧𝐠 𝐕𝐢𝐝𝐞𝐨...

> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`;

        await conn.sendMessage(from, { 
            video: { url: data.download.high_quality }, 
            caption: status.trim(),
            mimetype: 'video/mp4',
            fileName: `${data.title}.mp4`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406466294627@newsletter',
                    newsletterName: '𝐆𝐔𝐑𝐔 𝐌𝐃: 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑',
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: "𝔾𝕌ℝ𝕌 𝕄𝔻 𝔻𝕆𝕎ℕ𝕃𝕆𝔸𝔻𝔼ℝ",
                    body: `Now Downloading: ${data.title}`,
                    mediaType: 1,
                    sourceUrl: 'https://github.com/itsguruu/GURU',
                    thumbnailUrl: data.thumbnail,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("XNXX DL Error:", e);
        reply(`❌ *FAILED:* ${e.message}`);
    }
});
