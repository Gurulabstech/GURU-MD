const { downloadMediaMessage } = require('gifted-baileys');

// ──────────────────────────────────────────────
// Auto-save view-once when OWNER reacts to it
// No command needed — just react with any emoji
// Saves anonymously to your own chat
// ──────────────────────────────────────────────

module.exports = async function setupViewOnceAutoSave(conn) {
    console.log('[PLUGIN] ViewOnce Auto-Save → Activated');

    // Store to keep track of messages for reaction handling
    let messageStore = new Map();

    // First, store all incoming messages
    conn.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const m of messages) {
            // Store message by ID for later reference
            const msgId = m.key.id;
            if (msgId) {
                messageStore.set(msgId, m);
            }

            // Check if it's a view-once message and store it
            const viewOnce = 
                m.message?.viewOnceMessageV2 ||
                m.message?.viewOnceMessageV2Extension ||
                m.message?.viewOnceMessage;

            if (viewOnce) {
                console.log(`[ViewOnce] New view-once message detected: ${msgId}`);
                messageStore.set(`viewonce_${msgId}`, {
                    ...m,
                    isViewOnce: true,
                    viewOnceContent: viewOnce
                });
            }
        }
    });

    // Handle reactions
    conn.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const m of messages) {
            try {
                // Only process reactions
                if (!m.message?.reactionMessage) continue;

                // Only for owner
                const reactor = m.key.participant || m.key.remoteJid;
                const isOwner = 
                    global.ownerNumbers?.includes(reactor.split('@')[0]) ||
                    reactor === conn.user.id.split(':')[0] + '@s.whatsapp.net' ||
                    m.key.fromMe;

                if (!isOwner) continue;

                // Get the message that was reacted to
                const reactedKey = m.message.reactionMessage.key;
                if (!reactedKey?.id) continue;

                // Try to get from store first
                let originalMsg = messageStore.get(reactedKey.id);
                
                // If not in store, also check viewonce prefixed keys
                if (!originalMsg) {
                    originalMsg = messageStore.get(`viewonce_${reactedKey.id}`);
                }

                // If still not found, skip
                if (!originalMsg) {
                    console.log(`[ViewOnce] Could not find original message: ${reactedKey.id}`);
                    continue;
                }

                const msgContent = originalMsg.message;
                if (!msgContent) continue;

                // Check if it's view-once
                const viewOnce = 
                    msgContent.viewOnceMessageV2 ||
                    msgContent.viewOnceMessageV2Extension ||
                    msgContent.viewOnceMessage ||
                    originalMsg.viewOnceContent;

                if (!viewOnce) continue;

                // Extract actual media from view-once
                let actualMessage = viewOnce.message || viewOnce;
                let mediaMsg = 
                    actualMessage.imageMessage ||
                    actualMessage.videoMessage ||
                    actualMessage.audioMessage ||
                    actualMessage.documentMessage ||
                    actualMessage.stickerMessage;

                if (!mediaMsg) {
                    // Try to extract from original message if viewOnce doesn't have media
                    mediaMsg = 
                        msgContent.imageMessage ||
                        msgContent.videoMessage ||
                        msgContent.audioMessage ||
                        msgContent.documentMessage ||
                        msgContent.stickerMessage;
                }

                if (!mediaMsg) {
                    console.log('[ViewOnce] No media found in view-once message');
                    continue;
                }

                const mediaType = 
                    mediaMsg.mimetype?.startsWith('image') ? 'image' :
                    mediaMsg.mimetype?.startsWith('video') ? 'video' :
                    mediaMsg.mimetype?.startsWith('audio') ? 'audio' : 
                    mediaMsg.mimetype?.startsWith('image/webp') ? 'sticker' : 'document';

                console.log(`[ViewOnce Save] ${mediaType} detected • Owner reacted → Saving...`);

                // Try to download the media
                try {
                    const buffer = await downloadMediaMessage(originalMsg, 'buffer', {}, {
                        reuploadRequest: conn.updateMediaMessage
                    });

                    if (!buffer || buffer.length === 0) {
                        console.log('[ViewOnce] Failed to download media: empty buffer');
                        continue;
                    }

                    // Send to your own chat (saved messages)
                    const ownerJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

                    let captionText = `📁 *VIEW-ONCE SAVED*\n\n` +
                                     `📂 Type: ${mediaType.toUpperCase()}\n` +
                                     `👤 From: ${originalMsg.key.remoteJid.split('@')[0]}\n` +
                                     `👥 Sender: ${originalMsg.key.participant?.split('@')[0] || 'unknown'}\n` +
                                     `⏰ Saved: ${new Date().toLocaleString('en-KE')}\n\n` +
                                     `_Saved via ᴳᵁᴿᵁᴹᴰ Bot_`;

                    const messageOptions = {
                        caption: captionText,
                        mimetype: mediaMsg.mimetype
                    };

                    // Handle different media types
                    if (mediaType === 'image') {
                        messageOptions.image = buffer;
                    } else if (mediaType === 'video') {
                        messageOptions.video = buffer;
                    } else if (mediaType === 'audio') {
                        messageOptions.audio = buffer;
                        delete messageOptions.caption; // Audio doesn't support caption
                        // Send caption as separate message for audio
                        await conn.sendMessage(ownerJid, { text: captionText });
                    } else if (mediaType === 'sticker') {
                        messageOptions.sticker = buffer;
                        delete messageOptions.caption; // Stickers don't support caption
                        // Send caption as separate message for sticker
                        await conn.sendMessage(ownerJid, { text: captionText });
                    } else {
                        messageOptions.document = buffer;
                        messageOptions.fileName = `viewonce_${Date.now()}.${mediaMsg.mimetype.split('/')[1] || 'bin'}`;
                    }

                    await conn.sendMessage(ownerJid, messageOptions);

                    console.log(`[ViewOnce] Successfully saved ${mediaType} to owner's chat`);

                    // Optional success reaction (only visible to you)
                    try {
                        await conn.sendMessage(originalMsg.key.remoteJid, {
                            react: {
                                text: '✅',
                                key: originalMsg.key
                            }
                        });
                    } catch (reactError) {
                        console.log('[ViewOnce] Could not send reaction:', reactError.message);
                    }

                } catch (downloadError) {
                    console.error('[ViewOnce] Download error:', downloadError.message);
                    
                    // Try alternative method
                    try {
                        // Send a notification that saving failed
                        await conn.sendMessage(
                            conn.user.id.split(':')[0] + '@s.whatsapp.net',
                            { text: `❌ Failed to save view-once media\n\nError: ${downloadError.message}` }
                        );
                    } catch (notifyError) {
                        console.error('[ViewOnce] Notification error:', notifyError.message);
                    }
                }

            } catch (error) {
                console.error('[ViewOnce Auto-Save Error]:', error.message);
                // Silent → no disturbance
            }
        }
    });

    // Clean up old messages from store periodically (keep last 1000 messages)
    setInterval(() => {
        if (messageStore.size > 1000) {
            const keys = Array.from(messageStore.keys());
            const toDelete = keys.slice(0, keys.length - 1000);
            toDelete.forEach(key => messageStore.delete(key));
            console.log(`[ViewOnce] Cleaned up ${toDelete.length} old messages from cache`);
        }
    }, 5 * 60 * 1000); // Every 5 minutes
};

// Auto-initialize when plugin loads
module.exports.init = async (conn) => {
    await module.exports(conn);
};
