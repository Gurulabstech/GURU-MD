/* ============================================
   GURU MD - BUSINESS ANALYTICS DASHBOARD
   COMMAND: .analytics, .stats
   FEATURES: User engagement, popular commands, group activity
   ============================================ */

const { cmd, commands } = require('../command');
const fs = require('fs');
const path = require('path');

const statsFile = path.join(__dirname, '../bot_stats.json');

// Initialize or load stats
let botStats = {
    totalCommands: 0,
    commandUsage: {},
    userActivity: {},
    groupActivity: {},
    dailyStats: [],
    popularCommands: [],
    uptime: Date.now()
};

if (fs.existsSync(statsFile)) {
    try {
        botStats = JSON.parse(fs.readFileSync(statsFile));
    } catch { /* ignore */ }
}

// Save stats periodically
setInterval(() => {
    fs.writeFileSync(statsFile, JSON.stringify(botStats, null, 2));
}, 60000); // Every minute

cmd({
    pattern: "analytics",
    alias: ["botstats", "dashboard"],
    desc: "View detailed bot analytics dashboard",
    category: "owner",
    react: "📊",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ Owner only!");

        const now = Date.now();
        const uptime = formatUptime(now - botStats.uptime);
        
        // Calculate daily average
        const today = new Date().toDateString();
        const todayStats = botStats.dailyStats.find(d => d.date === today) || { commands: 0 };
        
        // Get top users
        const topUsers = Object.entries(botStats.userActivity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([user, count]) => `║ 👤 @${user.split('@')[0]}: ${count} cmds`);
        
        // Get top commands
        const topCommands = Object.entries(botStats.commandUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cmd, count]) => `║ 🔹 ${cmd}: ${count} uses`);
        
        // Get top groups
        const topGroups = Object.entries(botStats.groupActivity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([group, count]) => `║ 👥 ${group.substring(0, 15)}...: ${count}`);
        
        const dashboard = `
╔══════════════════════════════════════╗
║     📊 *BOT ANALYTICS DASHBOARD*     ║
╠══════════════════════════════════════╣
║ 📈 *OVERVIEW*                         ║
║ ├─ Total Commands: ${botStats.totalCommands}
║ ├─ Unique Users: ${Object.keys(botStats.userActivity).length}
║ ├─ Active Groups: ${Object.keys(botStats.groupActivity).length}
║ └─ Uptime: ${uptime}
╠══════════════════════════════════════╣
║ 🔥 *TODAY'S ACTIVITY*                 ║
║ ├─ Commands Today: ${todayStats.commands}
║ └─ Peak Hour: ${todayStats.peakHour || 'N/A'}
╠══════════════════════════════════════╣
║ 🏆 *TOP USERS*                        ║
${topUsers.join('\n') || '║ No data yet'}
╠══════════════════════════════════════╣
║ ⚡ *POPULAR COMMANDS*                 ║
${topCommands.join('\n') || '║ No data yet'}
╠══════════════════════════════════════╣
║ 👥 *MOST ACTIVE GROUPS*               ║
${topGroups.join('\n') || '║ No data yet'}
╠══════════════════════════════════════╣
║ 📊 *COMMAND CATEGORY BREAKDOWN*       ║
${getCategoryBreakdown()}
╚══════════════════════════════════════╝
        `;
        
        reply(dashboard);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});

// Track command usage (add to your command handler)
function trackCommand(command, user, group = null) {
    botStats.totalCommands++;
    
    // Track command
    botStats.commandUsage[command] = (botStats.commandUsage[command] || 0) + 1;
    
    // Track user
    botStats.userActivity[user] = (botStats.userActivity[user] || 0) + 1;
    
    // Track group
    if (group) {
        botStats.groupActivity[group] = (botStats.groupActivity[group] || 0) + 1;
    }
    
    // Daily stats
    const today = new Date().toDateString();
    let dailyStat = botStats.dailyStats.find(d => d.date === today);
    if (!dailyStat) {
        dailyStat = { date: today, commands: 0, peakHour: 0 };
        botStats.dailyStats.push(dailyStat);
        if (botStats.dailyStats.length > 30) botStats.dailyStats.shift();
    }
    dailyStat.commands++;
    
    const hour = new Date().getHours();
    dailyStat.peakHour = hour;
    
    // Update popular commands
    botStats.popularCommands = Object.entries(botStats.commandUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
}

// Export for use in other plugins
module.exports.trackCommand = trackCommand;

// Helper functions
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
}

function getCategoryBreakdown() {
    const categoryCount = {};
    commands.forEach(cmd => {
        const cat = cmd.category || 'misc';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => `║ • ${cat}: ${count} plugins`)
        .join('\n');
}

// Reset stats
cmd({
    pattern: "resetstats",
    desc: "Reset bot analytics",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ Owner only!");
        
        botStats = {
            totalCommands: 0,
            commandUsage: {},
            userActivity: {},
            groupActivity: {},
            dailyStats: [],
            popularCommands: [],
            uptime: Date.now()
        };
        
        fs.writeFileSync(statsFile, JSON.stringify(botStats, null, 2));
        reply("✅ Analytics reset successfully!");
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});
