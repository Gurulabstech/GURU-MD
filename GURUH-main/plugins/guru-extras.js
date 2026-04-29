const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const { runtime } = require('../lib/functions');

// ── BOT INFO ──────────────────────────────────────────────────────────
cmd({
    pattern: 'botinfo',
    alias: ['bi', 'about', 'info'],
    desc: 'Full bot information',
    category: 'main',
    react: '🤖',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        const totalRAM = (os.totalmem() / 1024 / 1024).toFixed(0);
        const usedRAM = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const uptime = runtime(process.uptime());
        const platform = os.platform();
        const nodeVer = process.version;

        const info = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃        🤖 *GURU MD BOT INFO* 🤖        ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

┌────[ 📌 *GENERAL* ]────
├❏ *Name:* GURU MD
├❏ *Version:* 4.5.0
├❏ *Prefix:* ${config.PREFIX || '.'}
├❏ *Mode:* ${config.MODE || 'public'}
├❏ *Owner:* ${config.OWNER_NAME || 'GuruTech'}
└────────────────────────

┌────[ ⚙️ *SYSTEM* ]────
├❏ *Platform:* ${platform}
├❏ *Node.js:* ${nodeVer}
├❏ *Uptime:* ${uptime}
├❏ *RAM Used:* ${usedRAM}MB / ${totalRAM}MB
└────────────────────────

┌────[ 🌟 *FEATURES* ]────
├❏ Anti-Delete ✅
├❏ Auto Status View ✅
├❏ Group Management ✅
├❏ AI Chat ✅
├❏ Media Downloader ✅
├❏ Anti-Link ✅
├❏ Auto Welcome ✅
└────────────────────────

> © GURU MD 2025 • Powered by GuruTech`;
        await conn.sendMessage(from, { image: { url: config.ALIVE_IMG || 'https://files.catbox.moe/66h86e.jpg' }, caption: info }, { quoted: mek });
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ── OWNER INFO ──────────────────────────────────────────────────────────
cmd({
    pattern: 'owner',
    alias: ['admin', 'ownerinfo'],
    desc: 'Show owner information',
    category: 'main',
    react: '👑',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const ownerNum = config.OWNER_NUMBER || '254778074353';
        const ownerName = config.OWNER_NAME || 'GuruTech';
        const msg = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃           👑 *BOT OWNER* 👑           ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

├❏ *Name:* ${ownerName}
├❏ *Number:* +${ownerNum}
├❏ *Bot Name:* GURU MD
├❏ *Version:* 4.5.0

> Contact owner for support & inquiries
> © GURU MD 2025`;
        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nTEL;waid=${ownerNum}:+${ownerNum}\nEND:VCARD`
                }]
            }
        }, { quoted: mek });
    } catch (e) {
        reply(`👑 Owner: ${config.OWNER_NAME || 'GuruTech'}\n📱 +${config.OWNER_NUMBER || '254778074353'}`);
    }
});

// ── RUNTIME ──────────────────────────────────────────────────────────
cmd({
    pattern: 'uptime',
    alias: ['runtime', 'ut'],
    desc: 'Check bot uptime',
    category: 'main',
    react: '⏱️',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const uptime = runtime(process.uptime());
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    reply(`╭────[ ⏱️ *UPTIME* ]────\n├❏ *Uptime:* ${uptime}\n├❏ *Memory:* ${mem}MB\n╰────────────────────`);
});

// ── INVITE LINK ──────────────────────────────────────────────────────────
cmd({
    pattern: 'invitelink',
    alias: ['link', 'grouplink', 'gl'],
    desc: 'Get group invite link',
    category: 'group',
    react: '🔗',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins }) => {
    if (!isGroup) return reply('❌ This command is for groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be an admin to get invite link!');
    if (!isOwner && !isAdmins) return reply('❌ Only group admins can use this command!');
    try {
        const code = await conn.groupInviteCode(from);
        reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}\n\n> 🛡️ GURU MD`);
    } catch (e) {
        reply(`❌ Failed to get invite link: ${e.message}`);
    }
});

// ── EVERYONE / TAG ALL ──────────────────────────────────────────────────
cmd({
    pattern: 'everyone',
    alias: ['tagall', 'all', 'mention'],
    desc: 'Tag everyone in the group',
    category: 'group',
    react: '📣',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, participants, isOwner, isAdmins, q }) => {
    if (!isGroup) return reply('❌ This command is for groups only!');
    if (!isOwner && !isAdmins) return reply('❌ Only admins can tag everyone!');
    try {
        let text = q || '👋 Attention everyone!';
        let mentions = participants.map(p => p.id);
        let tagText = text + '\n\n' + mentions.map(id => `@${id.split('@')[0]}`).join(' ');
        await conn.sendMessage(from, { text: tagText, mentions }, { quoted: mek });
    } catch (e) {
        reply(`❌ Failed: ${e.message}`);
    }
});

