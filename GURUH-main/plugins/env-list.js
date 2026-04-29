const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

function isEnabled(value) {
    // Function to check if a value represents a "true" boolean state
    return value && value.toString().toLowerCase() === "true";
}

cmd({
    pattern: "env",
    alias: ["setting", "allvar"],
    desc: "Settings of bot",
    category: "menu",
    react: "⤵️",
    filename: __filename
}, 
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        // Define the settings message with the correct boolean checks
        let envSettings = `╭━━━〔 *GURU MD* 〕━━━┈⊷
┃▸╭───────────
┃▸┃๏ *ENV SETTINGS 💢*
┃▸└───────────···๏
╰────────────────┈⊷
╭━━〔 *Enabled Disabled* 〕━━┈⊷
┇๏ *Status View:* ${isEnabled(config.AUTO_STATUS_SEEN) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Status Reply:* ${isEnabled(config.AUTO_STATUS_REPLY) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Reply:* ${isEnabled(config.AUTO_REPLY) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Sticker:* ${isEnabled(config.AUTO_STICKER) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Voice:* ${isEnabled(config.AUTO_VOICE) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Custom Reacts:* ${isEnabled(config.CUSTOM_REACT) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto React:* ${isEnabled(config.AUTO_REACT) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Delete Links:* ${isEnabled(config.DELETE_LINKS) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Anti-Link:* ${isEnabled(config.ANTI_LINK) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Anti-Bad Words:* ${isEnabled(config.ANTI_BAD) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Typing:* ${isEnabled(config.AUTO_TYPING) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Recording:* ${isEnabled(config.AUTO_RECORDING) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Always Online:* ${isEnabled(config.ALWAYS_ONLINE) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Public Mode:* ${isEnabled(config.PUBLIC_MODE) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Read Message:* ${isEnabled(config.READ_MESSAGE) ? "Enabled ✅" : "Disabled ❌"}
╰━━━━━━━━━━━━──┈⊷
> *© ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech*`;

        // Send message with an image
        await conn.sendMessage(
            from,
            {
                image: { url: `https://files.catbox.moe/ntfw9h.jpg` },
                caption: envSettings,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363421164015033@newsletter',
                        newsletterName: 'GURU MD',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

        // Send interactive buttons using gifted-btns
        await sendButtons(conn, from, {
            title: 'GURU MD Settings',
            text: 'Quick toggle common features:',
            footer: 'Powered by GuruTech 💢',
            buttons: [
                { id: 'toggle_status_view', text: `Status View: ${isEnabled(config.AUTO_STATUS_SEEN) ? 'ON' : 'OFF'}` },
                { id: 'toggle_auto_reply', text: `Auto Reply: ${isEnabled(config.AUTO_REPLY) ? 'ON' : 'OFF'}` },
                { id: 'toggle_anti_link', text: `Anti-Link: ${isEnabled(config.ANTI_LINK) ? 'ON' : 'OFF'}` },
                { id: 'toggle_read_msg', text: `Read Msg: ${isEnabled(config.READ_MESSAGE) ? 'ON' : 'OFF'}` },
                { id: 'back_to_menu', text: 'Back to Main Menu' }
            ]
        }, { quoted: mek });

        // Send an audio file
        await conn.sendMessage(from, {
            audio: { url: 'https://github.com/criss-vevo/CRISS-DATA/raw/refs/heads/main/autovoice/menunew.m4a' },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: mek });

    } catch (error) {
        console.log(error);
        reply(`Error: ${error.message}`);
    }
});
