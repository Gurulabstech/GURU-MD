const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "praytime",
    alias: ["prayertimes", "prayertime", "ptime"],
    react: "🕌",
    desc: "Get prayer times, weather, and location for a city (default: Athi River, Kenya)",
    category: "information",
    filename: __filename,
},
async (conn, mek, m, { from, reply, args, q }) => {
    try {
        // Default to Athi River (your location)
        const city = args.length > 0 ? args.join(" ") : "Athi River";

        // Reliable free prayer time API
        const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Kenya&method=2`;

        const response = await axios.get(apiUrl);

        if (response.status !== 200 || !response.data.data) {
            return reply('Failed to fetch prayer times. Try another city.');
        }

        const timings = response.data.data.timings;
        const date = response.data.data.date.readable;
        const cityInfo = response.data.data.meta.timezone;

        // Build message with your branding
        let msg = `*ᴳᵁᴿᵁᴹᴰ Prayer Times*\n\n`;
        msg += `📍 *Location*: ${city}, Kenya\n`;
        msg += `📅 *Date*: ${date}\n`;
        msg += `🕌 *Timezone*: ${cityInfo}\n\n`;

        msg += `🌅 *Fajr*: ${timings.Fajr}\n`;
        msg += `🌞 *Sunrise*: ${timings.Sunrise}\n`;
        msg += `☀️ *Dhuhr*: ${timings.Dhuhr}\n`;
        msg += `🌇 *Asr*: ${timings.Asr}\n`;
        msg += `🌆 *Maghrib*: ${timings.Maghrib}\n`;
        msg += `🌃 *Isha*: ${timings.Isha}\n\n`;

        msg += `🧭 *Qibla Direction*: ${response.data.data.meta.offset || 'N/A'}°\n\n`;
        msg += `> _Powered by ᴳᵁᴿᵁᴹᴰ • Stay blessed 🕌`;

        // Send with your image and updated channel forwarding
        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/ntfw9h.jpg" },
            caption: msg,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406466294627@newsletter',
                    newsletterName: 'GURU TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Optional Islamic audio (you can remove or change URL)
        await conn.sendMessage(from, {
            audio: { url: "https://github.com/XdTechPro/KHAN-DATA/raw/refs/heads/main/autovoice/Islamic.m4a" },
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('Error fetching prayer times. Please try again or check the city name.');
    }
});
