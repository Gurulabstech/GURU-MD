const { cmd } = require('../command');
const { exec } = require('child_process');

cmd({
    pattern: "push",
    desc: "Commit and push changes to GitHub",
    category: "owner",
    react: "📤",
    filename: __filename
},
async (conn, mek, m, { from, q, isOwner, reply }) => {
    if (!isOwner) return reply("*Owner Only!*");
    if (!q) return reply(`*─── 📤 𝐇𝐎𝐖 𝐓𝐎 𝐔𝐒𝐄 📤 ───*\n\n*Command:* .push <commit message>\n*Example:* .push "Updated Downloader UI"`);

    await reply("*🚀 GURU-MD: Starting Git Push...*");

    exec(`git add . && git commit -m "${q}" && git push`, (err, stdout, stderr) => {
        if (err) return reply(`*❌ Git Error:* ${err.message}`);
        
        const report = `
╭━━━━〔 *𝔾𝕀𝕋 ℙ𝕌𝕊ℍ* 〕━━━━╮
┃
┃ ✅ *𝐒𝐭𝐚𝐭𝐮𝐬:* Success
┃ 📝 *𝐌𝐬𝐠:* ${q}
┃ 🏗️ *𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱
┃
╰━━━━━━━━━━━━━━━━━━━━╯
> © GURU TECH LAB 2026`;
        reply(report.trim());
    });
});
