const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: "uptime",
    alias: ["runtime", "up", "alive", "online"],
    desc: "Show bot uptime in random stylish formats",
    category: "main",
    react: "⏱️",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        const uptime = runtime(process.uptime());
        const startTime = new Date(Date.now() - process.uptime() * 1000);
        const botName = config.BOT_NAME || "GURU MD";
        const ownerName = config.OWNER_NAME || "GuruTech";
        const version = "4.5.0"; // ← Update this as needed

        // All 10 stylish templates
        const styles = [
            // Style 1: Classic Box
            `╭───『 UPTIME 』───⳹
│
│ ⏱️ ${uptime}
│
│ 🚀 Started: ${startTime.toLocaleString()}
│
╰────────────────⳹
${config.DESCRIPTION || botName + " - Powered by GuruTech"}`,

            // Style 2: Minimalist
            `•——[ UPTIME ]——•
  │
  ├─ ⏳ ${uptime}
  ├─ 🕒 Since: ${startTime.toLocaleTimeString()}
  │
  •——[ ${botName} ]——•`,

            // Style 3: Fancy Borders
            `▄▀▄▀▄ BOT UPTIME ▄▀▄▀▄

  ♢ Running: ${uptime}
  ♢ Since: ${startTime.toLocaleDateString()}
  
  ${config.DESCRIPTION || "Powered by " + ownerName}`,

            // Style 4: Code Style
            `┌──────────────────────┐
│  ⚡ UPTIME STATUS ⚡  │
├──────────────────────┤
│ • Time: ${uptime}
│ • Started: ${startTime.toLocaleString()}
│ • Version: ${version}
└──────────────────────┘`,

            // Style 5: Modern Blocks
            `▰▰▰▰▰ UPTIME ▰▰▰▰▰

  ⏳ ${uptime}
  🕰️ ${startTime.toLocaleString()}
  
  ${config.DESCRIPTION || botName}`,

            // Style 6: Retro Terminal
            `╔══════════════════════╗
║   ${botName} UPTIME    ║
╠══════════════════════╣
║ > RUNTIME: ${uptime}
║ > SINCE: ${startTime.toLocaleString()}
╚══════════════════════╝`,

            // Style 7: Elegant
            `┌───────────────┐
│  ⏱️  UPTIME  │
└───────────────┘
│
│ ${uptime}
│
│ Since ${startTime.toLocaleDateString()}
│
┌───────────────┐
│  ${botName}  │
└───────────────┘`,

            // Style 8: Social Media Style
            `⏱️ *Uptime Report* ⏱️

🟢 Online for: ${uptime}
📅 Since: ${startTime.toLocaleString()}

${config.DESCRIPTION || "Powered by " + ownerName}`,

            // Style 9: Fancy List
            `╔♫═⏱️═♫══════════╗
   ${botName} UPTIME
╚♫═⏱️═♫══════════╝

•・゜゜・* ✧  *・゜゜・•
 ✧ ${uptime}
 ✧ Since ${startTime.toLocaleDateString()}
•・゜゜・* ✧  *・゜゜・•`,

            // Style 10: Professional
            `┏━━━━━━━━━━━━━━━━━━┓
┃  UPTIME ANALYSIS  ┃
┗━━━━━━━━━━━━━━━━━━┛

◈ Duration: ${uptime}
◈ Start Time: ${startTime.toLocaleString()}
◈ Stability: 100%
◈ Version:  ${version}

${config.DESCRIPTION || botName + " - Always Online"}`
        ];

        // Pick random style
        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        // Send with premium forwarding tricks
        await conn.sendMessage(from, { 
            text: selectedStyle,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363416335506023@newsletter',
                    newsletterName: ownerName + ' SUPPORT',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Optional success reaction
        await conn.sendMessage(from, { react: { text: "⏱️", key: mek.key } });

    } catch (e) {
        console.error("Uptime command error:", e);
        await reply(`❌ Error: ${e.message || "Something went wrong"}`);
    }
});
