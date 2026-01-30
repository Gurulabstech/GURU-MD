const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // ──────────────── Core Settings ────────────────
    SESSION_ID: process.env.SESSION_ID || "",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "GURU MD",
    STICKER_NAME: process.env.STICKER_NAME || "GURU MD",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "254778074353",
    OWNER_NAME: process.env.OWNER_NAME || "GuruTech",
    DEV: process.env.DEV || "254778074353",
    DESCRIPTION: process.env.DESCRIPTION || "*© ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech*",
    MODE: process.env.MODE || "public", // public, private, group, inbox

    // ──────────────── Status Features ────────────────
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "true",
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY GURU MD 🤍*",

    // ──────────────── Anti & Protection ────────────────
    ANTI_LINK: process.env.ANTI_LINK || "true",
    ANTI_LINK_KICK: process.env.ANTI_LINK_KICK || "false",
    DELETE_LINKS: process.env.DELETE_LINKS || "true",
    ANTI_BAD: process.env.ANTI_BAD || "false",
    ANTI_VV: process.env.ANTI_VV || "true", // Anti view once
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "log", // 'same' to resend in chat

    // ──────────────── Auto Features ────────────────
    AUTO_REACT: process.env.AUTO_REACT || "false",
    CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "🚀,🌟,⚡,🔥,💫,🪐,🌙,☄️,💥,✨,🌀,🌌,🛸,🎇,🎆",
    AUTO_VOICE: process.env.AUTO_VOICE || "false",
    AUTO_STICKER: process.env.AUTO_STICKER || "false",
    AUTO_REPLY: process.env.AUTO_REPLY || "false",
    AUTO_TYPING: process.env.AUTO_TYPING || "false",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "true",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    READ_CMD: process.env.READ_CMD || "false",

    // ──────────────── Group Features ────────────────
    WELCOME: process.env.WELCOME || "true",
    ADMIN_EVENTS: process.env.ADMIN_EVENTS || "false",

    // ──────────────── Visuals & Media ────────────────
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/ntfw9h.jpg",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/ntfw9h.jpg",
    LIVE_MSG: process.env.LIVE_MSG || "> Zinda Hun Yar *GURU MD* ⚡",

    // ──────────────── NEW & ADVANCED OPTIONS (2026) ────────────────
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || "true",        // Auto mark status as seen
    AUTO_SAVE_STATUS: process.env.AUTO_SAVE_STATUS || "false",      // Auto-download statuses to folder
    STATUS_SAVE_PATH: process.env.STATUS_SAVE_PATH || "./statuses", // Where to save statuses
    ANTI_CALL: process.env.ANTI_CALL || "true",                     // Reject incoming calls
    AUTO_BLOCK_SPAM: process.env.AUTO_BLOCK_SPAM || "false",        // Block users spamming
    SPAM_THRESHOLD: process.env.SPAM_THRESHOLD || 5,                // Messages in 10s to consider spam
    PUBLIC_MODE: process.env.PUBLIC_MODE || "true",                 // Allow non-contacts to use bot
    ANTI_DELETE: process.env.ANTI_DELETE || "true",                 // Detect & log deleted messages
    AUTO_TYPING_ON_CMD: process.env.AUTO_TYPING_ON_CMD || "true",   // Show typing when processing cmds
    AUTO_READ_RECEIPTS: process.env.AUTO_READ_RECEIPTS || "true",   // Send blue ticks automatically

    // ──────────────── Tagging / Branding (customizable) ────────────────
    ENABLE_TAGGING: convertToBool(process.env.ENABLE_TAGGING, 'true'),
    BOT_TAG_TEXT: process.env.BOT_TAG_TEXT || "> _Powered by GURU MD 💢_",
    TAG_POSITION: process.env.TAG_POSITION || "end",                // "end" or "start"

    // ──────────────── Even More Advanced / Future-Proof Options (2026+) ────────────────
    COMMAND_COOLDOWN_SECONDS: Number(process.env.COMMAND_COOLDOWN_SECONDS) || 3,      // Anti-spam per command
    MAX_GROUP_LIMIT: Number(process.env.MAX_GROUP_LIMIT) || 0,                       // 0 = unlimited
    AUTO_BACKUP_SESSIONS: convertToBool(process.env.AUTO_BACKUP_SESSIONS, 'false'),  // Backup creds.json periodically
    BACKUP_INTERVAL_MINUTES: Number(process.env.BACKUP_INTERVAL_MINUTES) || 60,      // How often to backup
    ANTI_SPAM_VOICE: convertToBool(process.env.ANTI_SPAM_VOICE, 'false'),            // Block voice spam
    ALLOWED_COUNTRIES: process.env.ALLOWED_COUNTRIES || "",                         // Comma-separated country codes (e.g. KE,US,TZ)
    BLOCK_UNKNOWN_USERS: convertToBool(process.env.BLOCK_UNKNOWN_USERS, 'false'),    // Block non-contacts
    AUTO_TRANSLATE_REPLIES: convertToBool(process.env.AUTO_TRANSLATE_REPLIES, 'false'), // Auto-translate bot replies to user language
    DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || "en",                          // Fallback language code
    MAX_MESSAGE_LENGTH: Number(process.env.MAX_MESSAGE_LENGTH) || 4096,              // Truncate very long messages
    DEBUG_LOG_LEVEL: process.env.DEBUG_LOG_LEVEL || "info",                          // debug | info | warn | error
    ENABLE_BETA_FEATURES: convertToBool(process.env.ENABLE_BETA_FEATURES, 'false'),  // Unlock experimental commands
    BETA_PASSWORD: process.env.BETA_PASSWORD || "",                                  // Optional password for beta access

    // ──────────────── Ultra-Advanced & Experimental Features (2026+) ────────────────
    ENABLE_AI_AUTO_RESPONSE: convertToBool(process.env.ENABLE_AI_AUTO_RESPONSE, 'false'), // AI replies to non-command messages
    AI_MODEL: process.env.AI_MODEL || "gpt-4o-mini",                                 // Which AI model to use
    AI_TEMPERATURE: Number(process.env.AI_TEMPERATURE) || 0.7,                       // Creativity level (0.0–1.0)
    AUTO_AI_THINKING: convertToBool(process.env.AUTO_AI_THINKING, 'true'),           // Show "Thinking..." before AI reply
    VOICE_COMMAND_ENABLED: convertToBool(process.env.VOICE_COMMAND_ENABLED, 'false'), // Process voice messages as commands
    VOICE_COMMAND_PREFIX: process.env.VOICE_COMMAND_PREFIX || "hey guru",            // Wake phrase for voice commands
    ENABLE_IMAGE_GENERATION: convertToBool(process.env.ENABLE_IMAGE_GENERATION, 'false'), // .imagine <prompt>
    IMAGE_GEN_PROVIDER: process.env.IMAGE_GEN_PROVIDER || "dalle",                   // dalle | stable-diffusion | flux
    MAX_IMAGE_GEN_PER_DAY: Number(process.env.MAX_IMAGE_GEN_PER_DAY) || 10,          // Limit per user/day
    ENABLE_WEB_SEARCH_IN_AI: convertToBool(process.env.ENABLE_WEB_SEARCH_IN_AI, 'true'), // Let AI search web when needed
    ENABLE_MULTI_LANGUAGE_AI: convertToBool(process.env.ENABLE_MULTI_LANGUAGE_AI, 'true'), // Detect & reply in user language
    USER_LANGUAGE_DETECTION: convertToBool(process.env.USER_LANGUAGE_DETECTION, 'true'),
    ENABLE_GROUP_AI_MODERATION: convertToBool(process.env.ENABLE_GROUP_AI_MODERATION, 'false'), // AI detects toxicity/spam
    TOXICITY_THRESHOLD: Number(process.env.TOXICITY_THRESHOLD) || 0.7,               // 0.0–1.0 (higher = stricter)
    AUTO_FORWARD_TO_OWNER: convertToBool(process.env.AUTO_FORWARD_TO_OWNER, 'false'), // Forward all commands to owner
    FORWARD_EXCLUDE_COMMANDS: process.env.FORWARD_EXCLUDE_COMMANDS || "alive,menu,ping", // Comma-separated list
    ENABLE_SESSION_SHARING: convertToBool(process.env.ENABLE_SESSION_SHARING, 'false'), // Allow owner to share session QR
    SESSION_EXPIRY_DAYS: Number(process.env.SESSION_EXPIRY_DAYS) || 30,              // Auto-logout after X days inactivity
    ENABLE_DAILY_BACKUP_NOTIFY: convertToBool(process.env.ENABLE_DAILY_BACKUP_NOTIFY, 'true'), // Notify owner on backup
    DAILY_BACKUP_TIME: process.env.DAILY_BACKUP_TIME || "03:00",                     // 24h format (HH:MM)
};
