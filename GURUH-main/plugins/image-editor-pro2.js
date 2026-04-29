// plugins/image-editor-pro.js
// Self-registering — no changes needed in index.js

const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper: Wait until global.conn is available
const waitForConn = (callback) => {
    if (global.conn) return callback(global.conn);
    const interval = setInterval(() => {
        if (global.conn) {
            clearInterval(interval);
            callback(global.conn);
        }
    }, 1000); // Check every second
};

waitForConn((conn) => {
    console.log('[ImageEditorPro] Activated — ready to edit images');

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const mek = messages[0];
        if (!mek?.message) return;

        const from = mek.key.remoteJid;
        const body = (
            mek.message.conversation ||
            mek.message.extendedTextMessage?.text ||
            mek.message.imageMessage?.caption ||
            ""
        ).trim();

        // Check if message starts with any alias
        const aliases = ['.edit', '.editimg', '.filter', '.enhance', '.blur', '.bright', '.contrast', '.greyscale', '.sepia', '.invert', '.mirror', '.flip', '.circle', '.pixelate', '.rotate', '.resize'];
        const prefixUsed = aliases.some(alias => body.toLowerCase().startsWith(alias));
        if (!prefixUsed) return;

        // Extract command and args
        const text = body.split(' ').slice(1).join(' ');
        const cmd = body.split(' ')[0].toLowerCase().replace('.', '');
        const prefix = body.split(' ')[0].charAt(0); // usually .

        // Reply function (using bot's reply style)
        const reply = async (msg) => {
            await conn.sendMessage(from, { text: msg }, { quoted: mek });
        };

        // Check if replied to an image
        const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || (!quoted.imageMessage && !quoted.viewOnceMessage?.message?.imageMessage)) {
            return reply('❌ Please reply to an image with your edit command!');
        }

        try {
            await reply('🎨 Processing image... Please wait');

            // Download the quoted image
            const buffer = await conn.downloadMediaMessage(quoted);

            // Load image with Jimp
            let image = await Jimp.read(buffer);

            // Parse filter and parameters
            const args = text.toLowerCase().split(' ');
            const filter = args[0] || cmd; // fallback to command if no extra arg

            switch (filter) {
                case 'blur':
                    const blurLevel = parseInt(args[1]) || 5;
                    if (blurLevel < 1 || blurLevel > 50) return reply('Blur level must be between 1–50');
                    image.blur(blurLevel);
                    break;

                case 'greyscale':
                case 'bw':
                    image.greyscale();
                    break;

                case 'sepia':
                    image.sepia();
                    break;

                case 'invert':
                    image.invert();
                    break;

                case 'mirror':
                case 'flip':
                    image.flip(true, false); // horizontal mirror
                    break;

                case 'circle':
                case 'round':
                    image = await makeCircle(image);
                    break;

                case 'pixelate':
                    const pixelSize = parseInt(args[1]) || 8;
                    if (pixelSize < 2 || pixelSize > 50) return reply('Pixelate size must be 2–50');
                    image.pixelate(pixelSize);
                    break;

                case 'bright':
                case 'brightness':
                    let brightVal = parseInt(args[1]) || 50;
                    brightVal = Math.max(0, Math.min(200, brightVal));
                    image.brightness((brightVal - 100) / 100);
                    break;

                case 'contrast':
                    let contrastVal = parseInt(args[1]) || 50;
                    contrastVal = Math.max(0, Math.min(200, contrastVal));
                    image.contrast((contrastVal - 100) / 100);
                    break;

                case 'rotate':
                    const degrees = parseFloat(args[1]) || 90;
                    image.rotate(degrees);
                    break;

                case 'resize':
                    const width = parseInt(args[1]);
                    const height = parseInt(args[2]) || width;
                    if (!width || width < 10) return reply('Usage: .edit resize <width> [height]');
                    image.resize(width, height);
                    break;

                default:
                    return reply(`❌ Unknown filter: *${filter}*\n\n*Available:* blur, greyscale, sepia, invert, mirror, circle, pixelate, bright, contrast, rotate, resize\n\nExample: ${prefix}edit blur 10`);
            }

            // Temp file path
            const tempPath = path.join(os.tmpdir(), `edited_${Date.now()}.png`);
            await image.writeAsync(tempPath);

            // Send edited image
            await conn.sendMessage(from, {
                image: { url: tempPath },
                caption: `✨ *Filter applied:* ${filter.toUpperCase()}\n\nᴳᵁᴿᵁᴹᴰ Image Editor Pro`,
                mimetype: 'image/png'
            }, { quoted: mek });

            // Clean up
            fs.unlink(tempPath, (err) => {
                if (err) console.error('[ImageEditor] Cleanup failed:', err.message);
            });

        } catch (error) {
            console.error('[ImageEditor Error]:', error.stack || error);
            await reply(`❌ Editing failed: ${error.message || 'Unknown error occurred'}`);
        }
    });
});

// Helper: Create circular mask
async function makeCircle(image) {
    const size = Math.min(image.bitmap.width, image.bitmap.height);
    const mask = new Jimp(size, size, 0x00000000);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const dx = x - centerX;
            const dy = y - centerY;
            if (dx * dx + dy * dy <= radius * radius) {
                mask.setPixelColor(0xFFFFFFFF, x, y);
            }
        }
    }

    image.resize(size, size);
    image.mask(mask, 0, 0);
    return image;
}

module.exports = {};
