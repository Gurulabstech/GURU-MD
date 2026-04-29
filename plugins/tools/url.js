const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const config = require('../config');

// ========== FILE UPLOAD SERVICES WITH IMPROVED ERROR HANDLING ==========

async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('fileToUpload', fs.createReadStream(filePath));
        form.append('reqtype', 'fileupload');
        
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 30000 // 30 second timeout
        });
        
        const url = response.data.trim();
        if (url && url.startsWith('https://')) {
            return url;
        }
        throw new Error('Invalid response from Catbox');
    } catch (e) {
        console.error('[Catbox Error]:', e.message);
        throw new Error(`Catbox upload failed: ${e.message}`);
    }
}

async function uploadToTmpFiles(filePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        
        const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        
        if (response.data && response.data.data && response.data.data.url) {
            // Convert to direct download URL
            const directUrl = response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            return directUrl;
        }
        throw new Error('Invalid response from TmpFiles');
    } catch (e) {
        console.error('[TmpFiles Error]:', e.message);
        throw new Error(`TmpFiles upload failed: ${e.message}`);
    }
}

async function uploadToFileIo(filePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('expires', '1d'); // 1 day expiry
        
        const response = await axios.post('https://file.io', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        
        if (response.data && response.data.success && response.data.link) {
            return response.data.link;
        }
        throw new Error('Invalid response from File.io');
    } catch (e) {
        console.error('[File.io Error]:', e.message);
        throw new Error(`File.io upload failed: ${e.message}`);
    }
}

// ========== MAIN UPLOAD FUNCTION WITH FALLBACKS ==========

async function uploadFileToUrl(filePath, fileName) {
    const services = [
        { name: 'Catbox', func: uploadToCatbox },
        { name: 'TmpFiles', func: uploadToTmpFiles },
        { name: 'File.io', func: uploadToFileIo }
    ];
    
    let lastError = '';
    const errors = [];
    
    for (const service of services) {
        try {
            console.log(`[Upload] Trying ${service.name}...`);
            const url = await service.func(filePath);
            if (url) {
                console.log(`[Upload] ✓ ${service.name} success:`, url.substring(0, 50) + '...');
                return { success: true, url, service: service.name };
            }
        } catch (error) {
            lastError = error.message;
            errors.push(`${service.name}: ${error.message}`);
            console.log(`[Upload] ✗ ${service.name} failed:`, error.message);
            continue;
        }
    }
    
    return { 
        success: false, 
        error: lastError,
        details: errors.join('\n')
    };
}

// ========== MEDIA DETECTION HELPER ==========

function getQuotedMessage(m) {
    try {
        if (!m.message) return null;
        
        // Check for extended text message with context info
        if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            return m.message.extendedTextMessage.contextInfo.quotedMessage;
        }
        
        // Check for other message types with context info
        const messageTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
        for (const type of messageTypes) {
            if (m.message[type]?.contextInfo?.quotedMessage) {
                return m.message[type].contextInfo.quotedMessage;
            }
        }
        
        return null;
    } catch (e) {
        console.error('[getQuotedMessage] Error:', e);
        return null;
    }
}

function getMessageType(message) {
    if (!message) return 'unknown';
    
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    if (message.conversation) return 'text';
    if (message.extendedTextMessage) return 'text';
    
    return 'unknown';
}

function getFileName(messageType, m) {
    const timestamp = Date.now();
    
    switch(messageType) {
        case 'image':
            return `GURU_IMAGE_${timestamp}.jpg`;
        case 'video':
            return `GURU_VIDEO_${timestamp}.mp4`;
        case 'audio':
            return `GURU_AUDIO_${timestamp}.mp3`;
        case 'document':
            // Try to get original filename
            if (m.message?.documentMessage?.fileName) {
                return m.message.documentMessage.fileName;
            }
            return `GURU_DOC_${timestamp}.bin`;
        case 'sticker':
            return `GURU_STICKER_${timestamp}.webp`;
        default:
            return `GURU_FILE_${timestamp}.bin`;
    }
}

// ========== URL SHORTENER ==========

async function shortenUrl(url) {
    try {
        // Try multiple URL shorteners for reliability
        const services = [
            async () => {
                const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 10000 });
                return response.data;
            },
            async () => {
                const response = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 10000 });
                return response.data;
            }
        ];
        
        for (const service of services) {
            try {
                const result = await service();
                if (result && !result.includes('Error')) {
                    return { success: true, url: result };
                }
            } catch (e) {
                continue;
            }
        }
        
        return { success: false, url };
    } catch (e) {
        return { success: false, url };
    }
}

// ========== WAIT FOR USER RESPONSE ==========

