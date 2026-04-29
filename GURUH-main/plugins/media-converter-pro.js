const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const axios = require('axios');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

module.exports = {
    name: "Media Converter Pro",
    alias: ["convert", "toaudio", "tomp3", "tomp4", "tojpg", "topng", "togif", "compress", "trim", "volume", "speed"],
    desc: "Advanced media conversion tools",
    category: "Tools",
    usage: ".convert <format> (reply to media)",
    react: "🔄",
    start: async (conn, m, { text, prefix, reply, quoted, args }) => {
        if (!text) return reply(`❌ Please specify conversion format!\n\n*Available:*\n▸ toaudio / tomp3\n▸ tomp4 / tovideo\n▸ tojpg / topng\n▸ togif\n▸ compress <size>\n▸ trim <start> <end>\n▸ volume <0.1-2.0>\n▸ speed <0.5-2.0>\n\nExample: ${prefix}toaudio (reply to video)`);

        if (!quoted) return reply('❌ Reply to media file!');
        
        const subCmd = args[0]?.toLowerCase();
        
        try {
            reply('🔄 Processing media...');
            
            // Download media
            let buffer;
            try {
                buffer = await quoted.download();
            } catch (e) {
                return reply('❌ Failed to download media');
            }
            
            const tempInput = path.join(os.tmpdir(), `input_${Date.now()}`);
            const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}`);
            
            fs.writeFileSync(tempInput, buffer);
            
            // Handle different conversions
            if (subCmd === 'toaudio' || subCmd === 'tomp3') {
                await convertToAudio(tempInput, tempOutput, reply);
                await sendAudio(conn, m, tempOutput, reply);
            }
            else if (subCmd === 'tomp4' || subCmd === 'tovideo') {
                await convertToVideo(tempInput, tempOutput, reply);
                await sendVideo(conn, m, tempOutput, reply);
            }
            else if (subCmd === 'tojpg' || subCmd === 'topng') {
                await convertToImage(tempInput, tempOutput, subCmd === 'topng', reply);
                await sendImage(conn, m, tempOutput, reply);
            }
            else if (subCmd === 'togif') {
                await convertToGif(tempInput, tempOutput, reply);
                await sendGif(conn, m, tempOutput, reply);
            }
            else if (subCmd === 'compress') {
                const targetSize = parseInt(args[1]) || 10;
                await compressMedia(tempInput, tempOutput, targetSize, reply);
                await sendCompressed(conn, m, tempOutput, reply);
            }
            else if (subCmd === 'trim') {
                const start = args[1] || '00:00:00';
                const end = args[2] || '00:00:10';
                await trimMedia(tempInput, tempOutput, start, end, reply);
                await sendTrimmed(conn, m, tempOutput, reply);
            }
            else if (subCmd === 'volume') {
                const volume = parseFloat(args[1]) || 1.0;
                await adjustVolume(tempInput, tempOutput, volume, reply);
                await sendAudio(conn, m, tempOutput, reply);
            }
            else if (subCmd === 'speed') {
                const speed = parseFloat(args[1]) || 1.0;
                await adjustSpeed(tempInput, tempOutput, speed, reply);
                await sendVideo(conn, m, tempOutput, reply);
            }
            else {
                reply('❌ Unknown conversion format!');
            }
            
            // Cleanup
            try {
                fs.unlinkSync(tempInput);
                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            } catch (e) {}
            
        } catch (error) {
            console.error('[Converter Error]:', error);
            reply(`❌ Conversion failed: ${error.message}`);
        }
    }
};

async function convertToAudio(input, output, reply) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .toFormat('mp3')
            .audioBitrate(128)
            .on('start', () => reply('🎵 Converting to audio...'))
            .on('end', resolve)
            .on('error', reject)
            .save(`${output}.mp3`);
    });
}

async function convertToVideo(input, output, reply) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .toFormat('mp4')
            .videoCodec('libx264')
            .audioCodec('aac')
            .on('start', () => reply('🎬 Converting to video...'))
            .on('end', resolve)
            .on('error', reject)
            .save(`${output}.mp4`);
    });
}

async function convertToImage(input, output, isPng, reply) {
    return new Promise((resolve, reject) => {
        const format = isPng ? 'png' : 'jpg';
        ffmpeg(input)
            .screenshots({
                timestamps: ['00:00:01'],
                filename: `output.${format}`,
                folder: path.dirname(output)
            })
            .on('start', () => reply(`🖼️ Extracting ${format.toUpperCase()}...`))
            .on('end', resolve)
            .on('error', reject);
    });
}

async function convertToGif(input, output, reply) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .toFormat('gif')
            .outputOptions(['-vf fps=10,scale=320:-1:flags=lanczos', '-loop 0'])
            .on('start', () => reply('🎨 Creating GIF...'))
            .on('end', resolve)
            .on('error', reject)
            .save(`${output}.gif`);
    });
}

async function compressMedia(input, output, targetSizeMB, reply) {
    return new Promise((resolve, reject) => {
        const targetSize = targetSizeMB * 1024;
        ffmpeg(input)
            .videoBitrate(`${targetSize}k`)
            .audioBitrate(64)
            .on('start', () => reply(`📦 Compressing (target: ${targetSizeMB}MB)...`))
            .on('end', resolve)
            .on('error', reject)
            .save(`${output}.mp4`);
    });
}

async function trimMedia(input, output, start, end, reply) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .setStartTime(start)
            .setDuration(end)
            .on('start', () => reply(`✂️ Trimming from ${start} to ${end}...`))
            .on('end', resolve)
            .on('error', reject)
            .save(`${output}.mp4`);
    });
}

async function adjustVolume(input, output, volume, reply) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .audioFilter(`volume=${volume}`)
            .on('start', () => reply(`🔊 Adjusting volume to ${volume}x...`))
            .on('end', resolve)
            .on('error', reject)
            .save(`${output}.mp3`);
    });
}

async function adjustSpeed(input, output, speed, reply) {
    return new Promise((resolve, reject) => {
        const videoFilter = `setpts=${1/speed}*PTS`;
        const audioFilter = `atempo=${Math.min(speed, 2.0)}`;
        
        ffmpeg(input)
            .videoFilter(videoFilter)
            .audioFilter(audioFilter)
            .on('start', () => reply(`⚡ Adjusting speed to ${speed}x...`))
            .on('end', resolve)
            .on('error', reject)
            .save(`${output}.mp4`);
    });
}

async function sendAudio(conn, m, output, reply) {
    const file = `${output}.mp3`;
    if (fs.existsSync(file)) {
        await conn.sendMessage(m.from, {
            audio: fs.readFileSync(file),
            mimetype: 'audio/mpeg'
        }, { quoted: m });
        reply('✅ Audio conversion complete!');
    }
}

async function sendVideo(conn, m, output, reply) {
    const file = `${output}.mp4`;
    if (fs.existsSync(file)) {
        await conn.sendMessage(m.from, {
            video: fs.readFileSync(file),
            caption: '✅ Video conversion complete!\n\nᴳᵁᴿᵁᴹᴰ',
            mimetype: 'video/mp4'
        }, { quoted: m });
    }
}

async function sendImage(conn, m, output, reply) {
    const fileJpg = `${output}.jpg`;
    const filePng = `${output}.png`;
    let file = fs.existsSync(fileJpg) ? fileJpg : filePng;
    
    if (fs.existsSync(file)) {
        await conn.sendMessage(m.from, {
            image: fs.readFileSync(file),
            caption: '✅ Image extracted!\n\nᴳᵁᴿᵁᴹᴰ',
            mimetype: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
        }, { quoted: m });
    }
}

async function sendGif(conn, m, output, reply) {
    const file = `${output}.gif`;
    if (fs.existsSync(file)) {
        await conn.sendMessage(m.from, {
            video: fs.readFileSync(file),
            caption: '✅ GIF created!\n\nᴳᵁᴿᵁᴹᴰ',
            gifPlayback: true
        }, { quoted: m });
    }
}

async function sendCompressed(conn, m, output, reply) {
    const file = `${output}.mp4`;
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const sizeMB = stats.size / (1024 * 1024);
        
        await conn.sendMessage(m.from, {
            video: fs.readFileSync(file),
            caption: `📦 *Compressed Video*\n\nSize: ${sizeMB.toFixed(2)}MB\n\nᴳᵁᴿᵁᴹᴰ`,
            mimetype: 'video/mp4'
        }, { quoted: m });
    }
}

async function sendTrimmed(conn, m, output, reply) {
    const file = `${output}.mp4`;
    if (fs.existsSync(file)) {
        await conn.sendMessage(m.from, {
            video: fs.readFileSync(file),
            caption: '✂️ *Trimmed Video*\n\nᴳᵁᴿᵁᴹᴰ',
            mimetype: 'video/mp4'
        }, { quoted: m });
    }
}
