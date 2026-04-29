const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

module.exports = {
    name: "Sticker Maker Pro",
    alias: ["sticker", "s", "stickers", "stickerpro", "stickerwm", "take", "toimg", "tovid", "gif", "smeme"],
    desc: "Advanced sticker maker with many features",
    category: "Sticker",
    usage: ".sticker (reply to image/video/gif)",
    react: "🩹",
    start: async (conn, m, { text, prefix, reply, quoted, args }) => {
        // Check for subcommands
        const subCmd = args[0]?.toLowerCase();
        
        if (subCmd === 'toimg' || subCmd === 'toimage') {
            await convertStickerToImage(conn, m, quoted, reply);
            return;
        }
        
        if (subCmd === 'tovid' || subCmd === 'tovideo') {
            await convertStickerToVideo(conn, m, quoted, reply);
            return;
        }
        
        if (subCmd === 'take' || subCmd === 'wm') {
            await takeSticker(conn, m, text, quoted, reply, prefix);
            return;
        }
        
        if (subCmd === 'smeme') {
            await stickerMeme(conn, m, text, quoted, reply);
            return;
        }
        
        // Default sticker creation
        await createSticker(conn, m, text, quoted, reply);
    }
};

async function createSticker(conn, m, text, quoted, reply) {
    try {
        // Check if replying to media
        if (!quoted) return reply('❌ Reply to an image/video/gif!');
        
        let mediaMsg = quoted.message?.imageMessage || 
                      quoted.message?.videoMessage ||
                      quoted.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
                      quoted.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
        
        if (!mediaMsg) return reply('❌ Reply to image/video/gif only!');
        
        reply('⏳ Creating sticker...');
        
        // Download media
        let buffer;
        try {
            buffer = await quoted.download();
        } catch (e) {
            buffer = await downloadMediaFromMessage(quoted);
        }
        
        if (!buffer) return reply('❌ Failed to download media');
        
        // Parse sticker options
        let packname = 'GURU MD';
        let author = 'Powered by GuruTech';
        let type = StickerTypes.FULL;
        let quality = 70;
        
        if (text) {
            const args = text.split('|');
            if (args[0]) packname = args[0].trim();
            if (args[1]) author = args[1].trim();
            if (args[2]?.includes('circle')) type = StickerTypes.CIRCLE;
            if (args[2]?.includes('round')) type = StickerTypes.CIRCLE;
            if (args[2]?.includes('crop')) type = StickerTypes.CROPPED;
            if (args[2]?.includes('stretched')) type = StickerTypes.STRETCHED;
        }
        
        // Create sticker
        const sticker = new Sticker(buffer, {
            pack: packname,
            author: author,
            type: type,
            quality: quality,
            background: '#00000000'
        });
        
        const stickerBuffer = await sticker.toBuffer();
        
        await conn.sendMessage(m.from, {
            sticker: stickerBuffer,
            mimetype: 'image/webp'
        }, { quoted: m });
        
    } catch (error) {
        console.error('[Sticker Error]:', error);
        reply(`❌ Sticker creation failed: ${error.message}`);
    }
}

async function convertStickerToImage(conn, m, quoted, reply) {
    try {
        if (!quoted) return reply('❌ Reply to a sticker!');
        
        let stickerMsg = quoted.message?.stickerMessage;
        if (!stickerMsg) return reply('❌ Reply to a sticker!');
        
        reply('🔄 Converting sticker to image...');
        
        const buffer = await quoted.download();
        
        // Save as PNG
        const tempPath = path.join(os.tmpdir(), `sticker_${Date.now()}.png`);
        fs.writeFileSync(tempPath, buffer);
        
        await conn.sendMessage(m.from, {
            image: fs.readFileSync(tempPath),
            caption: '🖼️ *Sticker converted to image*\n\nᴳᵁᴿᵁᴹᴰ',
            mimetype: 'image/png'
        }, { quoted: m });
        
        fs.unlinkSync(tempPath);
        
    } catch (error) {
        reply(`❌ Conversion failed: ${error.message}`);
    }
}

