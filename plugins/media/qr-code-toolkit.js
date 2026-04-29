// plugins/qr-toolkit.js
// Self-registering QR Code generator & scanner — no index.js changes needed

const QRCode = require('qrcode');
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
    console.log('[QR Toolkit] Activated — ready to generate & scan QR codes');

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const mek = messages[0];
        if (!mek?.message) return;

        const from = mek.key.remoteJid;
        const body = (
            mek.message.conversation ||
            mek.message.extendedTextMessage?.text ||
            ""
        ).trim().toLowerCase();

        // Supported commands
        const commands = ['.qr', '.qrcode', '.makeqr', '.readqr', '.qrread', '.scan'];
        const usedCmd = commands.find(cmd => body.startsWith(cmd));
        if (!usedCmd) return;

        const text = body.slice(usedCmd.length).trim();
        const cmd = usedCmd.replace('.', '');

        // Quick reply helper
        const reply = async (msg) => {
            await conn.sendMessage(from, { text: msg }, { quoted: mek });
        };

        // ─────────────── Read QR Code (scan) ───────────────
        if (cmd === 'readqr' || cmd === 'qrread' || cmd === 'scan') {
            const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted || !quoted.imageMessage) {
                return reply('❌ Reply to an image containing a QR code!');
            }

            try {
                await reply('🔍 Scanning QR code...');

                // Download image
                const buffer = await conn.downloadMediaMessage(quoted);

                // Read QR using jsQR
                const { default: jsQR } = await import('jsqr'); // dynamic import for jsQR
                const image = await Jimp.read(buffer);
                const qrData = jsQR(
                    new Uint8ClampedArray(image.bitmap.data),
                    image.bitmap.width,
                    image.bitmap.height
                );

                if (qrData && qrData.data) {
                    const decoded = qrData.data;
                    const isUrl = /^https?:\/\//i.test(decoded);

                    let caption = `*✅ QR Code Scanned Successfully*\n\n*Content:*\n${decoded}`;

                    if (isUrl) {
                        caption += `\n\n🔗 This is a link — you can open it directly`;
                    }

                    caption += `\n\nᴳᵁᴿᵁᴹᴰ QR Scanner`;

                    await conn.sendMessage(from, { text: caption }, { quoted: mek });
                } else {
                    await reply('❌ No QR code detected in the image!');
                }
            } catch (error) {
                console.error('[QR Scan Error]:', error);
                await reply(`❌ Scanning failed: ${error.message || 'Unknown error'}`);
            }
            return;
        }

        // ─────────────── Generate QR Code ───────────────
        if (!text) {
            return reply(`❌ Please provide text or URL!\n\nExamples:\n` +
                `${usedCmd} Hello World\n` +
                `${usedCmd} https://github.com/itsguruu\n` +
                `${usedCmd} wa.me/254712345678`);
        }

        try {
            await reply('📱 Generating QR code...');

            // QR options
            const options = {
                errorCorrectionLevel: 'H',
                margin: 2,
                scale: 10,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            };

            // Generate QR as buffer
            const qrBuffer = await QRCode.toBuffer(text, options);

            // Temp file path
            const tempPath = path.join(os.tmpdir(), `qr_${Date.now()}.png`);
            fs.writeFileSync(tempPath, qrBuffer);

            // Optional: Fancy QR with logo if it's a link
            let finalImagePath = tempPath;
            if (text.includes('http') || text.includes('github') || text.includes('wa.me')) {
                try {
                    const image = await Jimp.read(tempPath);
                    const logo = await Jimp.read('https://files.catbox.moe/ntfw9h.jpg'); // your logo
                    logo.resize(60, 60);

                    const x = (image.bitmap.width - logo.bitmap.width) / 2;
                    const y = (image.bitmap.height - logo.bitmap.height) / 2;

                    image.composite(logo, x, y, {
                        mode: Jimp.BLEND_SOURCE_OVER,
                        opacitySource: 0.85,
                        opacityDest: 1
                    });

                    await image.writeAsync(tempPath);
                } catch (logoErr) {
                    console.warn('[QR Logo] Failed to add logo:', logoErr.message);
                }
            }

            const caption = `*📱 QR Code Generated*\n\n*Content:* ${text.length > 100 ? text.substring(0, 100) + '...' : text}\n*Scan to open*\n\nᴳᵁᴿᵁᴹᴰ QR Toolkit`;

            await conn.sendMessage(from, {
                image: { url: finalImagePath },
                caption: caption,
                mimetype: 'image/png'
            }, { quoted: mek });

            // Cleanup
            fs.unlink(tempPath, (err) => {
                if (err) console.error('[QR Cleanup] Failed:', err.message);
            });

        } catch (error) {
            console.error('[QR Generate Error]:', error);
            await reply(`❌ QR generation failed: ${error.message || 'Unknown error'}`);
        }
    });
});

module.exports = {};
