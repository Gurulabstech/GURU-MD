const { cmd } = require('../command');

cmd({
    pattern: "invoice",
    alias: ["bill"],
    desc: "Generate a professional service invoice",
    category: "tools",
    react: "📑",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    const args = q.split('|');
    if (args.length < 3) return reply(`*─── 📑 𝐇𝐎𝐖 𝐓𝐎 𝐔𝐒𝐄 📑 ───*\n\n*Format:* .invoice Service | Price | ClientName\n*Example:* .invoice Web Design | 5000 KES | John Doe`);

    const [service, price, client] = args;
    const invID = Math.floor(1000 + Math.random() * 9000);

    const invoice = `
█║▌│█│║▌║││█║▌║▌║
   *𝔾𝕌ℝ𝕌 𝕋𝔼ℂℍ 𝕀ℕ𝕍𝕆𝕀ℂ𝔼*
█║▌│█│║▌║││█║▌║▌║

📑 *𝐈𝐍𝐕𝐎𝐈𝐂𝐄 𝐈𝐃:* #GT-${invID}
👤 *𝐂𝐋𝐈𝐄𝐍𝐓:* ${client.trim()}
🛠️ *𝐒𝐄𝐑𝐕𝐈𝐂𝐄:* ${service.trim()}
💰 *𝐀𝐌𝐎𝐔𝐍𝐓:* ${price.trim()}

📅 *𝐃𝐀𝐓𝐄:* ${new Date().toDateString()}
📍 *𝐎𝐑𝐈𝐆𝐈𝐍:* Nairobi, KE 🇰🇪

*𝐏𝐚𝐲𝐦𝐞𝐧𝐭 𝐢𝐬 𝐫𝐞𝐪𝐮𝐢𝐫𝐞𝐝 𝐭𝐨 𝐜𝐨𝐧𝐭𝐢𝐧𝐮𝐞.*
🏗️ *𝐄𝐝𝐢𝐭𝐢𝐨𝐧:* 𝐒𝐭𝐞𝐞𝐥 𝐌𝐚𝐱
> © GURU TECH LAB 2026`;

    await conn.sendMessage(from, {
        image: { url: "https://files.catbox.moe/66h86e.jpg" },
        caption: invoice.trim(),
        contextInfo: {
            externalAdReply: {
                title: `𝕀ℕ𝕍𝕆𝕀ℂ𝔼 𝔽𝕆ℝ ${client.toUpperCase()}`,
                body: `Total Due: ${price}`,
                mediaType: 1,
                thumbnailUrl: "https://files.catbox.moe/66h86e.jpg",
                sourceUrl: "https://wa.me/254XXXXXXX", // Replace with your WhatsApp link
                renderLargerThumbnail: true
            }
        }
    }, { quoted: mek });
});
