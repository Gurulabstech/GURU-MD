//---------------------------------------------------------------------------
//           GURU-MD - SETTINGS MANAGER
//---------------------------------------------------------------------------
const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Path to store settings persistently
const SETTINGS_FILE = path.join(__dirname, '../settings.json');

// Load saved settings if exists
let savedSettings = {};
try {
    if (fs.existsSync(SETTINGS_FILE)) {
        savedSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        // Apply saved settings to config
        Object.assign(config, savedSettings);
        console.log('[Settings] Loaded saved settings');
    }
} catch (e) {
    console.error('[Settings] Error loading settings:', e.message);
}

// Function to save settings to file
function saveSettings() {
    try {
        const settingsToSave = {
            ADMIN_EVENTS: config.ADMIN_EVENTS,
            WELCOME: config.WELCOME,
            PREFIX: config.PREFIX,
            MODE: config.MODE,
            AUTO_TYPING: config.AUTO_TYPING,
            MENTION_REPLY: config.MENTION_REPLY,
            ALWAYS_ONLINE: config.ALWAYS_ONLINE,
            AUTO_RECORDING: config.AUTO_RECORDING,
            AUTO_STATUS_SEEN: config.AUTO_STATUS_SEEN,
            AUTO_STATUS_REACT: config.AUTO_STATUS_REACT,
            READ_MESSAGE: config.READ_MESSAGE,
            AUTO_VOICE: config.AUTO_VOICE,
            ANTI_BAD_WORD: config.ANTI_BAD_WORD,
            AUTO_STICKER: config.AUTO_STICKER,
            AUTO_REPLY: config.AUTO_REPLY,
            AUTO_REACT: config.AUTO_REACT,
            AUTO_STATUS_REPLY: config.AUTO_STATUS_REPLY,
            ANTI_LINK: config.ANTI_LINK,
            ANTI_LINK_KICK: config.ANTI_LINK_KICK,
            DELETE_LINKS: config.DELETE_LINKS
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsToSave, null, 2));
        console.log('[Settings] Saved settings to file');
    } catch (e) {
        console.error('[Settings] Error saving settings:', e.message);
    }
}

