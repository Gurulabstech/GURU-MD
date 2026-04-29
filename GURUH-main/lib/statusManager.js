'use strict';

/**
 * lib/statusManager.js
 * Status@broadcast handler for gifted-baileys (npm:gifted-baileys@^2.5.8)
 *
 * Root-cause fix (confirmed from Heroku logs):
 *   statusJidList must contain @s.whatsapp.net (phone) JIDs, NOT @lid JIDs.
 *   gifted-baileys exposes m.key.participantPn for exactly this purpose.
 *   Previous code used m.key.participant (@lid) → WhatsApp silently rejected it.
 *
 * Integrated with GURU BOT's auto-status system
 */

const config = require('../config');

// ─── Per-process dedup set ─────────────────────────────────────────────────────
// Prevents triple-processing when Bad MAC errors cause the same status to be
// retransmitted 2-3 times within the same session (seen in Heroku logs).
const _seenIds = new Set();

// ─── Message-type unwrapper ────────────────────────────────────────────────────
function unwrapStatus(m) {
    let inner = { ...(m.message || {}) };
    if (inner.ephemeralMessage)  inner = { ...(inner.ephemeralMessage.message  || inner) };
    if (inner.viewOnceMessageV2) inner = { ...(inner.viewOnceMessageV2.message || inner) };
    if (inner.viewOnceMessage)   inner = { ...(inner.viewOnceMessage.message   || inner) };

    const ORDER = [
        'imageMessage', 'videoMessage', 'audioMessage',
        'extendedTextMessage', 'conversation', 'stickerMessage',
        'documentMessage', 'reactionMessage',
    ];
    const msgType = ORDER.find(k => inner[k]) || Object.keys(inner)[0] || 'unknown';
    return { inner, msgType };
}

// ─── Resolve the phone JID from a status key ──────────────────────────────────
// gifted-baileys puts the @s.whatsapp.net JID in key.participantPn when the
// sender is a LID-migrated account. Always prefer that over key.participant.
function resolvePhoneJid(key) {
    // participantPn is the phone JID gifted-baileys attaches alongside the LID
    if (key.participantPn && key.participantPn.includes('@s.whatsapp.net')) {
        return key.participantPn;
    }
    // If participant is already a phone JID use it directly
    if (key.participant && key.participant.includes('@s.whatsapp.net')) {
        return key.participant;
    }
    // participant is a @lid — try the global LID→phone map built from contacts events
    if (key.participant && key.participant.includes('@lid') && global.lidJidMap?.has(key.participant)) {
        return global.lidJidMap.get(key.participant);
    }
    // Last resort: return whatever we have (may still be @lid, but we tried)
    return key.participant || null;
}

// ─── Get effective status settings with runtime overrides ─────────────────────
function getEffectiveSettings() {
    const flags = global.autoStatusFlags || {};
    
    // Determine effective settings - runtime overrides take precedence over config
    const shouldView = flags.seen !== null ? flags.seen : (config.AUTO_STATUS_SEEN === 'true');
    const shouldReact = flags.react !== null ? flags.react : (config.AUTO_STATUS_REACT === 'true');
    // FIXED: Auto Reply is DISABLED - set to false always
    const shouldReply = false;
    const shouldSave = config.Status_Saver === 'true';
    const shouldReplySave = config.STATUS_REPLY === 'true';
    
    return {
        shouldView,
        shouldReact,
        shouldReply,
        shouldSave,
        shouldReplySave,
        replyMessage: config.AUTO_STATUS_MSG || 'Seen by GURU BOT 💖',
        saveReplyMessage: config.STATUS_MSG || 'GURU BOT 💖 SUCCESSFULLY VIEWED YOUR STATUS',
        emojis: (config.CUSTOM_REACT_EMOJIS || '🪾,🌴,🪻,🌿,🌲,🌵,🍂,☄️,🪽,🪶,🚀🍖').split(',')
    };
}

