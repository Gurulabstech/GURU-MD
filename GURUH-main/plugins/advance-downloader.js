// plugins/advanced-downloader.js
// Self-registering universal media downloader — no index.js changes needed

const axios = require('axios');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper: Wait until global.conn is ready
const waitForConn = (callback) => {
    if (global.conn) return callback(global.conn);
    const interval = setInterval(() => {
        if (global.conn) {
            clearInterval(interval);
            callback(global.conn);
        }
    }, 1000); // Check every second
};

waitForConn((conn) => {
    console.log('[AdvancedDownloader] Activated — ready to download from YouTube, IG, FB, TikTok, Twitter, etc.');

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const mek = messages[0];
        if (!mek?.message) return;

        const from = mek.key.remoteJid;
        const body = (
            mek.message.conversation ||
            mek.message.extendedTextMessage?.text ||
            ""
        ).trim().toLowerCase();

        // Supported command prefixes
        const prefixes = ['.dl', '.download', '.yt', '.ig', '.fb', '.tt', '.twitter', '.ytmp3', '.ytmp4'];
        const usedPrefix = prefixes.find(p => body.startsWith(p));
        if (!usedPrefix) return;

        const text = body.slice(usedPrefix.length).trim();
        const cmd = usedPrefix.replace('.', '');

        // Quick reply helper
        const reply = async (msg) => {
            await conn.sendMessage(from, { text: msg }, { quoted: mek });
        };

        if (!text) {
            return reply(`❌ Please provide a URL or search query!\n\nExamples:\n` +
                `${usedPrefix} https://youtu.be/xxxx\n` +
                `${usedPrefix} Believer Imagine Dragons\n\n` +
                `Supported: YouTube, Instagram, Facebook, TikTok, Twitter`);
        }

        try {
            const isUrl = text.match(/^https?:\/\//);

            if (isUrl) {
                const url = text;
                const domain = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be') ? 'youtube' :
                               url.toLowerCase().includes('instagram.com') ? 'instagram' :
                               url.toLowerCase().includes('facebook.com') || url.toLowerCase().includes('fb.watch') ? 'facebook' :
                               url.toLowerCase().includes('tiktok.com') ? 'tiktok' :
                               url.toLowerCase().includes('twitter.com') || url.toLowerCase().includes('x.com') ? 'twitter' :
                               'unknown';

                await reply(`⏳ Downloading from ${domain}...`);

                switch (domain) {
                    case 'youtube':
                        await handleYouTube(url, conn, mek, reply);
                        break;
                    case 'instagram':
                        await handleInstagram(url, conn, mek, reply);
                        break;
                    case 'facebook':
                        await handleFacebook(url, conn, mek, reply);
                        break;
                    case 'tiktok':
                        await handleTikTok(url, conn, mek, reply);
                        break;
                    case 'twitter':
                        await handleTwitter(url, conn, mek, reply);
                        break;
                    default:
                        await reply(`❌ Unsupported platform: ${domain}\n\nSupported: YouTube, Instagram, Facebook, TikTok, Twitter`);
                }
            } else {
                // YouTube search
                await reply(`🔍 Searching YouTube for: ${text}`);
                await searchAndDownloadYouTube(text, conn, mek, reply);
            }
        } catch (error) {
            console.error('[Downloader Error]:', error);
            await reply(`❌ Download failed: ${error.message || 'Unknown error'}`);
        }
    });
});

// ─────────────── YouTube Handler ───────────────
async function handleYouTube(url, conn, mek, reply) {
    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;
        const duration = parseInt(info.videoDetails.lengthSeconds);
        const views = info.videoDetails.viewCount;
        const author = info.videoDetails.author.name;

        const buttons = [
            { buttonId: `ytmp3_${url}`, buttonText: { displayText: '🎵 Audio (MP3)' }, type: 1 },
            { buttonId: `ytmp4_${url}`, buttonText: { displayText: '🎬 Video (MP4)' }, type: 1 }
        ];

        const caption = `*📹 YouTube Downloader*\n\n` +
                       `*Title:* ${title}\n` +
                       `*Author:* ${author}\n` +
                       `*Duration:* \( {Math.floor(duration / 60)}: \){(duration % 60).toString().padStart(2, '0')}\n` +
                       `*Views:* ${views.toLocaleString()}\n\n` +
                       `_Choose format below:_`;

        await conn.sendMessage(mek.key.remoteJid, {
            image: { url: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url },
            caption: caption,
            buttons: buttons,
            headerType: 4
        }, { quoted: mek });

    } catch (error) {
        await reply(`❌ YouTube processing failed: ${error.message}`);
    }
}

