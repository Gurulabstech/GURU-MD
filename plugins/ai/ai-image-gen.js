// plugins/ai-image-gen.js
const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "imagine|imgai|genimg ?(.*)",
    desc: "Generate AI image from text prompt (Flux model)",
    category: "ai",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { reply, q, args }) => {
    try {
        if (!q) return reply("Please provide a prompt!\nExample: .imagine cyberpunk city at night, neon lights, rain");

        await reply("🎨 Generating image... (usually 15–40 seconds)");

        // Example using fal.ai Flux (you need FAL_API_KEY in config or env)
        const falApiKey = global.FAL_API_KEY || process.env.FAL_API_KEY;
        if (!falApiKey) return reply("Image generation not available - missing API key.");

        const response = await axios.post(
            "https://fal.run/fal-ai/flux-pro",
            {
                prompt: q,
                image_size: "landscape_16_9",
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1
            },
            {
                headers: {
                    Authorization: `Key ${falApiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 90000 // 90 seconds timeout
            }
        );

        const imageUrl = response.data.images?.[0]?.url;
        if (!imageUrl) return reply("Failed to generate image. Try a different prompt.");

        await conn.sendMessage(mek.key.remoteJid, {
            image: { url: imageUrl },
            caption: `🖼️ *Generated with Flux*\nPrompt: ${q}\n\n> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech`
        }, { quoted: mek });

    } catch (e) {
        console.error('[imagine]', e);
        await reply(`Error: ${e.message || "Image generation failed. Try again later."}`);
    }
});
