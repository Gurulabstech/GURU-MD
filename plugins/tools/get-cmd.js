const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "npm",
  desc: "Search and get detailed info about an npm package with preview image",
  react: '📦',
  category: "info",  // Changed to "info" — feels more appropriate than "convert"
  filename: __filename,
  use: ".npm <package-name>   e.g. .npm axios"
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args.length) {
      return reply("❓ Please enter a package name!\nExample: *.npm express* or *.npm axios*");
    }

    const packageName = args.join(" ").trim();
    const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

    const response = await axios.get(apiUrl, {
      timeout: 10000,
      validateStatus: status => status === 200 || status === 404
    });

    if (response.status === 404) {
      return reply(`❌ Package *${packageName}* not found.\nPlease check the spelling!`);
    }

    if (response.status !== 200) {
      throw new Error(`npm registry error: ${response.status}`);
    }

    const pkg = response.data;

    const latest = pkg["dist-tags"]?.latest || "unknown";
    const description = pkg.description || "No description available.";
    const license = pkg.license || "Not specified";
    const repo = pkg.repository?.url?.replace(/^git\+/, "").replace(/\.git$/, "") || "Not available";
    const homepage = pkg.homepage || pkg.repository?.url || "Not available";

    // Optional: real weekly downloads (separate request)
    let weeklyDownloads = "N/A";
    try {
      const dlRes = await axios.get(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`);
      weeklyDownloads = dlRes.data.downloads?.toLocaleString() || "0";
    } catch {} // silent fail

    const caption = `
╔═════ *GURU MD • NPM SEARCH* ═════╗
│
│ 📦 *Package:* ${packageName}
│ 📝 *Description:* ${description}
│ 🏷️ *Latest Version:* ${latest}
│ 📊 *Weekly Downloads:* ${weeklyDownloads}
│ 🪪 *License:* ${license}
│ 🔗 *NPM:* https://www.npmjs.com/package/${packageName}
│ 🌐 *Homepage:* ${homepage}
│ 📁 *Repository:* ${repo}
│
╚══════════════════════════════════╝

> Powered by npm • © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`;

    // Send your custom image + caption
    await conn.sendMessage(from, {
      image: { url: "https://files.catbox.moe/ntfw9h.jpg" },
      caption: caption,
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
    console.error("NPM command error:", error.message);
    reply(`❌ Error: ${error.message.includes("404") ? "Package not found" : "Failed to connect to npm"}. Try again!`);
  }
});
