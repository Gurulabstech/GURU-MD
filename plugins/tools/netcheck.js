/* ============================================
   GURU MD - NETWORK DIAGNOSTIC
   COMMAND: .netcheck
   FEATURES: Tests connectivity to all download APIs
   ============================================ */

const { cmd } = require('../command');
const axios = require('axios');
const dns = require('dns').promises;
const https = require('https');

cmd({
    pattern: "netcheck",
    desc: "Check network connectivity to APIs",
    category: "tools",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await reply("🔍 Running network diagnostics...\n⏳ Please wait...");

        const apis = [
            { name: 'Google DNS', url: 'https://8.8.8.8', test: 'connectivity' },
            { name: 'Cloudflare', url: 'https://1.1.1.1', test: 'connectivity' },
            { name: 'Agatz API', url: 'https://api.agatz.xyz', test: 'dns+connect' },
            { name: 'Vihangayt', url: 'https://vihangayt.me', test: 'dns+connect' },
            { name: 'SaveMP3', url: 'https://www.savemp3.cc', test: 'dns+connect' },
            { name: 'Y2Mate', url: 'https://y2mate.guru', test: 'dns+connect' },
            { name: 'David Cyril', url: 'https://api.davidcyriltech.my.id', test: 'dns+connect' }
        ];

        let result = `🌐 *NETWORK DIAGNOSTIC RESULTS*\n\n`;
        result += `📊 Server Time: ${new Date().toLocaleString()}\n\n`;

        for (const api of apis) {
            result += `🔍 Testing: ${api.name}\n`;
            
            // Test DNS resolution
            try {
                const hostname = new URL(api.url).hostname;
                const dnsResult = await dns.lookup(hostname);
                result += `   📍 DNS: ✅ ${dnsResult.address}\n`;
            } catch (dnsErr) {
                result += `   📍 DNS: ❌ ${dnsErr.message}\n`;
            }

            // Test HTTP connectivity
            try {
                const start = Date.now();
                const response = await axios.get(api.url, {
                    timeout: 8000,
                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                });
                const time = Date.now() - start;
                result += `   🔌 HTTP: ✅ ${response.status} (${time}ms)\n`;
            } catch (httpErr) {
                result += `   🔌 HTTP: ❌ ${httpErr.message}\n`;
            }
            
            result += `\n`;
        }

        // Test IP configuration
        result += `📡 *SERVER INFO*\n`;
        try {
            const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
            result += `   Public IP: ${ipResponse.data.ip}\n`;
        } catch {
            result += `   Public IP: Failed to detect\n`;
        }

        result += `\n📌 *RECOMMENDATIONS*\n`;
        result += `• If DNS fails: Check your /etc/resolv.conf\n`;
        result += `• If HTTP fails: Check firewall/outbound rules\n`;
        result += `• All APIs failing: Possible IP ban or region block\n`;

        await reply(result);

    } catch (error) {
        reply("❌ Diagnostic error: " + error.message);
    }
});
