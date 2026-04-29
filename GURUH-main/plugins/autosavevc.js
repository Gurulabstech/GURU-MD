const { cmd } = require('../command');
const { downloadMediaMessage } = require('gifted-baileys');
const fs = require('fs');
const path = require('path');

// Your owner number (same as in index.js)
const OWNER_NUMBER = '254778074353@s.whatsapp.net'; // ← Change if needed

module.exports = async (conn, mek, m) => {
    try {
        // Only trigger if the reaction is from YOU (the owner)
        if (m.key.fromMe !== true && m.key.participant !== OWNER_NUMBER) {
            return; // Ignore reactions from others
        }

        // Must be a reaction message
        if (!mek.message?.reactionMessage) return;

        // Get the quoted message (the view-once being reacted to)
        const quotedKey = mek.message.reactionMessage.key;
        const quotedMsg = await conn.loadMessage(quotedKey);

        if (!quotedMsg) return; // Message not found in store

        // Check if the quoted message is view-once
        const isViewOnce = quotedMsg.message?.viewOnceMessageV2 ||
                           quotedMsg.message?.viewOnceMessageV2Extension ||
                           quotedMsg.message?.viewOnceMessage;

        if (!isViewOnce) return; // Not a view-once message

        // Download media anonymously (no read receipt)
        let buffer;
        try {
            buffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { logger: console });
        } catch (dlErr) {
            console.error("[AUTO-SAVE VC ERROR] Download failed:", dlErr.message);
            return;
        }

        // Determine type & extension
        const msgType = quotedMsg.message?.viewOnceMessageV2?.message ||
                        quotedMsg.message?.viewOnceMessageV2Extension?.message ||
                        quotedMsg.message?.viewOnceMessage?.message;

        const contentType = Object.keys(msgType)[0];
        const mime = msgType[contentType].mimetype || 'application/octet-stream';
        const ext = mime.split('/')[1] || (contentType.includes('Image') ? 'jpg' : 'mp4');

        // Temp save
        const tempPath = path.join(__dirname, `../temp/autosavevc_\( {Date.now()}. \){ext}`);
        fs.writeFileSync(tempPath, buffer);

        // Send to your own inbox
        const myJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        const caption = `🔒 Auto-saved view-once (reacted anonymously)\nFrom: ${quotedMsg.pushName || quotedMsg.key.participant?.split('@')[0] || 'Unknown'}`;

        if (contentType === 'imageMessage') {
            await conn.sendMessage(myJid, {
                image: { url: tempPath },
                caption,
                mimetype: mime
            });
        } else if (contentType === 'videoMessage') {
            await conn.sendMessage(myJid, {
                video: { url: tempPath },
                caption,
                mimetype: mime,
                gifPlayback: false
            });
        } else {
            await conn.sendMessage(myJid, {
                document: { url: tempPath },
                fileName: `viewonce_\( {Date.now()}. \){ext}`,
                mimetype: mime,
                caption
            });
        }

        // Clean up
        setTimeout(() => fs.unlink(tempPath, () => {}), 30000);

        // React success on your reaction message
        await conn.sendMessage(mek.key.remoteJid, { 
            react: { text: "✅", key: mek.key } 
        });

        console.log(`[AUTO-SAVE VC] Successfully saved view-once to inbox from ${quotedMsg.key.participant || 'unknown'}`);

    } catch (e) {
        console.error("[AUTO-SAVE VC ERROR]", e.message);
    }
};
