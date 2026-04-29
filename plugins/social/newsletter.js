/* ============================================
   GURU MD - NEWSLETTER JID GENERATOR
   COMMAND: .newsletter [channel link]
   CONVERTS: Channel link → newsletter@jid format
   STYLE: Clean & Organized
   ============================================ */

const { cmd } = require('../command');

// Configuration
const BOT_NAME = 'ɢᴜʀᴜ ᴍᴅ';
const BOT_FOOTER = '∞ ɴᴇᴡꜱʟᴇᴛᴛᴇʀ ᴊɪᴅ ɢᴇɴᴇʀᴀᴛᴏʀ ∞';
const OWNER_NAME = 'ᴍʀꜱ ɢᴜʀᴜ';

// Helper to extract ID from channel link
function extractIdFromLink(link) {
    const patterns = [
        /whatsapp\.com\/channel\/(\d+)/i,
        /wa\.me\/channel\/(\d+)/i,
        /chat\.whatsapp\.com\/channel\/(\d+)/i,
        /channel\/(\d+)/i,
        /id=(\d+)/i
    ];
    
    for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match) return match[1];
    }
    
    const numbers = link.match(/\d{15,}/g);
    return numbers ? numbers[0] : null;
}

function isChannelLink(link) {
    return link.includes('channel') || /whatsapp\.com|wa\.me|chat\.whatsapp/i.test(link);
}

// Main command
cmd({
    pattern: "newsletter",
    alias: ["nid", "jid", "channeltojid"],
    desc: "Convert channel link to newsletter JID",
    category: "tools",
    react: "📢",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        await conn.sendMessage(from, {
            react: {
                text: "📢",
                key: mek.key
            }
        });

        if (!q) {
            const helpMsg = `📢 *NEWSLETTER JID GENERATOR*

*Usage:* .newsletter [channel link]

*Examples:*
• .newsletter https://whatsapp.com/channel/120363421164015033
• .newsletter https://wa.me/channel/120363421164015033
• .newsletter https://chat.whatsapp.com/channel/120363421164015033

*How to get link:*
1. Open your WhatsApp channel
2. Tap channel name
3. Share → Copy link

*Owner:* ${OWNER_NAME}`;
            return await reply(helpMsg);
        }

        const link = q.trim();

        if (!isChannelLink(link)) {
            const errorMsg = `❌ *Invalid Link*

Please provide a valid WhatsApp channel link.

*Valid formats:*
• https://whatsapp.com/channel/...
• https://wa.me/channel/...
• https://chat.whatsapp.com/channel/...`;
            return await reply(errorMsg);
        }

        const channelId = extractIdFromLink(link);
        
        if (!channelId) {
            const errorMsg = `❌ *Extraction Failed*

Could not extract channel ID from the provided link.

Make sure you're using a direct channel share link.`;
            return await reply(errorMsg);
        }

        const newsletterJid = `${channelId}@newsletter`;

        // Clean organized response
        const responseMsg = `📢 *NEWSLETTER JID GENERATED*

*Channel Link:* 
${link}

*Channel ID:* 
\`${channelId}\`

*Newsletter JID:* 
\`${newsletterJid}\`

*Usage in Bot Code:*
\`\`\`
forwardedNewsletterMessageInfo: {
    newsletterJid: '${newsletterJid}',
    newsletterName: 'YOUR_NAME',
    serverMessageId: 143
}
\`\`\`

*Search in WhatsApp:* 
\`L${channelId}\``;

        // Send main response
        await conn.sendMessage(from, {
            text: responseMsg,
            footer: BOT_FOOTER,
            buttons: [
                {
                    buttonId: `.newsletter ${link}`,
                    buttonText: { displayText: '🔄 Generate Again' },
                    type: 1
                }
            ],
            headerType: 1
        }, { quoted: mek });

        // Send just the JID for easy copying
        await conn.sendMessage(from, {
            text: `📢 *NEWSLETTER JID*\n\n\`${newsletterJid}\``
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {
        console.error('[NEWSLETTER] Error:', err.message);
        
        const errorMsg = `❌ *Error*\n\n${err.message.substring(0, 40)}\n\nPlease try again or contact owner.`;

        await reply(errorMsg);
        
        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });
    }
});