// ─── Status saver function for media ──────────────────────────────────────────
async function saveMediaMessage(sock, msg, msgType, caption, from) {
    try {
        const media = msg.message[msgType];
        if (!media) return false;
        
        // Create directory if it doesn't exist
        const statusesDir = './statuses';
        if (!require('fs').existsSync(statusesDir)) {
            require('fs').mkdirSync(statusesDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        let fileName, buffer;
        
        // Download the media using gifted-baileys
        const { downloadMediaMessage } = require('gifted-baileys');
        
        try {
            buffer = await downloadMediaMessage(
                { message: msg.message, key: msg.key },
                'buffer',
                {},
                { logger: require('pino')({ level: 'silent' }) }
            );
        } catch (err) {
            console.error(`[StatusMgr] Download failed: ${err.message}`);
            return false;
        }
        
        // Save based on type
        switch(msgType) {
            case 'imageMessage':
                fileName = `status_img_${timestamp}.jpg`;
                require('fs').writeFileSync(`${statusesDir}/${fileName}`, buffer);
                break;
            case 'videoMessage':
                fileName = `status_vid_${timestamp}.mp4`;
                require('fs').writeFileSync(`${statusesDir}/${fileName}`, buffer);
                break;
            case 'audioMessage':
                fileName = `status_audio_${timestamp}.mp3`;
                require('fs').writeFileSync(`${statusesDir}/${fileName}`, buffer);
                break;
            default:
                return false;
        }
        
        // Send to owner if needed
        if (config.Status_Saver_Owner_Notify === 'true' && sock.user?.id) {
            const ownerMsg = `📥 *Status Saved*\n\n👤 *From:* ${from || 'Unknown'}\n📎 *Type:* ${msgType.replace('Message', '').toUpperCase()}\n📁 *File:* ${fileName}\n📝 *Caption:* ${caption || 'None'}`;
            await sock.sendMessage(sock.user.id, { text: ownerMsg });
        }
        
        console.log(`[StatusMgr] ✅ Status saved: ${fileName}`);
        return true;
        
    } catch (err) {
        console.error(`[StatusMgr] ❌ Save failed: ${err.message}`);
        return false;
    }
}

// ─── Main handler ──────────────────────────────────────────────────────────────
async function handleStatusBroadcast(sock, m) {
    try {
        const statusId    = m.key.id;
        const participant = m.key.participant;   // may be @lid

        // Skip own status echoes (participant is null when it is our own post)
        if (!participant) return;

        // ── Dedup: skip if we already handled this status ID this session ───
        if (_seenIds.has(statusId)) {
            console.log(`[StatusMgr] ⏭️  Duplicate status skipped: ${statusId}`);
            return;
        }
        _seenIds.add(statusId);
        // Prevent unbounded growth — keep only the last 500 IDs
        if (_seenIds.size > 500) {
            const oldest = _seenIds.values().next().value;
            _seenIds.delete(oldest);
        }

        const { inner, msgType } = unwrapStatus(m);

        // THE fix: use the phone JID (participantPn) not the LID for all delivery
        const phoneJid = resolvePhoneJid(m.key);
        const botRaw   = sock.user?.id || global.botJid || '';
        const botPhone = botRaw.replace(/:\d+@/, '@');   // strip :device suffix → bare phone JID

        // Get effective settings with runtime overrides
        const settings = getEffectiveSettings();

        console.log(`[StatusMgr] >>> id=${statusId} lid=${participant} phoneJid=${phoneJid} type=${msgType}`);
        console.log(`[StatusMgr] ⚙️  view=${settings.shouldView} react=${settings.shouldReact} reply=${settings.shouldReply} save=${settings.shouldSave}`);

        // ── 1. Auto View ───────────────────────────────────────────────────────
        if (settings.shouldView) {
            let viewDone = false;

            // sendReceipt is the correct gifted-baileys API for status read receipts
            try {
                await sock.sendReceipt('status@broadcast', participant, [statusId], 'read');
                console.log('[StatusMgr] ✅ VIEW OK via sendReceipt');
                viewDone = true;
            } catch (e1) {
                console.warn(`[StatusMgr] sendReceipt failed: ${e1.message}`);
            }

            // Fallback to readMessages if sendReceipt is not available
            if (!viewDone) {
                try {
                    await sock.readMessages([{
                        remoteJid:   'status@broadcast',
                        id:          statusId,
                        participant: participant,
                        fromMe:      false,
                    }]);
                    console.log('[StatusMgr] ✅ VIEW OK via readMessages');
                    viewDone = true;
                } catch (e2) {
                    console.warn(`[StatusMgr] readMessages failed: ${e2.message}`);
                }
            }

            if (!viewDone) console.error('[StatusMgr] ❌ VIEW FAILED — all methods exhausted');
        }

        // ── 2. Auto React ──────────────────────────────────────────────────────
        if (settings.shouldReact) {
            const randomEmoji = settings.emojis[Math.floor(Math.random() * settings.emojis.length)].trim() || '❤️';

            // THE FIX: statusJidList must use @s.whatsapp.net JIDs, never @lid.
            // WhatsApp silently drops reactions when LID JIDs appear in this list.
            const statusJidList = [phoneJid, botPhone].filter(Boolean);

            console.log(`[StatusMgr] 🔄 REACT emoji=${randomEmoji} statusJidList=${JSON.stringify(statusJidList)}`);

            try {
                await sock.sendMessage(
                    'status@broadcast',
                    {
                        react: {
                            text: randomEmoji,
                            key:  m.key,      // pass original key as-is (gifted-baileys requirement)
                        },
                    },
                    { statusJidList }
                );
                console.log('[StatusMgr] ✅ REACT sent OK');
            } catch (e) {
                console.error(`[StatusMgr] ❌ REACT FAILED: ${e.message}`);
            }
        }

        // ── 3. Auto Reply ──────────────────────────────────────────────────────
        // COMPLETELY DISABLED - Bot will NEVER reply to statuses
        // if (settings.shouldReply && !m.key.fromMe) {
        //     // Send reply to the phone JID, not the LID
        //     const replyTo = phoneJid || participant;
        //     try {
        //         await sock.sendMessage(
        //             replyTo,
        //             {
        //                 text: settings.replyMessage,
        //                 contextInfo: {
        //                     stanzaId:      statusId,
        //                     participant:   replyTo,
        //                     quotedMessage: inner,
        //                 },
        //             }
        //         );
        //         console.log('[StatusMgr] ✅ REPLY sent OK');
        //     } catch (e) {
        //         console.warn(`[StatusMgr] ⚠️ REPLY failed: ${e.message}`);
        //     }
        // }

        // ── 4. Status Saver ────────────────────────────────────────────────────
        if (settings.shouldSave) {
            try {
                const displayJid   = phoneJid || participant;
                let userName = displayJid.split('@')[0];
                
                // Try to get name if available
                try {
                    const nameResult = await sock.getName?.(displayJid);
                    if (nameResult) userName = nameResult;
                } catch (e) {}
                
                const header = '📥 *AUTO STATUS SAVER*';
                let caption = `${header}\n\n*👤 Status From:* ${userName}`;
                let saved = false;

                switch (msgType) {
                    case 'imageMessage':
                        if (inner.imageMessage?.caption) caption += `\n*📝 Caption:* ${inner.imageMessage.caption}`;
                        saved = await saveMediaMessage(sock, m, 'imageMessage', caption, userName);
                        break;
                    case 'videoMessage':
                        if (inner.videoMessage?.caption) caption += `\n*📝 Caption:* ${inner.videoMessage.caption}`;
                        saved = await saveMediaMessage(sock, m, 'videoMessage', caption, userName);
                        break;
                    case 'audioMessage':
                        caption += '\n*🎵 Audio Status*';
                        saved = await saveMediaMessage(sock, m, 'audioMessage', caption, userName);
                        break;
                    case 'extendedTextMessage':
                        caption = `${header}\n\n${inner.extendedTextMessage?.text || ''}`;
                        if (sock.user?.id) {
                            await sock.sendMessage(sock.user.id, { text: caption });
                            saved = true;
                        }
                        break;
                    case 'conversation':
                        caption = `${header}\n\n${inner.conversation || ''}`;
                        if (sock.user?.id) {
                            await sock.sendMessage(sock.user.id, { text: caption });
                            saved = true;
                        }
                        break;
                    default:
                        console.warn(`[StatusMgr] ℹ️ No saver handler for type: ${msgType}`);
                        break;
                }

                if (saved) {
                    console.log(`[StatusMgr] ✅ Status saved: ${statusId}`);
                    
                    // Send reply to status owner if enabled
                    if (settings.shouldReplySave) {
                        try {
                            await sock.sendMessage(phoneJid || participant, { text: settings.saveReplyMessage });
                            console.log('[StatusMgr] ✅ Save reply sent to status owner');
                        } catch (e) {
                            console.warn(`[StatusMgr] ⚠️ Save reply failed: ${e.message}`);
                        }
                    }
                }
            } catch (e) {
                console.error(`[StatusMgr] ❌ Save process failed: ${e.message}`);
            }
        }

    } catch (e) {
        console.error(`[StatusMgr] ❌ Handler error: ${e.message}\n${e.stack}`);
    }
}

// ─── Runtime flag setter (used by autostatus.js plugin) ───────────────────────
function getAutoStatusSettings() {
    const flags = global.autoStatusFlags || {};
    const resolve = (runtimeVal, configVal) => {
        if (runtimeVal !== null && runtimeVal !== undefined) return String(runtimeVal);
        if (configVal  !== null && configVal  !== undefined) return String(configVal);
        return 'false';
    };
    return {
        autoviewStatus:   resolve(flags.seen,  config.AUTO_STATUS_SEEN),
        autoLikeStatus:   resolve(flags.react, config.AUTO_STATUS_REACT),
        autoReplyStatus:  'false', // Always disabled
        statusReplyText:  config.AUTO_STATUS_MSG      || 'Seen by GURU BOT 💖',
        statusLikeEmojis: config.CUSTOM_REACT_EMOJIS  || '🪾,🌴,🪻,🌿,🌲,🌵,🍂,☄️,🪽,🪶,🚀🍖',
        statusSaver:      String(config.Status_Saver  || 'false'),
        statusSaverReply: String(config.STATUS_REPLY  || 'false'),
        statusSaverMsg:   config.STATUS_MSG           || 'GURU BOT 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    };
}

// ─── Export everything ─────────────────────────────────────────────────────────
module.exports = { 
    handleStatusBroadcast, 
    getAutoStatusSettings, 
    unwrapStatus,
    saveMediaMessage
};