async function waitForResponse(conn, from, timeout = 30000) {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            conn.ev.off('messages.upsert', listener);
            resolve('timeout');
        }, timeout);
        
        const listener = (msg) => {
            const message = msg.messages[0];
            if (message.key && message.key.remoteJid === from && !message.key.fromMe) {
                const choice = message.message?.conversation || 
                              message.message?.extendedTextMessage?.text || '';
                if (['1', '2', '3'].includes(choice)) {
                    clearTimeout(timeoutId);
                    conn.ev.off('messages.upsert', listener);
                    resolve(choice);
                }
            }
        };
        
        conn.ev.on('messages.upsert', listener);
    });
}

// ========== MAIN COMMAND ==========

cmd({
    pattern: "url",
    alias: ["shorten", "tinyurl", "link", "upload", "share"],
    desc: "Convert anything (text, images, videos, files) to URL",
    category: "utility",
    use: ".url <text> or reply to media",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isReply, sender }) => {
    try {
        // Check if replying to a message
        if (isReply) {
            const quotedMsg = getQuotedMessage(m);
            
            if (quotedMsg) {
                const messageType = getMessageType(quotedMsg);
                console.log(`[URL] Detected reply type: ${messageType}`);
                
                // Handle media files
                if (['image', 'video', 'audio', 'document', 'sticker'].includes(messageType)) {
                    // Send processing message
                    const processingMsg = await reply(`📤 *Converting ${messageType} to URL...*\n_Please wait, this may take a moment._`);
                    
                    try {
                        // Get the original message key
                        const quotedKey = {
                            remoteJid: from,
                            id: m.message?.extendedTextMessage?.contextInfo?.stanzaId,
                            participant: m.message?.extendedTextMessage?.contextInfo?.participant
                        };
                        
                        if (!quotedKey.id) {
                            return reply("❌ Could not find the quoted message. Please try again.");
                        }
                        
                        // Download the media using the correct method
                        const mediaBuffer = await conn.downloadMediaMessage({
                            key: quotedKey,
                            message: quotedMsg
                        });
                        
                        if (!mediaBuffer) {
                            return reply("❌ Failed to download media. The file might be too large or corrupted.");
                        }
                        
                        // Generate filename
                        const fileName = getFileName(messageType, { message: quotedMsg });
                        
                        // Save to temp directory (use /tmp for all environments)
                        const tempDir = '/tmp/guru-uploads';
                        if (!fs.existsSync(tempDir)) {
                            fs.mkdirSync(tempDir, { recursive: true });
                        }
                        
                        const tempPath = path.join(tempDir, fileName);
                        fs.writeFileSync(tempPath, mediaBuffer);
                        
                        // Get file size
                        const fileSizeKB = (mediaBuffer.length / 1024).toFixed(2);
                        
                        // Upload to URL
                        const uploadResult = await uploadFileToUrl(tempPath, fileName);
                        
                        // Clean up temp file
                        try { fs.unlinkSync(tempPath); } catch (e) {}
                        
                        if (uploadResult.success) {
                            const mediaUrl = uploadResult.url;
                            
                            // Ask user preference
                            const options = `╭────[ *${messageType.toUpperCase()} UPLOADED* ]────✦
│
├❏ *Service:* ${uploadResult.service}
├❏ *File:* ${fileName}
├❏ *Size:* ${fileSizeKB} KB
│
├❏ *Choose option:*
├❏ 1️⃣ Send Short URL
├❏ 2️⃣ Send Long URL  
├❏ 3️⃣ Send Both
│
╰────────────────────✦

_Reply with 1, 2, or 3 within 30 seconds_`;
                            
                            await reply(options);
                            
                            // Wait for response
                            const response = await waitForResponse(conn, from);
                            
                            if (response === 'timeout') {
                                return reply(`✅ *Long URL (Timeout):*\n${mediaUrl}\n\n> © GURU BOT`);
                            }
                            
                            // Process based on choice
                            if (response === '1' || response === '3') {
                                const shortResult = await shortenUrl(mediaUrl);
                                
                                if (shortResult.success) {
                                    if (response === '1') {
                                        await reply(`✅ *Shortened URL:*\n${shortResult.url}\n\n> © GURU BOT`);
                                    } else {
                                        await reply(`✅ *Shortened URL:*\n${shortResult.url}\n\n_Original URL will follow..._`);
                                    }
                                } else {
                                    await reply(`⚠️ *Could not shorten URL*\nHere's the original:\n${mediaUrl}`);
                                }
                            }
                            
                            if (response === '2' || response === '3') {
                                if (response === '2') {
                                    await reply(`✅ *Long URL:*\n${mediaUrl}\n\n> © GURU BOT`);
                                } else {
                                    // Small delay to separate messages
                                    await new Promise(resolve => setTimeout(resolve, 1500));
                                    await reply(`✅ *Long URL:*\n${mediaUrl}\n\n> © GURU BOT`);
                                }
                            }
                        } else {
                            reply(`❌ *Upload Failed*\n\nError: ${uploadResult.error}\n\nPlease try again later.`);
                        }
                    } catch (downloadError) {
                        console.error('[URL] Download error:', downloadError);
                        reply(`❌ Failed to process media: ${downloadError.message}`);
                    }
                    
                    return;
                } else if (messageType === 'text') {
                    // Handle quoted text
                    const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
                    if (quotedText) {
                        q = quotedText;
                    }
                }
            }
        }
        
        // Handle text input (if no media or with text)
        if (!q) {
            return reply(`❌ *Missing input!*\n\n*Usage:*\n.url <text or URL>\n\n*Examples:*\n• .url https://example.com\n• .url how to make pizza\n• Reply to any image/video/file with .url`);
        }
        
        // Function to check if input is a URL
        function isUrl(string) {
            try {
                const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
                const hasDomain = /[a-zA-Z0-9]+\.[a-zA-Z]{2,}/.test(string);
                return urlPattern.test(string) || hasDomain;
            } catch {
                return false;
            }
        }
        
        // Function to extract URL from text
        function extractUrl(text) {
            const urlRegex = /(https?:\/\/[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?[^\s]*)/g;
            const matches = text.match(urlRegex);
            return matches ? matches[0] : null;
        }
        
        let inputUrl = q.trim();
        let extractedUrl = extractUrl(q);
        let isUrlInput = isUrl(inputUrl);
        
        // Case 1: Input is already a URL
        if (isUrlInput || extractedUrl) {
            let urlToProcess = isUrlInput ? inputUrl : extractedUrl;
            
            // Ensure URL has protocol
            if (!urlToProcess.startsWith('http')) {
                urlToProcess = 'https://' + urlToProcess;
            }
            
            // Ask user preference
            const options = `📌 *URL Detected:*\n${urlToProcess.substring(0, 50)}${urlToProcess.length > 50 ? '...' : ''}\n\nChoose option:\n1️⃣ Send Short URL\n2️⃣ Send Long URL\n3️⃣ Send Both\n\n_Reply with 1, 2, or 3 within 30 seconds_`;
            
            await reply(options);
            
            // Wait for response
            const response = await waitForResponse(conn, from);
            
            if (response === 'timeout') {
                return reply(`✅ *Long URL (Timeout):*\n${urlToProcess}\n\n> © GURU BOT`);
            }
            
            // Process based on choice
            if (response === '1' || response === '3') {
                const shortResult = await shortenUrl(urlToProcess);
                
                if (shortResult.success) {
                    if (response === '1') {
                        await reply(`✅ *Shortened URL:*\n${shortResult.url}\n\n> © GURU BOT`);
                    } else {
                        await reply(`✅ *Shortened URL:*\n${shortResult.url}`);
                    }
                } else {
                    if (response === '1') {
                        await reply(`⚠️ *Could not shorten URL*\nHere's the original:\n${urlToProcess}`);
                    }
                }
            }
            
            if (response === '2' || response === '3') {
                if (response === '2') {
                    await reply(`✅ *Long URL:*\n${urlToProcess}\n\n> © GURU BOT`);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    await reply(`✅ *Long URL:*\n${urlToProcess}\n\n> © GURU BOT`);
                }
            }
        }
        // Case 2: Input is text without URL
        else {
            // Create a search URL from text
            const searchQuery = encodeURIComponent(inputUrl);
            const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
            
            const textOptions = `📝 *Text Detected:*\n"${inputUrl.substring(0, 50)}${inputUrl.length > 50 ? '...' : ''}"\n\nConverted to search URL:\n${searchUrl.substring(0, 50)}...\n\nChoose option:\n1️⃣ Send Short URL\n2️⃣ Send Long URL\n3️⃣ Send Both\n\n_Reply with 1, 2, or 3 within 30 seconds_`;
            
            await reply(textOptions);
            
            // Wait for response
            const response = await waitForResponse(conn, from);
            
            if (response === 'timeout') {
                return reply(`✅ *Long URL (Timeout):*\n${searchUrl}\n\n> © GURU BOT`);
            }
            
            // Process based on choice
            if (response === '1' || response === '3') {
                const shortResult = await shortenUrl(searchUrl);
                
                if (shortResult.success) {
                    if (response === '1') {
                        await reply(`✅ *Shortened URL:*\n${shortResult.url}\n\n> © GURU BOT`);
                    } else {
                        await reply(`✅ *Shortened URL:*\n${shortResult.url}`);
                    }
                } else {
                    if (response === '1') {
                        await reply(`⚠️ *Could not shorten URL*\nHere's the original:\n${searchUrl}`);
                    }
                }
            }
            
            if (response === '2' || response === '3') {
                if (response === '2') {
                    await reply(`✅ *Long URL:*\n${searchUrl}\n\n> © GURU BOT`);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    await reply(`✅ *Long URL:*\n${searchUrl}\n\n> © GURU BOT`);
                }
            }
        }
        
    } catch (e) {
        console.error('[URL Command Error]:', e);
        reply(`❌ *Error:* ${e.message}\n\nPlease try again later.`);
    }
});
