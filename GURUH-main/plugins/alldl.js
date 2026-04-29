const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "aio|alldl|download|dl",
    desc: "All-in-One media downloader (YouTube, FB, IG, TikTok, Twitter, etc.)",
    category: "download",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const url = q?.trim() || (quoted && quoted.url) || null;

        if (!url) {
            return reply(`*Example:* ${config.PREFIX || '.'}aio https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
        }

        // Show processing message
        await reply("📥 *Fetching media...* Please wait (AIO downloader)");

        // Use your new Rebix API (adjust path if needed)
        const apiUrl = `https://api-rebix.zone.id/api/aio?url=${encodeURIComponent(url)}`;

        const res = await axios.get(apiUrl, { timeout: 60000 }); // 60s timeout

        if (!res.data || !res.data.status) {
            return reply(`*Error:* ${res.data?.msg || res.data?.message || 'Failed to fetch media. Try another link.'}`);
        }

        const data = res.data.result || {};

        // Prepare caption with available info
        let caption = `*AIO Media Download*\n\n` +
                      `*Title:* ${data.title || 'Untitled'}\n` +
                      `*Duration:* ${data.duration || 'N/A'}\n` +
                      `*Size:* ${data.size || 'N/A'}\n` +
                      `*Quality:* ${data.quality || 'Auto'}\n` +
                      `*From:* ${data.platform || 'Unknown'}\n\n` +
                      `Powered by *GURU MD* 💢`;

        // Video download (prefer HD)
        if (data.video?.hd || data.video?.url || data.link?.video) {
            const videoUrl = data.video?.hd || data.video?.url || data.link?.video || data.url;
            await conn.sendMessage(from, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: 'video/mp4',
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
        }

        // Audio / MP3 download
        else if (data.audio?.url || data.audio?.high || data.link?.audio) {
            const audioUrl = data.audio?.high || data.audio?.url || data.link?.audio;
            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false, // false = normal audio file, true = voice note
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
        }

        // Photo / Image download
        else if (data.photo || data.images?.length > 0 || data.thumbnail) {
            const photoUrl = data.photo || data.images?.[0] || data.thumbnail;
            await conn.sendMessage(from, {
                image: { url: photoUrl },
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
        }

        // Fallback if no media detected
        else {
            await reply(`*No downloadable media found in the response.*\nTry a direct video/photo link.`);
        }

    } catch (err) {
        console.error('[aio command] Error:', err.message);
        await reply(`*Error:* Failed to download media.\n${err.message.includes('timeout') ? 'API timeout - try later' : 'Invalid link or server issue'}`);
    }
});
