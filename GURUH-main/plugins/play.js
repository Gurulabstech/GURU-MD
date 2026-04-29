/* ============================================
   GURU MD - RETRO STYLE AUDIO PLAYER
   COMMAND: .play [song name]
   API: Noobs API (https://noobs-api.top)
   STYLE: Retro Box Design
   ============================================ */

const { cmd } = require('../command');
const ytSearch = require('yt-search');
const axios = require('axios');

// Your API Base URL
const BASE_URL = 'https://noobs-api.top';

// Bot Details
const BOT_NAME = '𝗚𝗨𝗥𝗨 𝗠𝗗';
const BOT_FOOTER = 'ɢᴜʀᴜ ᴍᴅ - ʀᴇᴛʀᴏ ᴇᴅɪᴛɪᴏɴ';
const OWNER_NAME = '𝐌𝐑𝐒 𝐆𝐔𝐑𝐔';
const BOT_VERSION = '𝟯𝟬.𝟬.𝟬';

// Format numbers
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// RETRO STYLE TABLE (Your requested design)
function getRetroStyle(video) {
    return `
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    🎵 *${BOT_NAME} PLAYER* 🎵
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ 🎶 *SONG INFO*            ║
╠══════════════════════════╣
║ 📀 ${video.title}
║ 🎤 ${video.author.name}
║ ⏱️ ${video.timestamp} ┃ 👁️ ${formatNumber(video.views)}
║ 📅 ${video.ago}
║ 🔗 ID: ${video.videoId}
╚══════════════════════════╝

⬇️ *Downloading your audio...* ⬇️

💡 *Tip:* .video for video version
`;
}

// Main command
cmd({
    pattern: "play",
    alias: ["song", "music", "ytmp3"],
    desc: "Play audio from YouTube",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender, pushname }) => {
    try {
        // React to the command
        await conn.sendMessage(from, {
            react: {
                text: "🎵",
                key: mek.key
            }
        });

        if (!q) {
            const helpMsg = `
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    🎵 *${BOT_NAME} HELP* 🎵
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ 📌 *USAGE GUIDE*         ║
╠══════════════════════════╣
║ 🎯 *Command:* .play [song]
║                             
║ ✨ *Examples:*             
║ ├─ .play faded            
║ ├─ .play shape of you     
║ └─ .play believer         
║                             
║ 👑 *Owner:* ${OWNER_NAME}   
║ ⚡ *Version:* ${BOT_VERSION} 
╚══════════════════════════╝

💡 *Powered by Noobs API*
`;
            return await reply(helpMsg);
        }

        console.log('[PLAY] Searching:', q);
        
        // Search for the video
        const search = await ytSearch(q);
        const video = search.videos[0];

        if (!video) {
            return await reply(`
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    ❌ *ERROR* ❌
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ No results found for:    ║
║ "${q}"                   ║
║                          ║
║ 💡 Try different keywords ║
╚══════════════════════════╝
`);
        }

        // Create caption with retro style
        const caption = getRetroStyle(video);

        // Create button message
        const buttonMessage = {
            image: { url: video.thumbnail },
            caption: caption,
            footer: BOT_FOOTER,
            buttons: [
                {
                    buttonId: `.video ${video.title}`,
                    buttonText: { displayText: '🎬 ɢᴇᴛ ᴠɪᴅᴇᴏ' },
                    type: 1
                }
            ],
            headerType: 1
        };

        // Send the retro style preview
        await conn.sendMessage(from, buttonMessage, { quoted: mek });

        // Get download link from Noobs API
        const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId)}&format=mp3`;
        console.log('[PLAY] Fetching from:', apiURL);
        
        const response = await axios.get(apiURL, { timeout: 30000 });
        const data = response.data;

        if (!data.downloadLink) {
            return await reply(`
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    ❌ *DOWNLOAD FAILED* ❌
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ Could not retrieve audio ║
║ link. Please try again.  ║
╚══════════════════════════╝
`);
        }

        // Send the audio file
        await conn.sendMessage(from, {
            audio: { url: data.downloadLink },
            mimetype: 'audio/mpeg',
            fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`,
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: video.title.substring(0, 30),
                    body: `${video.author.name} • ${video.timestamp}`,
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: `https://youtube.com/watch?v=${video.videoId}`,
                    mediaType: 2
                }
            }
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {
        console.error('[PLAY] Error:', err);
        await reply(`
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    ❌ *ERROR* ❌
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ ${err.message}           
║                          ║
║ Please try again later   ║
╚══════════════════════════╝
`);
        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });
    }
});

// Video command companion (also in retro style)
cmd({
    pattern: "video",
    alias: ["ytvideo", "ytmp4"],
    desc: "Download YouTube video",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        await conn.sendMessage(from, {
            react: {
                text: "🎬",
                key: mek.key
            }
        });

        if (!q) {
            return reply(`
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    🎬 *VIDEO PLAYER* 🎬
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ 📌 *Usage:* .video [name] ║
║                             
║ ✨ *Example:*              
║ .video faded              
╚══════════════════════════╝
`);
        }

        const search = await ytSearch(q);
        const video = search.videos[0];

        if (!video) {
            return reply(`
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    ❌ *NO RESULTS* ❌
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ No video found for:      ║
║ "${q}"                   ║
╚══════════════════════════╝
`);
        }

        const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId)}&format=mp4`;
        const response = await axios.get(apiURL);
        const data = response.data;

        if (!data.downloadLink) {
            return reply(`
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    ❌ *FAILED* ❌
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ Could not get video link ║
╚══════════════════════════╝
`);
        }

        const videoCaption = `
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    🎬 *VIDEO READY* 🎬
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ 🎬 *${video.title}*
║ 🎤 ${video.author.name}
║ ⏱️ ${video.timestamp} ┃ 👁️ ${formatNumber(video.views)}
╚══════════════════════════╝
`;

        await conn.sendMessage(from, {
            video: { url: data.downloadLink },
            mimetype: 'video/mp4',
            caption: videoCaption
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {
        reply(`
┌─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┐
    ❌ *ERROR* ❌
└─── ･｡ﾟ☆: *.☽ .* :☆ﾟ. ───┘

╔══════════════════════════╗
║ ${err.message}           
╚══════════════════════════╝
`);
    }
});