// ─────────────── Instagram Handler ───────────────
async function handleInstagram(url, conn, mek, reply) {
    try {
        const api = await axios.get(`https://api.akuari.my.id/downloader/instagram?link=${encodeURIComponent(url)}`);
        const data = api.data;

        if (data.status && data.result?.length > 0) {
            for (let i = 0; i < Math.min(data.result.length, 3); i++) {
                const media = data.result[i];
                const isVideo = media.includes('.mp4');

                if (isVideo) {
                    await conn.sendMessage(mek.key.remoteJid, {
                        video: { url: media },
                        caption: `📥 Instagram Video\n\nDownloaded via ᴳᵁᴿᵁᴹᴰ`,
                        mimetype: 'video/mp4'
                    }, { quoted: mek });
                } else {
                    await conn.sendMessage(mek.key.remoteJid, {
                        image: { url: media },
                        caption: `📸 Instagram Image\n\nDownloaded via ᴳᵁᴿᵁᴹᴰ`
                    }, { quoted: mek });
                }
                await new Promise(r => setTimeout(r, 1500)); // avoid rate limit
            }
        } else {
            await reply('❌ Failed to fetch Instagram media');
        }
    } catch (error) {
        await reply(`❌ Instagram download failed: ${error.message}`);
    }
}

// ─────────────── Facebook Handler ───────────────
async function handleFacebook(url, conn, mek, reply) {
    try {
        const api = await axios.get(`https://api.akuari.my.id/downloader/facebook?link=${encodeURIComponent(url)}`);
        const data = api.data;

        if (data.status && data.result) {
            const hd = data.result.hd;
            const sd = data.result.sd;

            const buttons = [
                { buttonId: `fbhd_${hd}`, buttonText: { displayText: '🎬 HD Quality' }, type: 1 },
                { buttonId: `fbsd_${sd}`, buttonText: { displayText: '📱 SD Quality' }, type: 1 }
            ];

            await conn.sendMessage(mek.key.remoteJid, {
                video: { url: sd || hd },
                caption: `*📘 Facebook Video*\n\nDownloaded via ᴳᵁᴿᵁᴹᴰ`,
                buttons: buttons
            }, { quoted: mek });
        }
    } catch (error) {
        await reply(`❌ Facebook download failed: ${error.message}`);
    }
}

// ─────────────── TikTok Handler ───────────────
async function handleTikTok(url, conn, mek, reply) {
    try {
        const api = await axios.get(`https://api.akuari.my.id/downloader/tiktok?link=${encodeURIComponent(url)}`);
        const data = api.data;

        if (data.status) {
            const videoUrl = data.result.nowm;
            await conn.sendMessage(mek.key.remoteJid, {
                video: { url: videoUrl },
                caption: `*🎵 TikTok Video*\n\n👤 *Author:* ${data.result.author || 'Unknown'}\n💬 *Caption:* ${data.result.caption || ''}\n\nᴳᵁᴿᵁᴹᴰ Downloader`
            }, { quoted: mek });
        }
    } catch (error) {
        await reply(`❌ TikTok download failed: ${error.message}`);
    }
}

// ─────────────── Twitter / X Handler ───────────────
async function handleTwitter(url, conn, mek, reply) {
    try {
        const api = await axios.get(`https://api.akuari.my.id/downloader/twitter?link=${encodeURIComponent(url)}`);
        const data = api.data;

        if (data.status && data.result?.length > 0) {
            const media = data.result[0];
            await conn.sendMessage(mek.key.remoteJid, {
                video: { url: media.url },
                caption: `*🐦 Twitter / X Video*\n\nᴳᵁᴿᵁᴹᴰ Downloader`
            }, { quoted: mek });
        }
    } catch (error) {
        await reply(`❌ Twitter download failed: ${error.message}`);
    }
}

// ─────────────── YouTube Search & Download ───────────────
async function searchAndDownloadYouTube(query, conn, mek, reply) {
    try {
        const results = await ytSearch(query);
        const videos = results.videos.slice(0, 5);

        let text = `*🔍 YouTube Search Results for:* ${query}\n\n`;
        videos.forEach((video, index) => {
            text += `*${index + 1}.* ${video.title}\n`;
            text += `   ⏱️ ${video.timestamp} | 👤 ${video.author.name}\n`;
            text += `   🔗 ${video.url}\n\n`;
        });
        text += `_Reply with number (1-5) to download_`;

        await conn.sendMessage(mek.key.remoteJid, { text }, { quoted: mek });

        // Optional: store results temporarily (you can expand this later)
        global.ytSearchResults = videos;
        global.searchUser = mek.key.participant || mek.key.remoteJid;

    } catch (error) {
        await reply(`❌ YouTube search failed: ${error.message}`);
    }
}

// Simple sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {};
