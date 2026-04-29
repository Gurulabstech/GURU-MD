const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "randomvid",
    alias: ["rvid", "surprise"],
    desc: "Download a random trending video directly",
    category: "downloader",
    react: "🎲",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await reply("*⚡ GURU-MD IS EXPLORING TRENDING CONTENT...*");

        // Step 1: Search for a random set of videos
        // You can change 'trending' to any keyword you like
        const searchUrl = `https://apis.davidcyril.name.ng/downloader/xnxxsearch?q=trending`; 
        const searchResponse = await axios.get(searchUrl);

        if (!searchResponse.data || !searchResponse.data.status || searchResponse.data.result.length === 0) {
            return reply("*❌ ERROR:* Could not find any trending videos right now.");
        }

        // Step 2: Pick a random video from the search results
        const results = searchResponse.data.result;
        const randomVideo = results[Math.floor(Math.random() * results.length)];
        
        // Step 3: Use the URL of the random video to get the download link
        const downloadUrl = `https://apis.davidcyril.name.ng/downloader/xnxx?url=${encodeURIComponent(randomVideo.link)}`;
        const finalResponse = await axios.get(downloadUrl);

        if (!finalResponse.data || !finalResponse.data.status) {
            return reply("*❌ ERROR:* Failed to generate download link for the selected video.");
        }

        const data = finalResponse.data.result;

        const status = `
╭━━━━〔 *𝔾𝕌ℝ𝕌 𝕄𝔻 𝔸𝕌𝕋𝕆* 〕━━━━╮
┃
┃ 🎬 *𝐓𝐈𝐓𝐋𝐄:* ${data.title}
┃ 🕒 *𝐃𝐔𝐑𝐀𝐓𝐈𝐎𝐍:* ${data.duration}
┃ 🎲 *𝐌𝐎𝐃𝐄:* Auto-Discovery
┃ 🏗️ *𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*⏳ 𝐒𝐭𝐚𝐭𝐮𝐬:* 𝐒𝐞𝐧𝐝𝐢𝐧𝐠 𝐃𝐢𝐫𝐞𝐜𝐭 𝐕𝐢𝐝𝐞𝐨...

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
                    newsletterName: '𝐆𝐔𝐑𝐔 𝐌𝐃: 𝐀𝐔𝐓𝐎-𝐃𝐋',
                    serverMessageId: 143
                },
                externalAdReply: {
                    title: "𝔾𝕌ℝ𝕌 𝕄𝔻 𝔻𝕀ℝ𝔼ℂ𝕋 𝔻𝕃",
                    body: data.title,
                    mediaType: 1,
                    sourceUrl: 'https://github.com/itsguruu/GURU',
                    thumbnailUrl: data.thumbnail,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Random DL Error:", e);
        reply(`❌ *FAILED:* The API is currently not responding to search requests.`);
    }
});
