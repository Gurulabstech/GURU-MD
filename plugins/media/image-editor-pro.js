const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

module.exports = {
    pattern: 'editimg|img|enhance|filter',
    desc: 'Advanced image editor: resize, grayscale, sharpen, blur, sticker, circle crop',
    category: 'editing',
    react: '🖼️',

    async function(conn, mek, m, { from, quoted, q, reply: taggedReplyFn }) {
        if (!quoted?.message?.imageMessage) {
            return taggedReplyFn('Reply to an image with .editimg <options>\nExamples:\n.editimg resize 500\n.editimg gray\n.editimg sticker\n.editimg circle\n.editimg sharpen 2');
        }

        try {
            const buffer = await m.quoted.download();
            let img = sharp(buffer);
            const cmd = (q || '').toLowerCase();

            if (cmd.includes('resize')) {
                const size = parseInt(cmd.match(/\d+/)?.[0] || 512);
                img = img.resize(size, size, { fit: 'inside', withoutEnlargement: true });
            }

            if (cmd.includes('gray') || cmd.includes('grayscale')) img = img.grayscale();

            if (cmd.includes('sharpen')) {
                const sigma = parseFloat(cmd.match(/sharpen\s+(\d+\.?\d*)/)?.[1] || 1);
                img = img.sharpen({ sigma });
            }

            if (cmd.includes('blur')) {
                const sigma = parseFloat(cmd.match(/blur\s+(\d+\.?\d*)/)?.[1] || 3);
                img = img.blur(sigma);
            }

            if (cmd.includes('circle') || cmd.includes('round')) {
                const { width, height } = await img.metadata();
                const radius = Math.min(width, height) / 2;
                img = img.composite([{
                    input: Buffer.from(`<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`),
                    blend: 'dest-in'
                }]);
            }

            if (cmd.includes('sticker')) {
                img = img.resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
            }

            const outPath = path.join(__dirname, '../temp', `edited_${Date.now()}.${cmd.includes('sticker') ? 'webp' : 'jpg'}`);
            await img.toFile(outPath);

            const sendType = cmd.includes('sticker') ? 'sticker' : 'image';

            await conn.sendMessage(from, {
                [sendType]: { url: outPath },
                mimetype: sendType === 'sticker' ? 'image/webp' : 'image/jpeg',
                caption: cmd.includes('sticker') ? '' : 'Edited with GURU MD'
            }, { quoted: mek });

            fs.unlinkSync(outPath);

        } catch (e) {
            taggedReplyFn('Image editing failed: ' + (e.message || 'Unknown error'));
        }
    }
};
