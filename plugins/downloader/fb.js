/* ============================================
   GURU MD - FACEBOOK DOWNLOADER
   COMMAND: .fb [facebook link]
   DOWNLOAD: Videos & Photos from Facebook
   STYLE: Retro-Wave / Synthwave Design
   ============================================ */

const { cmd } = require('../command');
const axios = require('axios');

// Configuration
const BOT_NAME = 'ɢᴜʀᴜ ᴍᴅ';
const BOT_FOOTER = '∞ ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ∞';
const OWNER_NAME = 'ᴍʀꜱ ɢᴜʀᴜ';
const NEWSLETTER_JID = '120363421164015033@newsletter';
const NEWSLETTER_NAME = 'GURU MD';

// Helper function to format numbers
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Retro-Wave Design for response
function getRetroStyle(data, url) {
    return `
░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░

     📥 ꜰᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ    
     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

     📹 [ᴠɪᴅᴇᴏ ɪɴꜰᴏ]
     ~~~~~~~~~~~~~~~~
     📌 ᴛɪᴛʟᴇ: ${(data.title || 'Untitled').substring(0, 30)}${data.title?.length > 30 ? '...' : ''}
     ⏱️ ᴅᴜʀᴀᴛɪᴏɴ: ${data.duration || 'N/A'}
     👁️ ᴠɪᴇᴡꜱ: ${formatNumber(data.views) || 'N/A'}
     ❤️ ʟɪᴋᴇꜱ: ${formatNumber(data.likes) || 'N/A'}
     📅 ᴘᴏꜱᴛᴇᴅ: ${data.uploaded || 'N/A'}

     📥 [ᴅᴏᴡɴʟᴏᴀᴅ ʟɪɴᴋꜱ]
     ~~~~~~~~~~~~~~~~
     ${data.video?.hd ? '🎬 ʜᴅ: ᴀᴠᴀɪʟᴀʙʟᴇ' : ''}
     ${data.video?.sd ? '🎬 ꜱᴅ: ᴀᴠᴀɪʟᴀʙʟᴇ' : ''}
     ${data.photo ? '🖼️ ɪᴍᴀɢᴇ: ᴀᴠᴀɪʟᴀʙʟᴇ' : ''}

     ⚡ ꜱᴇɴᴅɪɴɢ ᴍᴇᴅɪᴀ...
     ~~~~~~~~~~~~~~~~

░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
`;
}

