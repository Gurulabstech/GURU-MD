const { cmd } = require('../command');

cmd({
  pattern: "twgc",
  aliases: ["togstatus", "groupstatus", "tosgroup"],
  category: "group",
  desc: "Post text, image, video, audio, or sticker to group status (admin only)",
  onlyGroup: true,
  adminOnly: true,
  filename: __filename
}, async (conn, mek, m, { args, reply, q, quoted, isGroup, isAdmin, sender }) => {
  try {
    // Group & Admin checks
    if (!isGroup) return reply("❌ This command only works in groups!");
    
    if (!isAdmin) {
      const userNumber = sender.split('@')[0];
      return conn.sendMessage(m.chat, {
        text: `@${userNumber} you are not an admin`,
        mentions: [`${userNumber}@s.whatsapp.net`]
      }, { quoted: mek });
    }

    // No content provided
    if (!q && !quoted) {
      return reply(getHelpText());
    }

    let payload = null;
    let caption = q || "";

    // Build payload from quoted message
    if (quoted) {
      payload = await buildPayloadFromQuoted(quoted, conn);
      if (caption && payload) {
        if (payload.video || payload.image || (payload.convertedSticker && payload.image)) {
          payload.caption = caption;
        }
      }
    }
    // Pure text only
    else if (q) {
      payload = { text: q };
    }

    if (!payload) {
      return reply(getHelpText());
    }

    // Send to group status
    await sendGroupStatus(conn, m.chat, payload);

    const mediaType = detectMediaType(quoted, payload);
    let successMsg = `✅ ${mediaType} posted to group status!`;
    if (payload.caption) successMsg += `\n📝 "${payload.caption}"`;
    if (payload.convertedSticker) successMsg += `\n(sticker converted to image)`;

    await reply(successMsg);

  } catch (error) {
    console.error('twgc Error:', error);
    reply(`❌ Error: ${error.message || "Unknown error"}`);
  }
});

/* ──────────────────────────────────────────────
   HELPER FUNCTIONS
────────────────────────────────────────────── */

// Help text
function getHelpText() {
  return `
📢 *GROUP STATUS COMMAND*

Usage:
• .twgc Hello everyone! 👋
• Reply to image/video/sticker → .twgc
• Reply to media → .twgc Optional caption here

Examples:
• .twgc Meeting at 8 PM 🔥
• Reply to photo → .twgc New update!
• Reply to sticker → .twgc 😂

Note: Bot must be group admin
`;
}

// Build payload from quoted message
async function buildPayloadFromQuoted(quoted, client) {
  const msg = quoted.message;

  if (msg?.videoMessage) {
    const buffer = await client.downloadMediaMessage(quoted);
    return {
      video: buffer,
      caption: msg.videoMessage.caption || '',
      gifPlayback: msg.videoMessage.gifPlayback || false,
      mimetype: msg.videoMessage.mimetype || 'video/mp4'
    };
  }

  if (msg?.imageMessage) {
    const buffer = await client.downloadMediaMessage(quoted);
    return {
      image: buffer,
      caption: msg.imageMessage.caption || '',
      mimetype: msg.imageMessage.mimetype || 'image/jpeg'
    };
  }

  if (msg?.audioMessage) {
    const buffer = await client.downloadMediaMessage(quoted);
    if (msg.audioMessage.ptt) {
      const vnBuffer = await toVN(buffer);
      return { audio: vnBuffer, mimetype: "audio/ogg; codecs=opus", ptt: true };
    }
    return {
      audio: buffer,
      mimetype: msg.audioMessage.mimetype || 'audio/mpeg',
      ptt: false
    };
  }

  if (msg?.stickerMessage) {
    try {
      const buffer = await client.downloadMediaMessage(quoted);
      const imageBuffer = await convertStickerToImage(buffer, msg.stickerMessage.mimetype);
      return {
        image: imageBuffer,
        caption: msg.stickerMessage.caption || '',
        mimetype: 'image/png',
        convertedSticker: true
      };
    } catch (e) {
      console.error('Sticker conversion failed:', e);
      return { text: `⚠️ Failed to convert sticker (${msg.stickerMessage.mimetype || 'unknown'})` };
    }
  }

  if (msg?.conversation || msg?.extendedTextMessage?.text) {
    return { text: msg.conversation || msg.extendedTextMessage?.text || '' };
  }

  return null;
}

// Detect media type for success message
function detectMediaType(quoted, payload = {}) {
  if (!quoted) return 'Text';
  const msg = quoted.message;
  if (msg?.videoMessage) return 'Video';
  if (msg?.imageMessage) return 'Image';
  if (msg?.audioMessage) return msg.audioMessage.ptt ? 'Voice Note' : 'Audio';
  if (msg?.stickerMessage) {
    return payload.convertedSticker ? 'Sticker → Image' : 'Sticker';
  }
  return 'Text';
}

// Download media to buffer
async function downloadToBuffer(client, message, type) {
  const stream = await client.downloadContentFromMessage(message, type);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

// Send to group status (this is the critical part - using relayMessage method)
async function sendGroupStatus(conn, jid, content) {
  const { generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
  const crypto = require('crypto');

  const inner = await generateWAMessageContent(content, { upload: conn.waUploadToServer });
  const messageSecret = crypto.randomBytes(32);

  const msg = generateWAMessageFromContent(jid, {
    messageContextInfo: { messageSecret },
    groupStatusMessageV2: {
      message: {
        ...inner,
        messageContextInfo: { messageSecret }
      }
    }
  }, {});

  await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

// Convert audio buffer to voice note (opus)
async function toVN(inputBuffer) {
  return new Promise((resolve, reject) => {
    const ffmpeg = require('fluent-ffmpeg');
    const { PassThrough } = require('stream');

    const inStream = new PassThrough();
    inStream.end(inputBuffer);
    const outStream = new PassThrough();
    const chunks = [];

    ffmpeg(inStream)
      .noVideo()
      .audioCodec("libopus")
      .format("ogg")
      .audioBitrate("48k")
      .audioChannels(1)
      .audioFrequency(48000)
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe(outStream, { end: true });

    outStream.on("data", chunk => chunks.push(chunk));
  });
}

// Basic sticker → image conversion (fallback)
async function convertStickerToImage(stickerBuffer, mimetype = 'image/webp') {
  try {
    // Very basic check - most webp stickers can be sent as image directly
    if (stickerBuffer.slice(0, 12).toString('hex').includes('52494646')) {
      return stickerBuffer; // RIFF header → treat as image
    }
    return stickerBuffer;
  } catch (error) {
    throw new Error(`Sticker conversion failed: ${error.message}`);
  }
}