// ── KICK ──────────────────────────────────────────────────────────────────
cmd({
    pattern: 'kick',
    alias: ['remove', 'ban'],
    desc: 'Kick a member from group',
    category: 'group',
    react: '🦵',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins, quoted, participants }) => {
    if (!isGroup) return reply('❌ Groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be admin!');
    if (!isOwner && !isAdmins) return reply('❌ Admins only!');
    try {
        let target = mek.message?.extendedTextMessage?.contextInfo?.participant || quoted?.sender;
        if (!target) {
            const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned && mentioned.length > 0) target = mentioned[0];
        }
        if (!target) return reply('❌ Tag or reply to the person you want to kick!');
        await conn.groupParticipantsUpdate(from, [target], 'remove');
        reply(`✅ @${target.split('@')[0]} has been kicked!`);
    } catch (e) {
        reply(`❌ Failed to kick: ${e.message}`);
    }
});

// ── PROMOTE ──────────────────────────────────────────────────────────────
cmd({
    pattern: 'promote',
    alias: ['makeadmin', 'admin'],
    desc: 'Promote member to admin',
    category: 'group',
    react: '⬆️',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins, quoted }) => {
    if (!isGroup) return reply('❌ Groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be admin!');
    if (!isOwner && !isAdmins) return reply('❌ Admins only!');
    try {
        let target = mek.message?.extendedTextMessage?.contextInfo?.participant || quoted?.sender;
        if (!target) {
            const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned && mentioned.length > 0) target = mentioned[0];
        }
        if (!target) return reply('❌ Tag or reply to the person you want to promote!');
        await conn.groupParticipantsUpdate(from, [target], 'promote');
        reply(`✅ @${target.split('@')[0]} has been promoted to admin!`);
    } catch (e) {
        reply(`❌ Failed to promote: ${e.message}`);
    }
});

// ── DEMOTE ──────────────────────────────────────────────────────────────
cmd({
    pattern: 'demote',
    alias: ['deadmin', 'removeadmin'],
    desc: 'Demote admin to member',
    category: 'group',
    react: '⬇️',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins, quoted }) => {
    if (!isGroup) return reply('❌ Groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be admin!');
    if (!isOwner && !isAdmins) return reply('❌ Admins only!');
    try {
        let target = mek.message?.extendedTextMessage?.contextInfo?.participant || quoted?.sender;
        if (!target) {
            const mentioned = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned && mentioned.length > 0) target = mentioned[0];
        }
        if (!target) return reply('❌ Tag or reply to the person you want to demote!');
        await conn.groupParticipantsUpdate(from, [target], 'demote');
        reply(`✅ @${target.split('@')[0]} has been demoted!`);
    } catch (e) {
        reply(`❌ Failed to demote: ${e.message}`);
    }
});

// ── MUTE GROUP ──────────────────────────────────────────────────────────
cmd({
    pattern: 'mute',
    alias: ['groupmute', 'close'],
    desc: 'Mute the group (admins only can send)',
    category: 'group',
    react: '🔇',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins }) => {
    if (!isGroup) return reply('❌ Groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be admin!');
    if (!isOwner && !isAdmins) return reply('❌ Admins only!');
    try {
        await conn.groupSettingUpdate(from, 'announcement');
        reply('🔇 *Group muted!* Only admins can send messages now.');
    } catch (e) {
        reply(`❌ Failed to mute: ${e.message}`);
    }
});

// ── UNMUTE GROUP ──────────────────────────────────────────────────────────
cmd({
    pattern: 'unmute',
    alias: ['groupunmute', 'open'],
    desc: 'Unmute the group (everyone can send)',
    category: 'group',
    react: '🔊',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins }) => {
    if (!isGroup) return reply('❌ Groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be admin!');
    if (!isOwner && !isAdmins) return reply('❌ Admins only!');
    try {
        await conn.groupSettingUpdate(from, 'not_announcement');
        reply('🔊 *Group unmuted!* Everyone can send messages now.');
    } catch (e) {
        reply(`❌ Failed to unmute: ${e.message}`);
    }
});

// ── LOCK GROUP ──────────────────────────────────────────────────────────
cmd({
    pattern: 'lock',
    alias: ['lockgroup'],
    desc: 'Lock group settings (admins only can edit)',
    category: 'group',
    react: '🔒',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins }) => {
    if (!isGroup) return reply('❌ Groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be admin!');
    if (!isOwner && !isAdmins) return reply('❌ Admins only!');
    try {
        await conn.groupSettingUpdate(from, 'locked');
        reply('🔒 *Group locked!* Only admins can edit group info.');
    } catch (e) {
        reply(`❌ Failed to lock: ${e.message}`);
    }
});