// Main command
cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl", "facebookdl"],
    desc: "Download Facebook video or photo",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        // Initial reaction
        await conn.sendMessage(from, {
            react: {
                text: "📥",
                key: mek.key
            }
        });

        // Check if URL is provided
        if (!q) {
            const helpMsg = `
░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░

        📥 ʜᴇʟᴘ ᴍᴇɴᴜ     
        ▄▄▄▄▄▄▄▄▄▄▄▄▄

     ᴜꜱᴀɢᴇ: .ꜰʙ [ꜰᴀᴄᴇʙᴏᴏᴋ ʟɪɴᴋ]

     ᴇxᴀᴍᴘʟᴇꜱ:
     ☍ .ꜰʙ ʜᴛᴛᴘꜱ://ᴡᴡᴡ.ꜰᴀᴄᴇʙᴏᴏᴋ.ᴄᴏᴍ/ʀᴇᴇʟ/123456789
     ☍ .ꜰʙ ʜᴛᴛᴘꜱ://ꜰʙ.ᴡᴀᴛᴄʜ/123456789
     ☍ .ꜰʙ ʜᴛᴛᴘꜱ://ᴡᴡᴡ.ꜰᴀᴄᴇʙᴏᴏᴋ.ᴄᴏᴍ/ᴡᴀᴛᴄʜ/?ᴠ=123456789

     ꜱᴜᴘᴘᴏʀᴛᴇᴅ:
     ☍ ᴠɪᴅᴇᴏꜱ
     ☍ ʀᴇᴇʟꜱ
     ☍ ᴘʜᴏᴛᴏꜱ

     ᴏᴡɴᴇʀ: ${OWNER_NAME}

░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
`;
            return await reply(helpMsg);
        }

        // Validate URL
        const url = q.trim();
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            const errorMsg = `
░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░

        ❌ ɪɴᴠᴀʟɪᴅ ʟɪɴᴋ     
        ▄▄▄▄▄▄▄▄▄▄▄▄▄

     ᴘʟᴇᴀꜱᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠᴀʟɪᴅ
     ꜰᴀᴄᴇʙᴏᴏᴋ ʟɪɴᴋ.

     ᴠᴀʟɪᴅ ꜰᴏʀᴍᴀᴛꜱ:
     ☍ ʜᴛᴛᴘꜱ://ᴡᴡᴡ.ꜰᴀᴄᴇʙᴏᴏᴋ.ᴄᴏᴍ/...
     ☍ ʜᴛᴛᴘꜱ://ꜰʙ.ᴡᴀᴛᴄʜ/...

     ᴇxᴀᴍᴘʟᴇ:
     ʜᴛᴛᴘꜱ://ᴡᴡᴡ.ꜰᴀᴄᴇʙᴏᴏᴋ.ᴄᴏᴍ/ʀᴇᴇʟ/402579285704851

░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
`;
            return await reply(errorMsg);
        }

        // Show processing message
        const processingMsg = `
░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░

        📥 ᴘʀᴏᴄᴇꜱꜱɪɴɢ     
        ▄▄▄▄▄▄▄▄▄▄▄▄▄

     ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ꜰʀᴏᴍ:
     ${url.substring(0, 40)}...

     ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...

░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
`;
        await reply(processingMsg);

        // Use the API
        const apiUrl = `https://api-rebix.zone.id/api/facebook?url=${encodeURIComponent(url)}`;
        console.log('[FB] Fetching from:', apiUrl);

        const res = await axios.get(apiUrl, { timeout: 30000 });

        // Check API response
        if (!res.data || !res.data.status) {
            const errorMsg = `
░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░

        ❌ ᴀᴘɪ ᴇʀʀᴏʀ     
        ▄▄▄▄▄▄▄▄▄▄▄

     ${res.data?.msg || 'ꜰᴀɪʟᴇᴅ ᴛᴏ ꜰᴇᴛᴄʜ ᴍᴇᴅɪᴀ'}

     ᴛʀʏ ᴀɴᴏᴛʜᴇʀ ʟɪɴᴋ
     ᴏʀ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ

░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
`;
            return await reply(errorMsg);
        }

        const data = res.data.result || {};
        
        // Show download info
        const infoMsg = getRetroStyle(data, url);
        await reply(infoMsg);

        // Prepare caption with newsletter context
        const caption = `📥 *Downloaded via GURU MD*\n\n📌 ${data.title || 'Facebook Video'}\n⏱️ ${data.duration || 'N/A'} • 👁️ ${formatNumber(data.views) || 'N/A'} • ❤️ ${formatNumber(data.likes) || 'N/A'}`;

        // Common contextInfo
        const contextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: NEWSLETTER_JID,
                newsletterName: NEWSLETTER_NAME,
                serverMessageId: Math.floor(Math.random() * 1000)
            }
        };

        // Video download (prefer HD)
        if (data.video && (data.video.hd || data.video.sd)) {
            const videoUrl = data.video.hd || data.video.sd;
            
            await conn.sendMessage(from, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: 'video/mp4',
                contextInfo: contextInfo
            }, { quoted: mek });
        }
        // Photo download (if it's an image post)
        else if (data.photo || (data.images && data.images.length > 0)) {
            const photoUrl = data.photo || data.images[0];
            
            await conn.sendMessage(from, {
                image: { url: photoUrl },
                caption: caption,
                contextInfo: contextInfo
            }, { quoted: mek });
        }
        // Fallback if no media found
        else {
            const noMediaMsg = `
░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░

        ❌ ɴᴏ ᴍᴇᴅɪᴀ ꜰᴏᴜɴᴅ     
        ▄▄▄▄▄▄▄▄▄▄▄▄▄▄

     ɴᴏ ᴅᴏᴡɴʟᴏᴀᴅᴀʙʟᴇ ᴍᴇᴅɪᴀ
     ꜰᴏᴜɴᴅ ɪɴ ᴛʜɪꜱ ʟɪɴᴋ.

     ᴛʀʏ ᴀ ᴅɪʀᴇᴄᴛ ᴠɪᴅᴇᴏ/
     ᴘʜᴏᴛᴏ ʟɪɴᴋ ꜰʀᴏᴍ ꜰᴀᴄᴇʙᴏᴏᴋ.

░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
`;
            await reply(noMediaMsg);
        }

        // Success reaction
        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {
        console.error('[FB] Error:', err.message);
        
        const errorMsg = `
░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░

        ❌ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ     
        ▄▄▄▄▄▄▄▄▄▄▄▄▄▄

     ${err.message.includes('timeout') ? 'ᴀᴘɪ ᴛɪᴍᴇᴏᴜᴛ' : err.message.substring(0, 40)}

     ᴄʜᴇᴄᴋ ʏᴏᴜʀ ʟɪɴᴋ
     ᴏʀ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ

░▒▓█ █▓▒░ ░▒▓█ █▓▒░ ░▒▓█ █▓▒░
`;

        await reply(errorMsg);
        
        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });
    }
});
