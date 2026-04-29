/* ============================================
   GURU MD - POST TO STATUS
   COMMAND: .tostatus [text/reply to media]
   FEATURES: Post text or media directly to your status
   ============================================ */

const { cmd } = require('../command');
const fs = require('fs');

cmd({
    pattern: "tostatus",
    alias: ["poststatus", "mystatus"],
    desc: "Post text or media to your WhatsApp status",
    category: "tools",
    react: "📤",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        // Check if user is replying to media
        const isQuoted = m.quoted;
        
        if (!q && !isQuoted) {
            return reply(`📤 *POST TO STATUS*\n\n` +
                `✨ *Commands:*\n` +
                `├─ .tostatus Hello World! (text status)\n` +
                `├─ Reply to image with .tostatus (image status)\n` +
                `├─ Reply to video with .tostatus (video status)\n` +
                `└─ Reply to audio with .tostatus (audio status)\n\n` +
                `📌 *Examples:*\n` +
                `🔹 .tostatus Good morning everyone!\n` +
                `🔹 Reply to a photo + .tostatus My vacation 📸`);
        }

        // Send typing indicator
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // CASE 1: Text status
        if (q && !isQuoted) {
            await conn.sendMessage(
                "status@broadcast", 
                { 
                    text: q,
                    contextInfo: {
                        externalAdReply: {
                            title: "✨ GURU MD STATUS",
                            body: "Posted via GURU MD Bot",
                            mediaType: 1,
                            thumbnailUrl: "https://files.catbox.moe/66h86e.jpg"
                        }
                    }
                }
            );
            
            await reply(`✅ *Status posted successfully!*\n\n📝 Content: ${q.substring(0, 50)}${q.length > 50 ? '...' : ''}`);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return;
        }

        // CASE 2: Media status (reply to media)
        if (isQuoted) {
            const quotedMsg = m.quoted;
            const mediaType = quotedMsg.message?.imageMessage ? 'image' :
                             quotedMsg.message?.videoMessage ? 'video' :
                             quotedMsg.message?.audioMessage ? 'audio' :
                             quotedMsg.message?.documentMessage ? 'document' : null;

            if (!mediaType) {
                return reply("❌ Please reply to an image, video, or audio message!");
            }

            // Download the media
            const mediaBuffer = await conn.downloadMediaMessage(quotedMsg);
            
            // Prepare caption
            const caption = q || `📌 Posted via GURU MD Bot`;

            // Send based on media type
            switch(mediaType) {
                case 'image':
                    await conn.sendMessage(
                        "status@broadcast",
                        {
                            image: mediaBuffer,
                            caption: caption,
                            contextInfo: {
                                externalAdReply: {
                                    title: "✨ GURU MD STATUS",
                                    body: "Image Status",
                                    mediaType: 1
                                }
                            }
                        }
                    );
                    break;

                case 'video':
                    await conn.sendMessage(
                        "status@broadcast",
                        {
                            video: mediaBuffer,
                            caption: caption,
                            contextInfo: {
                                externalAdReply: {
                                    title: "✨ GURU MD STATUS",
                                    body: "Video Status",
                                    mediaType: 1
                                }
                            }
                        }
                    );
                    break;

                case 'audio':
                    await conn.sendMessage(
                        "status@broadcast",
                        {
                            audio: mediaBuffer,
                            mimetype: 'audio/mpeg',
                            ptt: false, // false for music, true for voice note
                            caption: caption
                        }
                    );
                    break;

                default:
                    return reply("❌ Unsupported media type for status!");
            }

            await reply(`✅ *Status posted successfully!*\n\n📎 Type: ${mediaType}\n📝 Caption: ${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}`);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

    } catch (err) {
        console.error(err);
        await reply("❌ Error posting status: " + err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
