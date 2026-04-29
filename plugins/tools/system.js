// plugins/system.js
const { cmd } = require('../command');
const os = require('os');

cmd({
    pattern: "system",
    desc: "Get system info",
    category: "utility",
    react: "💻",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const cpu = os.cpus()[0].model;
        const mem = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
        const uptime = runtime(process.uptime());

        reply(`*System Info*\nCPU: ${cpu}\nMemory: ${mem}\nUptime: ${uptime}\nPlatform: ${os.platform()}\n\n> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`);
    } catch (e) {
        reply("Error fetching system info!");
    }
});
