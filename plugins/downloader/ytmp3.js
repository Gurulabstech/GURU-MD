const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ytmp3|playmp3|songmp3|audio",
    desc: "Download YouTube video as MP3 audio",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const url = q || (quoted && quoted.url) || null;

        if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
            return reply(`*Example:* ${config.PREFIX || '.'}ytmp3 https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
        }

        // Show processing message
        await reply("🎵 *Fetching MP3 from YouTube...* Please wait...");

        // Use your new Rebix API (adjust path if needed)
        const apiUrl = `https://api-rebix.zone.id/api/youtube?url=${encodeURIComponent(url)}&format=mp3`;

        const res = await axios.get(apiUrl, { timeout: 45000 });

        if (!res.data || !res.data.status) {
            return reply(`*Error:* ${res.data?.message || 'Failed to fetch audio. Try another link.'}`);
        }

        const data = res.data.result || {};

        // Prepare caption
        let caption = `*YouTube MP3 Download*\n\n` +
                      `*Title:* ${data.title || 'Untitled'}\n` +
                      `*Duration:* ${data.duration || 'N/A'}\n` +
                      `*Quality:* ${data.quality || '128kbps'}\n` +
                      `*Size:* ${data.size || 'N/A'}\n\n` +
                      `Powered by *GURU MD* 💢`;

        // Audio URL (prefer highest quality or fallback)
        const audioUrl = data.audio?.high || data.audio?.medium || data.audio?.url || data.link;

        if (!audioUrl) {
            return reply(`*No downloadable audio found.* Try a different video.`);
        }

        // Send audio as voice note / audio file
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: true, // send as voice note (optional: set false if you want normal audio file)
            fileName: `${data.title || 'audio'}.mp3`,
            caption: caption,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421164015033@newsletter',
                    newsletterName: 'GURU MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error('[ytmp3] Error:', err.message);
        await reply(`*Error:* Failed to download MP3.\n${err.message.includes('timeout') ? 'API timeout' : 'Check link or try later'}`);
    }
});
