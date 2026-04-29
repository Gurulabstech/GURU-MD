// Make cmd globally available so old plugins can use it
global.cmd = function(info, func) {
    var data = info;
    data.function = func;
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if (!info.filename) data.filename = "Not Provided";
    commands.push(data);
    return data;
};

var commands = [];

// ──────────────── PREFIX MANAGER ────────────────
const fs = require('fs');
const path = require('path');

// Store custom prefixes per chat
let customPrefixes = {};

// Load saved prefixes
const prefixFile = path.join(__dirname, 'prefixes.json');
if (fs.existsSync(prefixFile)) {
    try {
        customPrefixes = JSON.parse(fs.readFileSync(prefixFile));
        console.log(`[PREFIX] Loaded ${Object.keys(customPrefixes).length} custom prefixes`);
    } catch (e) {
        console.log('[PREFIX] Error loading prefixes:', e.message);
    }
}

// Save prefixes periodically
setInterval(() => {
    fs.writeFileSync(prefixFile, JSON.stringify(customPrefixes, null, 2));
}, 60000);

// Function to get prefix for a chat
global.getPrefix = function(chatId) {
    return customPrefixes[chatId] || global.config?.PREFIX || ',';
};

// Function to set prefix for a chat
global.setPrefix = function(chatId, newPrefix) {
    if (newPrefix === 'reset') {
        delete customPrefixes[chatId];
    } else {
        customPrefixes[chatId] = newPrefix;
    }
    fs.writeFileSync(prefixFile, JSON.stringify(customPrefixes, null, 2));
    return true;
};

// Function to get all custom prefixes
global.getAllPrefixes = function() {
    return { ...customPrefixes };
};

// ──────────────── MESSAGE HANDLER WITH PREFIX SUPPORT ────────────────
global.handleMessage = async (conn, mek, m, config) => {
    try {
        const from = m.key.remoteJid;
        const body = m.message?.conversation || 
                     m.message?.extendedTextMessage?.text || 
                     m.message?.imageMessage?.caption || 
                     m.message?.videoMessage?.caption || '';
        
        if (!body) return;
        
        // Get prefix for this chat
        const prefix = global.getPrefix(from);
        
        // Check if message starts with prefix
        if (!body.startsWith(prefix)) return;
        
        // Extract command and args
        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Find command
        const command = commands.find(cmd => {
            if (cmd.pattern === commandName) return true;
            if (cmd.alias && cmd.alias.includes(commandName)) return true;
            return false;
        });
        
        if (!command) return;
        
        console.log(`[COMMAND] Executing: ${commandName} in ${from} with prefix: ${prefix}`);
        
        // Execute command
        await command.function(conn, mek, m, {
            from,
            args,
            q: args.join(' '),
            isGroup: from.endsWith('@g.us'),
            sender: m.key.participant || m.key.remoteJid,
            reply: (text) => conn.sendMessage(from, { text }, { quoted: mek }),
            isOwner: global.config?.OWNER_NUMBER?.includes(m.key.participant?.split('@')[0]) || false
        });
        
    } catch (err) {
        console.error('[HANDLER] Error:', err);
    }
};

// ──────────────── EXPORTS ────────────────
module.exports = {
    cmd: global.cmd,
    AddCommand: global.cmd,
    Function: global.cmd,
    Module: global.cmd,
    commands,
    getPrefix: global.getPrefix,
    setPrefix: global.setPrefix,
    getAllPrefixes: global.getAllPrefixes,
    handleMessage: global.handleMessage
};

// ──────────────── AUTO-LOAD PLUGINS ────────────────
function loadPlugins() {
    const pluginsDir = path.join(__dirname, 'plugins');

    if (!fs.existsSync(pluginsDir)) {
        console.log('[COMMAND] Plugins folder not found!');
        return;
    }

    fs.readdirSync(pluginsDir).forEach(file => {
        if (path.extname(file).toLowerCase() === '.js') {
            try {
                const pluginPath = path.join(pluginsDir, file);
                require(pluginPath);  // This executes the plugin file → calls cmd() if old style

                // After require(), check if it exported a new-style plugin
                const plugin = require(pluginPath);
                if (plugin.pattern && typeof plugin.function === 'function') {
                    // Convert to internal format
                    global.cmd({
                        pattern: plugin.pattern,
                        alias: plugin.alias || [],
                        desc: plugin.desc || '',
                        category: plugin.category || 'misc',
                        react: plugin.react || '',
                        filename: file,
                        fromMe: plugin.fromMe || false,
                        dontAddCommandList: plugin.dontAddCommandList || false
                    }, plugin.function);

                    console.log(`[COMMAND] Loaded new-style: ${file} → ${plugin.pattern}`);
                }

            } catch (err) {
                console.error(`[COMMAND] Failed to load ${file}: ${err.message}`);
            }
        }
    });

    console.log(`[COMMAND] Total commands loaded: ${commands.length}`);
}

// Run loader
loadPlugins();
