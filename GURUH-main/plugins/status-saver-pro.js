const fs = require('fs');
const path = require('path');

module.exports = {
    pattern: 'statussave|savestatus',
    desc: 'Manually save viewed status (image/video) to folder',
    category: 'status',
    react: '💾',

    async function(conn, mek, m, { from, quoted, reply: taggedReplyFn }) {
        if (!quoted?.message) return taggedReplyFn('Reply to a status message (image or video) with .savestatus');

        try {
            const type = Object.keys(quoted.message)[0];
            if (!['imageMessage', 'videoMessage'].includes(type)) {
                return taggedReplyFn('Reply to an image or video status only.');
            }

            const buffer = await conn.downloadMediaMessage(quoted);
            const ext = type === 'imageMessage' ? '.jpg' : '.mp4';
            const savePath = path.join(__dirname, '../statuses', `saved_\( {Date.now()} \){ext}`);

            if (!fs.existsSync(path.dirname(savePath))) {
                fs.mkdirSync(path.dirname(savePath), { recursive: true });
            }

            fs.writeFileSync(savePath, buffer);

            taggedReplyFn(`Status saved successfully!\nLocation: ${savePath}`);

        } catch (e) {
            taggedReplyFn('Failed to save status: ' + e.message);
        }
    }
};
