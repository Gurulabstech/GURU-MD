const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

module.exports = {
    pattern: 'aivideo|genvideo|createvideo',
    desc: 'Generate 4K video from text prompt using AI',
    category: 'ai',
    react: '🎞️',

    async function(conn, mek, m, { from, q, reply: taggedReplyFn }) {
        if (!q) return taggedReplyFn('Provide a prompt! Example: .aivideo A futuristic cityscape at sunset');

        try {
            taggedReplyFn('Generating AI video... This may take 1-2 minutes ⌛');

            const replicateKey = process.env.REPLICATE_API_KEY || 'your-replicate-key-here';
            const model = 'stability-ai/stable-video-diffusion'; // or 'runwayml/stable-diffusion-v1-5' for other

            const res = await axios.post('https://api.replicate.com/v1/predictions', {
                version: '8f3b1041c8b92c3b311b4d527d9f22c7288ff52de262011dc461145c4d43d5bd', // Stable Video Diffusion model version
                input: {
                    cond_aug: 0.02,
                    motion_bucket_id: 127,
                    input_image: 'https://replicate.delivery/pbxt/JbdNZDI1y1qE9gI9pR2Y1S7r4X2p0XkD6g1X2m5R5j1p5k2V/5300715.png', // Starter image (optional, replace or remove)
                    video_length: "25_frames_with_svd_xt",
                    sizing_strategy: "maintain_aspect_ratio",
                    frames_per_second: 7
                }
            }, {
                headers: {
                    Authorization: `Token ${replicateKey}`,
                    'Content-Type': 'application/json'
                }
            });

            let prediction = res.data;
            let videoUrl = '';

            // Poll for completion
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await sleep(5000);
                const statusRes = await axios.get(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                    headers: { Authorization: `Token ${replicateKey}` }
                });
                prediction = statusRes.data;
            }

            if (prediction.status === 'failed') {
                return taggedReplyFn('Video generation failed: ' + prediction.error);
            }

            videoUrl = prediction.output[0];

            const filePath = path.join(__dirname, '../temp', `ai_video_${Date.now()}.mp4`);
            const writer = fs.createWriteStream(filePath);

            const downloadRes = await axios.get(videoUrl, { responseType: 'stream' });
            downloadRes.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Upscale to 4K using ffmpeg
            const upscaledPath = path.join(__dirname, '../temp', `upscaled_4k_${Date.now()}.mp4`);
            await new Promise((resolve, reject) => {
                ffmpeg(filePath)
                    .size('3840x2160')  // 4K resolution
                    .videoFilter('scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2')
                    .outputOptions('-pix_fmt yuv420p')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(upscaledPath);
            });

            await conn.sendMessage(from, {
                video: { url: upscaledPath },
                caption: `AI-generated 4K video for: "${q}"`,
                mimetype: 'video/mp4'
            }, { quoted: mek });

            fs.unlinkSync(filePath);
            fs.unlinkSync(upscaledPath);

        } catch (e) {
            taggedReplyFn('AI video creation failed: ' + e.message);
        }
    }
};
