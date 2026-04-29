const _axiosLib = require('axios');
const axios = _axiosLib.default || _axiosLib;
const os = require('os');
const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const config = require('../config');

// Load GitHub token from config
const GITHUB_TOKEN = config.GITHUB_TOKEN || '';

// Create axios instance with token for GitHub API
const githubApi = axios.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'GURU-MD-Bot/1.0',
        ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
    }
});

cmd({
  pattern: 'version',
  alias: ["changelog", "cupdate", "checkupdate", "v"],
  react: '🚀',
  desc: "Check bot's version, system stats, changelog & update status.",
  category: 'info',
  filename: __filename
}, async (conn, mek, m, {
  from, sender, pushname, reply
}) => {
  try {
    // Local version from data/version.json
    const localVersionPath = path.join(__dirname, '../data/version.json');
    let localVersion = 'Unknown';
    let localChangelog = 'No changelog available.';
    
    if (fs.existsSync(localVersionPath)) {
      try {
        const localData = JSON.parse(fs.readFileSync(localVersionPath, 'utf8'));
        localVersion = localData.version || 'Unknown';
        localChangelog = localData.changelog || 'No changelog available.';
      } catch (parseErr) {
        console.error('Error parsing local version.json:', parseErr.message);
      }
    }

    // Fetch latest from your GitHub repo with token
    const rawVersionUrl = 'https://raw.githubusercontent.com/Gurulabstech/GURU-MD/main/data/version.json';
    let latestVersion = 'Unknown';
    let latestChangelog = 'No changelog available.';
    let rateLimitInfo = '';
    
    try {
      // Try to get rate limit info first
      try {
        const rateLimit = await githubApi.get('https://api.github.com/rate_limit');
        const remaining = rateLimit.data.resources.core.remaining;
        const limit = rateLimit.data.resources.core.limit;
        
        if (GITHUB_TOKEN) {
          rateLimitInfo = `\n📊 API: ${remaining}/${limit} (Token)`;
        } else {
          rateLimitInfo = `\n📊 API: ${remaining}/${limit} (No Token)`;
        }
        
        if (remaining < 10) {
          rateLimitInfo += ' ⚠️ Low';
        }
      } catch (rateErr) {
        console.log('Rate limit check failed:', rateErr.message);
      }

      // Fetch version.json
      const { data } = await axios.get(rawVersionUrl, {
        timeout: 10000,
        headers: GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {}
      });
      
      latestVersion = data.version || 'Unknown';
      latestChangelog = data.changelog || 'No changelog available.';
      
    } catch (error) {
      console.error('Failed to fetch latest version:', error.message);
      
      // Handle specific GitHub errors
      if (error.response?.status === 403) {
        latestVersion = 'Rate Limited';
        latestChangelog = 'GitHub API rate limit exceeded. Try again in an hour.';
      } else if (error.response?.status === 401) {
        latestVersion = 'Token Invalid';
        latestChangelog = 'GitHub token is invalid. Check your config.env';
      } else if (error.response?.status === 404) {
        latestVersion = 'Not Found';
        latestChangelog = 'Version file not found on GitHub.';
      }
    }

    // Plugin & command counts
    const pluginPath = path.join(__dirname, '../plugins');
    let pluginCount = 0;
    if (fs.existsSync(pluginPath)) {
      try {
        pluginCount = fs.readdirSync(pluginPath).filter(file => file.endsWith('.js')).length;
      } catch (err) {
        console.error('Error reading plugins:', err.message);
      }
    }

    const totalCommands = commands.length;

    // System stats
    const uptime = runtime(process.uptime());
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
    const hostName = os.hostname();
    const cpuCores = os.cpus().length;
    const platform = os.platform();
    
    const lastUpdate = fs.existsSync(localVersionPath) 
      ? fs.statSync(localVersionPath).mtime.toLocaleString() 
      : 'Unknown';

    // Update status
    let updateStatus = "✅ Your GURU MD is up-to-date!";
    let updateEmoji = "✅";
    
    if (localVersion !== 'Unknown' && latestVersion !== 'Unknown' && localVersion !== latestVersion) {
      updateStatus = `🚨 Update Available!\n   Current: ${localVersion} → Latest: ${latestVersion}`;
      updateEmoji = "🚨";
    } else if (latestVersion === 'Rate Limited') {
      updateStatus = `⚠️ GitHub rate limited. Try again later.`;
      updateEmoji = "⚠️";
    } else if (latestVersion === 'Token Invalid') {
      updateStatus = `🔑 GitHub token invalid. Check config.env`;
      updateEmoji = "🔑";
    }

    // Fancy boxed design
    const statusMessage = `
╔════════════════════════════════════╗
║         ✨  G U R U   M D  ✨        ║
║      v${localVersion} • Status Check     ║
╠════════════════════════════════════╣
║  • Bot Name     : GURU MD           ║
║  • Current Ver  : ${localVersion.padEnd(15)}║
║  • Latest Ver   : ${latestVersion.padEnd(15)}║
║  • Plugins      : ${pluginCount.toString().padEnd(15)}║
║  • Commands     : ${totalCommands.toString().padEnd(15)}║
╠════════════════════════════════════╣
║  System Stats:                      ║
║  • Uptime       : ${uptime.padEnd(15)}║
║  • RAM          : ${ramUsage}/${totalRam} MB     ║
║  • CPU Cores    : ${cpuCores.toString().padEnd(15)}║
║  • Platform     : ${platform.padEnd(15)}║
║  • Host         : ${hostName.slice(0,13).padEnd(13)}║
║  • Last Update  : ${lastUpdate.slice(0,13)}... ║
╠════════════════════════════════════╣
║  Changelog (Latest):                ║
║  ${latestChangelog.replace(/\n/g, '\n║  ').slice(0, 150)}... ║
╠════════════════════════════════════╣
║  ${updateEmoji} ${updateStatus.padEnd(27)}║
║  ${rateLimitInfo.padEnd(35)}║
╚════════════════════════════════════╝

🔗 Repo: https://github.com/Gurulabstech/GURU-MD
👑 Owner: GuruTech
⭐ Star & Fork the repo! 🚀`;

    // Send with image
    await conn.sendMessage(from, {
      image: { url: "https://res.cloudinary.com/dgy2dutjs/image/upload/v1751707342/url.crissvevo.co.tz/%E1%B4%8F%CA%99%E1%B4%87%E1%B4%85%E1%B4%9B%E1%B4%87%E1%B4%84%CA%9C1_exmbht.jpg" },
      caption: statusMessage,
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
    }, { quoted: mek });

  } catch (error) {
    console.error('Version check error:', error);
    reply('❌ Error while checking version. Try again later.\n' + 
           'Details: ' + (error.message || 'Unknown error'));
  }
});
