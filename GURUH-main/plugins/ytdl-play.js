const { cmd } = require('../command');
const yts = require('yt-search');
const { YtDlp } = require('ytdlp-nodejs');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

cmd({
    pattern: "yt2",
    alias: ["play2", "music", "song2"],
    react: "🎵",
    desc: "Download audio from YouTube (reliable 2026 version using yt-dlp)",
    category: "download",
    use: ".yt2 <song name or YouTube URL>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a song name or YouTube URL!\nExample: .yt2 perfect ed sheeran");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let videoUrl, title, thumbnail;

        // Check if input is URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const search = await yts({ videoId: q.split(/[=/]/).pop() });
            title = search.title || "Audio";
            thumbnail = search.thumbnail;
        } else {
            // Search for best match
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found for: " + q);

            const vid = search.videos[0];
            videoUrl = vid.url;
            title = vid.title;
            thumbnail = vid.thumbnail;
        }

        await reply(`🎧 Downloading *${title}* as audio...`);

        const ytdlp = new YtDlp();

        // Temporary file paths
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, `${Date.now()}_audio.mp3`);

        // Download best audio only and convert to mp3
        await ytdlp.download(videoUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0,          // 0 = best quality
            output: outputPath,
            addMetadata: true,
            embedThumbnail: true
        });

        if (!fs.existsSync(outputPath)) {
            throw new Error("Audio file was not created");
        }

        // Send as audio message
        await conn.sendMessage(from, {
            audio: { url: outputPath },
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
            ptt: false,
            caption: `🎵 *${title}*\n> Downloaded via yt-dlp (2026 reliable method)\n> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`,
            ...(thumbnail ? { jpegThumbnail: { url: thumbnail } } : {})
        }, { quoted: mek });

        // Cleanup after 60 seconds
        setTimeout(() => {
            fs.unlink(outputPath, (err) => {
                if (err) console.log("Temp file cleanup failed:", err);
            });
        }, 60000);

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("[YT2 ERROR]", error);
        await reply(`❌ Error: ${error.message || "Failed to download audio. Try another song or check later."}`);
    }
});
