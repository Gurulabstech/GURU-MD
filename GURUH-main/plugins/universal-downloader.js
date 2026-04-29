const axios = require('axios');

module.exports = {
    pattern: 'dl|down|ss|social',
    desc: 'Universal downloader — Instagram, TikTok, Facebook, Twitter/X, YouTube shorts',
    category: 'download',
    react: '📥',

    async function(conn, mek, m, { from, q, reply: taggedReplyFn }) {
        if (!q || !q.startsWith('http')) {
            return taggedReplyFn('Send a valid social media link.\nExample: .dl https://www.instagram.com/reel/ABC123/');
        }

        try {
            taggedReplyFn('Fetching media... ⌛');

            // Using a reliable public API endpoint (you can replace with your own backend if needed)
            const api = `https://api.alyachan.dev/api/downloader/all?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(api);

            if (!data.status || !data.result?.media) {
                return taggedReplyFn('Could not fetch media from this link.');
            }

            const media = data.result.media[0];
            const caption = data.result.title || data.result.caption || 'Downloaded via GURU MD';

            if (media.type === 'video') {
                await conn.sendMessage(from, {
                    video: { url: media.url },
                    caption: caption,
                    mimetype: 'video/mp4'
                }, { quoted: mek });
            } else if (media.type === 'image') {
                await conn.sendMessage(from, {
                    image: { url: media.url },
                    caption: caption
                }, { quoted: mek });
            } else {
                taggedReplyFn('Unsupported media type.');
            }

        } catch (e) {
            taggedReplyFn('Download failed: ' + (e.response?.data?.msg || e.message || 'Unknown error'));
        }
    }
};
