const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    pattern: 'trailer|movie-trailer',
    desc: 'Download movie trailer from YouTube (search by movie name)',
    category: 'download',
    react: '🎥',

    async function(conn, mek, m, { from, q, reply: taggedReplyFn }) {
        if (!q) return taggedReplyFn('Provide a movie name! Example: .trailer Inception');

        try {
            // Optional: Use TMDB API for official trailer link (add TMDB key to config)
            const tmdbKey = process.env.TMDB_API_KEY || 'your-tmdb-key-here';
            const movieSearch = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=\( {tmdbKey}&query= \){encodeURIComponent(q)}`);
            const movieId = movieSearch.data.results[0]?.id;
            let trailerUrl = '';

            if (movieId) {
                const trailerRes = await axios.get(`https://api.themoviedb.org/3/movie/\( {movieId}/videos?api_key= \){tmdbKey}`);
                const trailerKey = trailerRes.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key;
                if (trailerKey) trailerUrl = `https://youtu.be/${trailerKey}`;
            }

            // Fallback to YouTube search if no TMDB trailer
            if (!trailerUrl) {
                const search = await ytSearch(`${q} official trailer`);
                if (!search.videos.length) return taggedReplyFn('No trailer found.');
                trailerUrl = search.videos[0].url;
            }

            taggedReplyFn(`Found trailer: ${trailerUrl}\nDownloading...`);

            const info = await ytdl.getInfo(trailerUrl);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

            const filePath = path.join(__dirname, '../temp', `${title}.mp4`);

            const stream = ytdl(trailerUrl, { filter: 'audioandvideo', quality: 'highestvideo' });

            stream.pipe(fs.createWriteStream(filePath))
                .on('finish', async () => {
                    await conn.sendMessage(from, {
                        video: { url: filePath },
                        caption: `Trailer for "${q}" downloaded`,
                        mimetype: 'video/mp4'
                    }, { quoted: mek });

                    fs.unlinkSync(filePath);
                })
                .on('error', (err) => taggedReplyFn('Download error: ' + err.message));

        } catch (e) {
            taggedReplyFn('Failed to find/download trailer: ' + e.message);
        }
    }
};
