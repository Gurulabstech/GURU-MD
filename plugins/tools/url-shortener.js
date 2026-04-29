const axios = require('axios');

module.exports = {
    name: "URL Shortener",
    alias: ["short", "shorten", "tiny", "bitly", "shrink"],
    desc: "Shorten long URLs",
    category: "Tools",
    usage: ".short <url>",
    react: "🔗",
    start: async (conn, m, { text, prefix, reply }) => {
        if (!text) return reply(`❌ Please provide a URL!\n\nExample: ${prefix}short https://example.com/very/long/url`);
        
        // Validate URL
        const urlRegex = /^https?:\/\//i;
        if (!urlRegex.test(text)) {
            text = 'https://' + text;
        }
        
        try {
            reply('🔗 Shortening URL...');
            
            // Try multiple services
            let shortUrl = await shortenWithTinyURL(text);
            
            if (!shortUrl) {
                shortUrl = await shortenWithIsGD(text);
            }
            
            if (!shortUrl) {
                shortUrl = await shortenWithVgd(text);
            }
            
            if (!shortUrl) {
                shortUrl = await shortenWithLocal(text);
            }
            
            if (shortUrl) {
                await conn.sendMessage(m.from, {
                    text: `*🔗 URL Shortened*\n\n*Original:* ${text}\n*Short:* ${shortUrl}\n\nᴳᵁᴿᵁᴹᴰ`,
                    contextInfo: {
                        externalAdReply: {
                            title: 'URL Shortener',
                            body: 'Powered by GuruTech',
                            thumbnailUrl: 'https://files.catbox.moe/ntfw9h.jpg',
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m });
            } else {
                reply('❌ Failed to shorten URL. Please try another service.');
            }
            
        } catch (error) {
            console.error('[URL Shortener Error]:', error);
            reply(`❌ URL shortening failed: ${error.message}`);
        }
    }
};

async function shortenWithTinyURL(url) {
    try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 5000 });
        return res.data;
    } catch (e) {
        return null;
    }
}

async function shortenWithIsGD(url) {
    try {
        const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 5000 });
        return res.data;
    } catch (e) {
        return null;
    }
}

async function shortenWithVgd(url) {
    try {
        const res = await axios.get(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 5000 });
        return res.data;
    } catch (e) {
        return null;
    }
}

async function shortenWithLocal(url) {
    try {
        const res = await axios.post('https://api.akuari.my.id/tools/shortlink', {
            url: url
        }, { timeout: 5000 });
        return res.data.result || null;
    } catch (e) {
        return null;
    }
}
