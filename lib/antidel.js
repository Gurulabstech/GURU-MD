const { isJidGroup } = require('baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../config');

/**
 * Send text notification for deleted text messages
 * @param {Object} conn - WhatsApp connection
 * @param {Object} mek - Original message
 * @param {String} jid - Target chat JID
 * @param {String} deleteInfo - Anti-delete message text
 * @param {Boolean} isGroup - Is this a group chat?
 * @param {Object} update - Update object from events
 */
const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
  try {
    const messageContent = 
      mek.message?.conversation || 
      mek.message?.extendedTextMessage?.text || 
      'Unknown content';

    deleteInfo += `\n\n*Content:* ${messageContent}`;

    await conn.sendMessage(jid, {
      text: deleteInfo,
      contextInfo: {
        mentionedJid: isGroup 
          ? [update.key?.participant || '', mek.key?.participant || ''].filter(Boolean)
          : [update.key?.remoteJid || ''].filter(Boolean),
      },
    }, { quoted: mek });
  } catch (err) {
    console.error('[DeletedText] Failed:', err.message);
  }
};

/**
 * Attempt to resend deleted media with anti-delete info
 * @param {Object} conn - WhatsApp connection
 * @param {Object} mek - Original message
 * @param {String} jid - Target chat JID
 * @param {String} deleteInfo - Anti-delete message text
 */
const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
  try {
    // Safe deep copy with fallback
    const antideletedmek = mek.message ? structuredClone(mek.message) : {};

    const messageType = Object.keys(antideletedmek)[0] || '';

    if (messageType && antideletedmek[messageType]) {
      antideletedmek[messageType].contextInfo = {
        stanzaId: mek.key?.id || '',
        participant: mek.sender || mek.key?.participant || '',
        quotedMessage: mek.message || {},
      };
    }

    // Add caption to supported media types
    if (['imageMessage', 'videoMessage'].includes(messageType)) {
      const oldCaption = antideletedmek[messageType].caption || '';
      antideletedmek[messageType].caption = oldCaption ? `\( {oldCaption}\n\n \){deleteInfo}` : deleteInfo;
    } else if (['audioMessage', 'documentMessage'].includes(messageType)) {
      // Fallback to text for unsupported media
      await conn.sendMessage(jid, {
        text: `*🚨 Delete Detected!*\n\n${deleteInfo}`,
      }, { quoted: mek });
      return;
    }

    // Relay reconstructed message
    await conn.relayMessage(jid, antideletedmek, {});
  } catch (err) {
    console.error('[DeletedMedia] Failed:', err.message);
    // Ultimate fallback: send text if relay fails
    await conn.sendMessage(jid, {
      text: `*🚨 Delete Detected (media relay failed)*\n\n${deleteInfo}`,
    }, { quoted: mek }).catch(e => console.error('[DeletedMedia Fallback] Failed:', e.message));
  }
};

/**
 * Main AntiDelete event handler
 * @param {Object} conn - WhatsApp connection
 * @param {Array} updates - Array of message update events
 */
const AntiDelete = async (conn, updates) => {
  if (!Array.isArray(updates)) {
    console.warn('[AntiDelete] Invalid updates format (not array)');
    return;
  }

  for (const update of updates) {
    // Only process deleted messages
    if (update?.update?.message !== null) continue;

    try {
      const store = await loadMessage(update.key?.id);
      if (!store || !store.message) continue;

      const mek = store.message;
      const isGroup = isJidGroup(store.jid);
      const antiType = isGroup ? 'gc' : 'dm';
      const antiEnabled = await getAnti(antiType);

      if (!antiEnabled) continue;

      // Localized time (Nairobi/EAT timezone)
      const deleteTime = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Africa/Nairobi',
      });

      let deleteInfo = '';
      let targetJid = config.ANTI_DEL_PATH === "log" ? conn.user.id : store.jid;

      if (isGroup) {
        let groupName = 'Unknown Group';
        try {
          const groupMetadata = await conn.groupMetadata(store.jid);
          groupName = groupMetadata?.subject || groupName;
        } catch (err) {
          console.warn('[AntiDelete] Group metadata fetch failed:', err.message);
        }

        const sender = mek.key?.participant?.split('@')[0] || 'unknown';
        const deleter = update.key?.participant?.split('@')[0] || 'unknown';

        deleteInfo = `*AntiDelete Detected*\n\n` +
                     `*Time:* ${deleteTime}\n` +
                     `*Group:* ${groupName}\n` +
                     `*Deleted by:* @${deleter}\n` +
                     `*Sender:* @${sender}`;
      } else {
        const senderNumber = mek.key?.remoteJid?.split('@')[0] || 'unknown';
        const deleterNumber = update.key?.remoteJid?.split('@')[0] || 'unknown';

        deleteInfo = `*-- AntiDelete Detected --*\n\n` +
                     `*Time:* ${deleteTime}\n` +
                     `*Deleted by:* @${deleterNumber}\n` +
                     `*Sender:* @${senderNumber}`;
      }

      // Route based on message type
      if (mek.message?.conversation || mek.message?.extendedTextMessage) {
        await DeletedText(conn, mek, targetJid, deleteInfo, isGroup, update);
      } else {
        await DeletedMedia(conn, mek, targetJid, deleteInfo);
      }
    } catch (err) {
      console.error('[AntiDelete] Main loop error:', err.message);
    }
  }
};

module.exports = {
  DeletedText,
  DeletedMedia,
  AntiDelete,
};