async function convertStickerToVideo(conn, m, quoted, reply) {
    try {
        if (!quoted) return reply('❌ Reply to an animated sticker!');
        
        let stickerMsg = quoted.message?.stickerMessage;
        if (!stickerMsg) return reply('❌ Reply to a sticker!');
        
        if (!stickerMsg.isAnimated) {
            return reply('❌ Sticker is not animated!');
        }
        
        reply('🔄 Converting sticker to video...');
        
        const buffer = await quoted.download();
        
        const tempGif = path.join(os.tmpdir(), `sticker_${Date.now()}.gif`);
        const tempMp4 = path.join(os.tmpdir(), `sticker_${Date.now()}.mp4`);
        
        fs.writeFileSync(tempGif, buffer);
        
        // Convert to video using ffmpeg
        const ffmpeg = require('fluent-ffmpeg');
        await new Promise((resolve, reject) => {
            ffmpeg(tempGif)
                .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'])
                .on('end', resolve)
                .on('error', reject)
                .save(tempMp4);
        });
        
        await conn.sendMessage(m.from, {
            video: fs.readFileSync(tempMp4),
            caption: '🎬 *Sticker converted to video*\n\nᴳᵁᴿᵁᴹᴰ',
            gifPlayback: true
        }, { quoted: m });
        
        fs.unlinkSync(tempGif);
        fs.unlinkSync(tempMp4);
        
    } catch (error) {
        reply(`❌ Conversion failed: ${error.message}`);
    }
}

async function takeSticker(conn, m, text, quoted, reply, prefix) {
    try {
        if (!quoted) return reply('❌ Reply to a sticker!');
        
        let stickerMsg = quoted.message?.stickerMessage;
        if (!stickerMsg) return reply('❌ Reply to a sticker!');
        
        const args = text.split(' ');
        args.shift(); // Remove 'take'
        let packname = 'GURU MD';
        let author = 'Powered by GuruTech';
        
        if (args[0]) packname = args[0];
        if (args[1]) author = args[1];
        
        reply(`🔄 Taking sticker with pack: ${packname}`);
        
        const buffer = await quoted.download();
        
        const sticker = new Sticker(buffer, {
            pack: packname,
            author: author,
            quality: 80
        });
        
        const stickerBuffer = await sticker.toBuffer();
        
        await conn.sendMessage(m.from, {
            sticker: stickerBuffer,
            mimetype: 'image/webp'
        }, { quoted: m });
        
    } catch (error) {
        reply(`❌ Failed: ${error.message}`);
    }
}

async function stickerMeme(conn, m, text, quoted, reply) {
    try {
        if (!quoted) return reply('❌ Reply to an image!');
        
        let imageMsg = quoted.message?.imageMessage;
        if (!imageMsg) return reply('❌ Reply to an image!');
        
        const args = text.split(' ');
        args.shift(); // Remove 'smeme'
        const memeText = args.join(' ');
        
        if (!memeText) return reply('❌ Provide text for the meme!\n\nExample: .smeme Hello World');
        
        reply('🎭 Creating meme sticker...');
        
        // Download image
        const buffer = await quoted.download();
        const image = await Jimp.read(buffer);
        
        // Add text to image
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
        
        // Create border
        const borderSize = 20;
        new Jimp(image.bitmap.width + borderSize * 2, image.bitmap.height + borderSize * 2, 0x000000FF, (err, bordered) => {
            bordered.blit(image, borderSize, borderSize);
            
            // Add text at bottom
            bordered.print(
                font,
                borderSize,
                bordered.bitmap.height - 60,
                {
                    text: memeText,
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                },
                bordered.bitmap.width - borderSize * 2,
                50
            );
            
            return bordered;
        });
        
        // Save and create sticker
        const tempPath = path.join(os.tmpdir(), `meme_${Date.now()}.png`);
        await image.writeAsync(tempPath);
        
        const sticker = new Sticker(fs.readFileSync(tempPath), {
            pack: 'GURU MD Meme',
            author: 'Powered by GuruTech',
            quality: 80
        });
        
        const stickerBuffer = await sticker.toBuffer();
        
        await conn.sendMessage(m.from, {
            sticker: stickerBuffer,
            mimetype: 'image/webp'
        }, { quoted: m });
        
        fs.unlinkSync(tempPath);
        
    } catch (error) {
        reply(`❌ Meme sticker failed: ${error.message}`);
    }
}

async function downloadMediaFromMessage(message) {
    try {
        const stream = await message.download();
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        return null;
    }
}