// ==================== ADMIN EVENTS ====================
cmd({
    pattern: "admin-events",
    alias: ["adminevents"],
    desc: "Enable or disable admin event notifications",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.ADMIN_EVENTS = "true";
        saveSettings();
        return reply("✅ Admin event notifications are now enabled.");
    } else if (status === "off") {
        config.ADMIN_EVENTS = "false";
        saveSettings();
        return reply("❌ Admin event notifications are now disabled.");
    } else {
        return reply(`Usage: .admin-events on/off\nCurrent: ${config.ADMIN_EVENTS === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== WELCOME ====================
cmd({
    pattern: "welcome",
    alias: ["welcomeset"],
    desc: "Enable or disable welcome messages for new members",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.WELCOME = "true";
        saveSettings();
        return reply("✅ Welcome messages are now enabled.");
    } else if (status === "off") {
        config.WELCOME = "false";
        saveSettings();
        return reply("❌ Welcome messages are now disabled.");
    } else {
        return reply(`Usage: .welcome on/off\nCurrent: ${config.WELCOME === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== SET PREFIX ====================
cmd({
    pattern: "setprefix",
    alias: ["prefix"],
    react: "🔧",
    desc: "Change the bot's command prefix",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const newPrefix = args[0];
    if (!newPrefix) return reply(`❌ Please provide a new prefix.\n\nCurrent prefix: *${config.PREFIX}*\n\nExample: .setprefix !`);

    config.PREFIX = newPrefix;
    saveSettings();

    return reply(`✅ Prefix successfully changed to *${newPrefix}*`);
});

// ==================== MODE ====================
cmd({
    pattern: "mode",
    alias: ["setmode"],
    react: "🫟",
    desc: "Set bot mode to private or public",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    if (!args[0]) {
        return reply(`📌 Current mode: *${config.MODE}*\n\nUsage: .mode private OR .mode public`);
    }

    const modeArg = args[0].toLowerCase();

    if (modeArg === "private") {
        config.MODE = "private";
        saveSettings();
        return reply("✅ Bot mode is now set to *PRIVATE*.");
    } else if (modeArg === "public") {
        config.MODE = "public";
        saveSettings();
        return reply("✅ Bot mode is now set to *PUBLIC*.");
    } else {
        return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
    }
});

// ==================== AUTO TYPING ====================
cmd({
    pattern: "auto-typing",
    alias: ["autotyping"],
    desc: "Enable or disable auto-typing feature",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (!status || !["on", "off"].includes(status)) {
        return reply(`Usage: .auto-typing on/off\nCurrent: ${config.AUTO_TYPING === "true" ? "✅ ON" : "❌ OFF"}`);
    }

    config.AUTO_TYPING = status === "on" ? "true" : "false";
    saveSettings();
    
    if (status === "on") {
        await conn.sendPresenceUpdate("composing", from).catch(() => {});
    }
    
    return reply(`✅ Auto typing has been turned ${status}.`);
});

// ==================== MENTION REPLY ====================
cmd({
    pattern: "mention-reply",
    alias: ["menetionreply", "mee"],
    desc: "Enable or disable mention reply feature",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.MENTION_REPLY = "true";
        saveSettings();
        return reply("✅ Mention Reply feature is now enabled.");
    } else if (status === "off") {
        config.MENTION_REPLY = "false";
        saveSettings();
        return reply("❌ Mention Reply feature is now disabled.");
    } else {
        return reply(`Usage: .mee on/off\nCurrent: ${config.MENTION_REPLY === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== ALWAYS ONLINE ====================
cmd({
    pattern: "always-online",
    alias: ["alwaysonline"],
    desc: "Enable or disable always online mode",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.ALWAYS_ONLINE = "true";
        saveSettings();
        await conn.sendPresenceUpdate("available", from).catch(() => {});
        return reply("✅ Always online mode is now enabled.");
    } else if (status === "off") {
        config.ALWAYS_ONLINE = "false";
        saveSettings();
        return reply("❌ Always online mode is now disabled.");
    } else {
        return reply(`Usage: .always-online on/off\nCurrent: ${config.ALWAYS_ONLINE === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== AUTO RECORDING ====================
cmd({
    pattern: "auto-recording",
    alias: ["autorecording"],
    desc: "Enable or disable auto-recording feature",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (!status || !["on", "off"].includes(status)) {
        return reply(`Usage: .auto-recording on/off\nCurrent: ${config.AUTO_RECORDING === "true" ? "✅ ON" : "❌ OFF"}`);
    }

    config.AUTO_RECORDING = status === "on" ? "true" : "false";
    saveSettings();
    
    if (status === "on") {
        await conn.sendPresenceUpdate("recording", from);
        return reply("✅ Auto recording is now enabled. Bot is recording...");
    } else {
        await conn.sendPresenceUpdate("available", from);
        return reply("✅ Auto recording has been disabled.");
    }
});

// ==================== AUTO STATUS SEEN ====================
cmd({
    pattern: "auto-seen",
    alias: ["autostatusview"],
    desc: "Enable or disable auto-viewing of statuses",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_STATUS_SEEN = "true";
        saveSettings();
        return reply("✅ Auto-viewing of statuses is now enabled.");
    } else if (status === "off") {
        config.AUTO_STATUS_SEEN = "false";
        saveSettings();
        return reply("❌ Auto-viewing of statuses is now disabled.");
    } else {
        return reply(`Usage: .auto-seen on/off\nCurrent: ${config.AUTO_STATUS_SEEN === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== AUTO STATUS REACT ====================
cmd({
    pattern: "status-react",
    alias: ["statusreaction"],
    desc: "Enable or disable auto-liking of statuses",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_STATUS_REACT = "true";
        saveSettings();
        return reply("✅ Auto-liking of statuses is now enabled.");
    } else if (status === "off") {
        config.AUTO_STATUS_REACT = "false";
        saveSettings();
        return reply("❌ Auto-liking of statuses is now disabled.");
    } else {
        return reply(`Usage: .status-react on/off\nCurrent: ${config.AUTO_STATUS_REACT === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== READ MESSAGE ====================
cmd({
    pattern: "read-message",
    alias: ["autoread", "readmessage"],
    desc: "Enable or disable auto-read messages",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.READ_MESSAGE = "true";
        saveSettings();
        return reply("✅ Auto-read feature is now enabled.");
    } else if (status === "off") {
        config.READ_MESSAGE = "false";
        saveSettings();
        return reply("❌ Auto-read feature is now disabled.");
    } else {
        return reply(`Usage: .readmessage on/off\nCurrent: ${config.READ_MESSAGE === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== AUTO VOICE ====================
cmd({
    pattern: "auto-voice",
    alias: ["autovoice"],
    desc: "Enable or disable auto-voice feature",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_VOICE = "true";
        saveSettings();
        return reply("✅ Auto-voice feature is now enabled.");
    } else if (status === "off") {
        config.AUTO_VOICE = "false";
        saveSettings();
        return reply("❌ Auto-voice feature is now disabled.");
    } else {
        return reply(`Usage: .autovoice on/off\nCurrent: ${config.AUTO_VOICE === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== ANTI BAD WORD ====================
cmd({
    pattern: "anti-bad",
    alias: ["antibadword", "antibad"],
    desc: "Enable or disable anti-bad word",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.ANTI_BAD_WORD = "true";
        saveSettings();
        return reply("✅ Anti-bad word is now enabled.");
    } else if (status === "off") {
        config.ANTI_BAD_WORD = "false";
        saveSettings();
        return reply("❌ Anti-bad word is now disabled.");
    } else {
        return reply(`Usage: .antibad on/off\nCurrent: ${config.ANTI_BAD_WORD === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== AUTO STICKER ====================
cmd({
    pattern: "auto-sticker",
    alias: ["autosticker"],
    desc: "Enable or disable auto-sticker",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_STICKER = "true";
        saveSettings();
        return reply("✅ Auto-sticker feature is now enabled.");
    } else if (status === "off") {
        config.AUTO_STICKER = "false";
        saveSettings();
        return reply("❌ Auto-sticker feature is now disabled.");
    } else {
        return reply(`Usage: .auto-sticker on/off\nCurrent: ${config.AUTO_STICKER === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== AUTO REPLY ====================
cmd({
    pattern: "auto-reply",
    alias: ["autoreply"],
    desc: "Enable or disable auto-reply",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_REPLY = "true";
        saveSettings();
        return reply("✅ Auto-reply is now enabled.");
    } else if (status === "off") {
        config.AUTO_REPLY = "false";
        saveSettings();
        return reply("❌ Auto-reply is now disabled.");
    } else {
        return reply(`Usage: .auto-reply on/off\nCurrent: ${config.AUTO_REPLY === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== AUTO REACT ====================
cmd({
    pattern: "auto-react",
    alias: ["autoreact"],
    desc: "Enable or disable auto-react feature",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_REACT = "true";
        saveSettings();
        return reply("✅ Auto-react feature is now enabled.");
    } else if (status === "off") {
        config.AUTO_REACT = "false";
        saveSettings();
        return reply("❌ Auto-react feature is now disabled.");
    } else {
        return reply(`Usage: .auto-react on/off\nCurrent: ${config.AUTO_REACT === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== STATUS REPLY ====================
cmd({
    pattern: "status-reply",
    alias: ["autostatusreply"],
    desc: "Enable or disable status reply",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner can use this command!");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_STATUS_REPLY = "true";
        saveSettings();
        return reply("✅ Status reply feature is now enabled.");
    } else if (status === "off") {
        config.AUTO_STATUS_REPLY = "false";
        saveSettings();
        return reply("❌ Status reply feature is now disabled.");
    } else {
        return reply(`Usage: .status-reply on/off\nCurrent: ${config.AUTO_STATUS_REPLY === "true" ? "✅ ON" : "❌ OFF"}`);
    }
});

// ==================== ANTI LINK ====================
cmd({
    pattern: "antilink",
    alias: ["antilinks"],
    desc: "Enable or disable ANTI_LINK in groups",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command can only be used in a group.');
        if (!isBotAdmins) return reply('❌ Bot must be an admin to use this command.');
        if (!isAdmins) return reply('❌ You must be an admin to use this command.');

        if (args[0] === "on") {
            config.ANTI_LINK = "true";
            saveSettings();
            return reply("✅ ANTI_LINK has been enabled.");
        } else if (args[0] === "off") {
            config.ANTI_LINK = "false";
            saveSettings();
            return reply("❌ ANTI_LINK has been disabled.");
        } else {
            return reply(`Usage: .antilink on/off\nCurrent: ${config.ANTI_LINK === "true" ? "✅ ON" : "❌ OFF"}`);
        }
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== ANTI LINK KICK ====================
cmd({
    pattern: "antilinkkick",
    alias: ["kicklink"],
    desc: "Enable or disable ANTI_LINK_KICK in groups",
    category: "group",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command can only be used in a group.');
        if (!isBotAdmins) return reply('❌ Bot must be an admin to use this command.');
        if (!isAdmins) return reply('❌ You must be an admin to use this command.');

        if (args[0] === "on") {
            config.ANTI_LINK_KICK = "true";
            saveSettings();
            return reply("✅ ANTI_LINK_KICK has been enabled.");
        } else if (args[0] === "off") {
            config.ANTI_LINK_KICK = "false";
            saveSettings();
            return reply("❌ ANTI_LINK_KICK has been disabled.");
        } else {
            return reply(`Usage: .antilinkkick on/off\nCurrent: ${config.ANTI_LINK_KICK === "true" ? "✅ ON" : "❌ OFF"}`);
        }
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== DELETE LINKS ====================
cmd({
    pattern: "deletelink",
    alias: ["linksdelete"],
    desc: "Enable or disable DELETE_LINKS in groups",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command can only be used in a group.');
        if (!isBotAdmins) return reply('❌ Bot must be an admin to use this command.');
        if (!isAdmins) return reply('❌ You must be an admin to use this command.');

        if (args[0] === "on") {
            config.DELETE_LINKS = "true";
            saveSettings();
            return reply("✅ DELETE_LINKS is now enabled.");
        } else if (args[0] === "off") {
            config.DELETE_LINKS = "false";
            saveSettings();
            return reply("❌ DELETE_LINKS is now disabled.");
        } else {
            return reply(`Usage: .deletelink on/off\nCurrent: ${config.DELETE_LINKS === "true" ? "✅ ON" : "❌ OFF"}`);
        }
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// Export save function for use elsewhere
module.exports = { saveSettings };
