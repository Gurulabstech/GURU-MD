const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "npm",
  desc: "Search and get info about an npm package.",
  react: '📦',
  category: "convert",  // or change to "info" if you prefer
  filename: __filename,
  use: ".npm <package-name>   Example: .npm axios"
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args.length) {
      return reply("❓ Please provide a package name!\nExample: *.npm express* or *.npm axios*");
    }

    const packageName = args.join(" ").trim();
    const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

    const response = await axios.get(apiUrl, {
      timeout: 10000, // 10s timeout to avoid hanging
      validateStatus: status => status === 200 || status === 404
    });

    if (response.status === 404) {
      return reply(`❌ Package *${packageName}* not found on npm.\nTry checking the spelling!`);
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
    const weeklyDownloads = pkg.downloads?.weekly || "Not tracked yet"; // Note: requires separate API for real downloads, optional here

    const message = `
╔═════ *GURU MD NPM SEARCH* ═════╗
│
│ 📦 *Package:* ${packageName}
│ 📝 *Description:* ${description}
│ 🏷️ *Latest Version:* ${latest}
│ 🪪 *License:* ${license}
│ 📊 *Weekly Downloads:* ${weeklyDownloads}
│ 🔗 *NPM Page:* https://www.npmjs.com/package/${packageName}
│ 🌐 *Homepage:* ${homepage}
│ 📁 *Repository:* ${repo}
│
╚═══════════════════════════════╝

> Powered by npm registry • © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`;

    await conn.sendMessage(from, { text: message }, { quoted: mek });

  } catch (error) {
    console.error("NPM command error:", error.message);
    reply(`❌ Error: ${error.message.includes("404") ? "Package not found" : "Failed to fetch from npm"}. Try again later!`);
  }
});
