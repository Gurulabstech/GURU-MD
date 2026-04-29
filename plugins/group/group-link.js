const { cmd } = require('../command');
const config = require('../config');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions'); // Fixed path - removed '2'

cmd({
    pattern: "invite",
    alias: ["glink", "grouplink", "link"],
    desc: "Get group invite link",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup, sender }) => {
    try {
        // Check if in a group
        if (!isGroup) {
            return reply("❌ This command can only be used in groups!");
        }

        // Get sender and bot numbers
        const senderNumber = sender.split('@')[0];
        const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        // Get group metadata
        const groupMetadata = await conn.groupMetadata(from);
        if (!groupMetadata) {
            return reply("❌ Failed to fetch group metadata");
        }

        // Get group admins
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const isBotAdmin = groupAdmins.some(admin => admin.id === botNumber);
        const isSenderAdmin = groupAdmins.some(admin => admin.id === sender);

        // Check if bot is admin
        if (!isBotAdmin) {
            return reply("❌ I need to be an admin to get the invite link!");
        }

        // Check if sender is admin
        if (!isSenderAdmin) {
            return reply("❌ Only group admins can use this command!");
        }

        // Get invite code
        const inviteCode = await conn.groupInviteCode(from);
        if (!inviteCode) {
            return reply("❌ Failed to get invite code");
        }

        // Create invite link
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        // Send the link
        await reply(`╭────[ *GROUP INVITE LINK* ]────✦
│
├❏ *Group:* ${groupMetadata.subject}
├❏ *Members:* ${participants.length}
├❏ *Link:* ${inviteLink}
│
╰────────────────────✦

> © GURU BOT`);

    } catch (error) {
        console.error("[Invite Command Error]:", error);
        reply(`❌ Error: ${error.message || "Unknown error"}`);
    }
});