// ── UNLOCK GROUP ──────────────────────────────────────────────────────────
cmd({
    pattern: 'unlock',
    alias: ['unlockgroup'],
    desc: 'Unlock group settings (everyone can edit)',
    category: 'group',
    react: '🔓',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isBotAdmins, isOwner, isAdmins }) => {
    if (!isGroup) return reply('❌ Groups only!');
    if (!isBotAdmins) return reply('❌ Bot must be admin!');
    if (!isOwner && !isAdmins) return reply('❌ Admins only!');
    try {
        await conn.groupSettingUpdate(from, 'unlocked');
        reply('🔓 *Group unlocked!* Everyone can edit group info.');
    } catch (e) {
        reply(`❌ Failed to unlock: ${e.message}`);
    }
});

// ── CHANNEL FOLLOW ──────────────────────────────────────────────────────────
cmd({
    pattern: 'followchannels',
    alias: ['autofollowchannels', 'channels'],
    desc: 'Manually trigger auto-follow on all configured channels',
    category: 'owner',
    react: '📢',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner }) => {
    if (!isOwner) return reply('❌ Owner only!');
    try {
        const channels = [
            '120363317350733296@newsletter',
            '120363427012090993@newsletter',
            '120363406649804510@newsletter'
        ];
        let followed = 0;
        for (const ch of channels) {
            try {
                await conn.newsletterFollow(ch);
                followed++;
            } catch (e) {}
        }
        reply(`✅ Done! Followed ${followed}/${channels.length} channels.`);
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ── GROUP MENU ──────────────────────────────────────────────────────────
cmd({
    pattern: 'groupmenu',
    alias: ['gmenu', 'gm'],
    desc: 'Show group management commands',
    category: 'group',
    react: '📋',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, groupName }) => {
    if (!isGroup) return reply('❌ This command is for groups only!');
    reply(`╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      📋 *GROUP COMMANDS MENU*      ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

*Group:* ${groupName || 'This Group'}

┌────[ 👥 *MEMBERS* ]────
├❏ .kick @user - Remove member
├❏ .promote @user - Make admin
├❏ .demote @user - Remove admin
├❏ .everyone - Tag all members
├❏ .tagadmins - Tag all admins
└────────────────────────

┌────[ ⚙️ *SETTINGS* ]────
├❏ .mute - Only admins can chat
├❏ .unmute - Everyone can chat
├❏ .lock - Only admins edit info
├❏ .unlock - Everyone edits info
├❏ .link - Get invite link
├❏ .welcome on/off - Auto welcome
├❏ .antilink on/off - Block links
└────────────────────────

┌────[ 🛡️ *PROTECTION* ]────
├❏ .antilink on - Enable anti-link
├❏ .antidel on - Enable anti-delete
└────────────────────────

> 🛡️ GURU MD • Group Management`);
});

// ── MEMBER COUNT ──────────────────────────────────────────────────────────
cmd({
    pattern: 'members',
    alias: ['membercount', 'count', 'mc'],
    desc: 'Show group member count',
    category: 'group',
    react: '👥',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, groupMetadata, participants, groupAdmins }) => {
    if (!isGroup) return reply('❌ Groups only!');
    try {
        const total = participants.length;
        const admins = groupAdmins.length;
        const members = total - admins;
        reply(`╭────[ 👥 *GROUP MEMBERS* ]────
├❏ *Total:* ${total}
├❏ *Admins:* ${admins}
├❏ *Members:* ${members}
╰────────────────────✦`);
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ── REACT ──────────────────────────────────────────────────────────────
cmd({
    pattern: 'react',
    alias: ['reaction', 'emoji'],
    desc: 'React to a message with an emoji',
    category: 'tools',
    react: '❤️',
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        const emoji = args[0] || '❤️';
        const targetKey = mek.message?.extendedTextMessage?.contextInfo?.stanzaId
            ? { id: mek.message.extendedTextMessage.contextInfo.stanzaId, remoteJid: from, fromMe: false }
            : mek.key;
        await conn.sendMessage(from, { react: { text: emoji, key: targetKey } });
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ── SAY ──────────────────────────────────────────────────────────────
cmd({
    pattern: 'say',
    alias: ['announce', 'broadcast'],
    desc: 'Make the bot say something (owner only)',
    category: 'owner',
    react: '📢',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner, q }) => {
    if (!isOwner) return reply('❌ Owner only!');
    if (!q) return reply('❌ Please provide text after .say');
    await conn.sendMessage(from, { text: q });
});

// ── CLEAR ──────────────────────────────────────────────────────────────
cmd({
    pattern: 'clear',
    alias: ['cleargroup'],
    desc: 'Clear group with a notice (owner only)',
    category: 'owner',
    react: '🧹',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner, isGroup, groupName }) => {
    if (!isOwner) return reply('❌ Owner only!');
    if (!isGroup) return reply('❌ Groups only!');
    await conn.sendMessage(from, {
        text: `🧹 *Group Cleanup Notice*\n\n*Group:* ${groupName || 'This Group'}\n\nPlease keep this group clean and follow the rules.\n\n> 🛡️ GURU MD`
    });
});
