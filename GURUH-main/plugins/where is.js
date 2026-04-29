/* ============================================
   GURU MD - LOCATION INTELLIGENCE
   COMMAND: .whereis [place]
   FEATURES: Location search, nearby places, maps links
   ============================================ */

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "whereis",
    alias: ["location", "maps", "place"],
    desc: "Find locations and get detailed info",
    category: "tools",
    react: "🗺️",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a place name!\n\nExample: .whereis Eiffel Tower, Paris");

        await conn.sendMessage(from, { react: { text: "🗺️", key: mek.key } });

        // Use OpenStreetMap Nominatim API
        const searchRes = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`,
            { headers: { 'User-Agent': 'GURU-MD-Bot/1.0' } }
        );

        if (!searchRes.data || searchRes.data.length === 0) {
            return reply("❌ Location not found!");
        }

        const location = searchRes.data[0];
        const lat = location.lat;
        const lon = location.lon;
        
        // Get detailed address
        const addressRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
        );
        
        const address = addressRes.data.address || {};
        
        // Get nearby places (using Overpass API)
        const nearbyRes = await axios.post('https://overpass-api.de/api/interpreter',
            `[out:json];(node["amenity"](around:1000,${lat},${lon});way["amenity"](around:1000,${lat},${lon}););out;`
        );
        
        const nearby = nearbyRes.data.elements?.slice(0, 5) || [];
        
        const result = `
╔══════════════════════════════════════╗
║     🗺️ *LOCATION DETAILS*           ║
╠══════════════════════════════════════╣
║ 📍 *Place:* ${location.display_name.split(',')[0]}
║ 📌 *Full Address:*                     ║
║ ${location.display_name.substring(0, 40)}...
╠══════════════════════════════════════╣
║ 📊 *Coordinates:*                     ║
║ ├─ Latitude: ${lat}
║ └─ Longitude: ${lon}
╠══════════════════════════════════════╣
║ 📋 *Address Details:*                 ║
║ ├─ City: ${address.city || address.town || 'N/A'}
║ ├─ State: ${address.state || 'N/A'}
║ ├─ Country: ${address.country || 'N/A'}
║ └─ Postcode: ${address.postcode || 'N/A'}
╠══════════════════════════════════════╣
║ 🏪 *Nearby Places (1km):*            ║
${nearby.map(p => `║ • ${p.tags?.name || p.tags?.amenity || 'Unknown'}`).join('\n') || '║ No nearby places found'}
╠══════════════════════════════════════╣
║ 🔗 *Google Maps:*                     ║
║ https://www.google.com/maps?q=${lat},${lon}
╚══════════════════════════════════════╝
        `;

        // Send location
        await conn.sendMessage(from, {
            location: {
                degreesLatitude: lat,
                degreesLongitude: lon
            }
        }, { quoted: mek });

        // Send details
        await reply(result);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

// Get directions between two places
cmd({
    pattern: "directions",
    alias: ["route", "howto"],
    desc: "Get directions between two locations",
    category: "tools",
    react: "🧭",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.includes(' to ')) {
            return reply("❌ Please provide: from [place] to [place]\n\nExample: .directions from Paris to London");
        }

        const [from, to] = q.split(' to ').map(s => s.replace(/^from /i, '').trim());
        
        // Geocode both locations
        const fromRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(from)}&format=json&limit=1`);
        const toRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(to)}&format=json&limit=1`);
        
        if (!fromRes.data.length || !toRes.data.length) {
            return reply("❌ Could not find one or both locations!");
        }
        
        const fromLoc = fromRes.data[0];
        const toLoc = toRes.data[0];
        
        const result = `
╔══════════════════════════════════════╗
║     🧭 *DIRECTIONS*                  ║
╠══════════════════════════════════════╣
║ 🟢 *From:* ${fromLoc.display_name.split(',')[0]}
║ 🔴 *To:* ${toLoc.display_name.split(',')[0]}
╠══════════════════════════════════════╣
║ 📊 *Coordinates:*                     ║
║ From: ${fromLoc.lat}, ${fromLoc.lon}
║ To: ${toLoc.lat}, ${toLoc.lon}
╠══════════════════════════════════════╣
║ 🔗 *Google Maps Route:*               ║
║ https://www.google.com/maps/dir/${fromLoc.lat},${fromLoc.lon}/${toLoc.lat},${toLoc.lon}
╚══════════════════════════════════════╝
        `;
        
        reply(result);
        
    } catch (err) {
        reply("❌ Error: " + err.message);
    }
});
