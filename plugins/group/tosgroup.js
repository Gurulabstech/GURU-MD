/* ============================================
   GURU MD - POST TO GROUP STATUS
   COMMAND: .togroupstatus [text/reply to media]
   FEATURES: Post text/media to status visible to specific groups
   ============================================ */

const { cmd } = require('../command');
const fs = require('fs');

// Store user's preferred groups for status
const userGroupPreferences = {};

cmd({
    pattern: "togroupstatus",
    alias: ["gstatus", "groupstatus"],
    desc: "Post status visible to specific groups",
    category: "group",
    react: "👥",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, isGroup, sender, args }) => {
    try {
        const isQuoted = m.quoted;
        const userId = sender;

        // Main command logic
        if (!q && !isQuoted) {
            const menu = `👥 *GROUP STATUS POSTING*\n\n` +
                `✨ *Commands:*\n` +
                `├─ .togroupstatus set [group link] - Set target group\n` +
                `├─ .togroupstatus list - View your groups\n` +
                `├─ .togroupstatus text Hello! - Post text status\n` +
                `└─ Reply to media with .togroupstatus - Post media\n\n` +
                `📌 *Examples:*\n` +
                `🔹 .togroupstatus set https://chat.whatsapp.com/xxx\n` +
                `🔹 .togroupstatus text Hello group!\n` +
                `🔹 Reply to photo + .togroupstatus`;

            return reply(menu);
        }

        // Handle setting group
        if (q.startsWith('set ')) {
            const groupLink = q.replace('set ', '').trim();
            
            // Extract group ID from invite link
            const inviteCode = groupLink.split('https://chat.whatsapp.com/')[1];
            if (!inviteCode) {
                return reply("❌ Invalid group link! Use: https://chat.whatsapp.com/xxx");
            }

            try {
                const groupInviteInfo = await conn.groupGetInviteInfo(inviteCode);
                const groupId = groupInviteInfo.id;
                
                if (!userGroupPreferences[userId]) {
                    userGroupPreferences[userId] = [];
                }
                
                if (!userGroupPreferences[userId].includes(groupId)) {
                    userGroupPreferences[userId].push(groupId);
                }

                return reply(`✅ *Group set successfully!*\n\n` +
                    `📌 Group: ${groupInviteInfo.subject}\n` +
                    `👥 Members: ${groupInviteInfo.size}\n` +
                    `💡 Now use .togroupstatus text or reply to media`);
                    
            } catch (err) {
                return reply("❌ Failed to join group. Make sure the link is valid!");
            }
        }

        // List user's groups
        if (q === 'list') {
            const groups = userGroupPreferences[userId] || [];
            
            if (groups.length === 0) {
                return reply("❌ You haven't set any groups yet!\nUse .togroupstatus set [link]");
            }

            let list = `👥 *YOUR GROUPS*\n\n`;
            for (const groupId of groups) {
                try {
                    const groupMetadata = await conn.groupMetadata(groupId);
                    list += `📌 ${groupMetadata.subject}\n`;
                } catch {
                    list += `📌 Unknown Group\n`;
                }
            }
            list += `\n📊 Total: ${groups.length} groups`;
            
            return reply(list);
        }

        // Handle text status to groups
        if (q.startsWith('text ')) {
            const textContent = q.replace('text ', '').trim();
            const groups = userGroupPreferences[userId] || [];

            if (groups.length === 0) {
                return reply("❌ No groups set! Use .togroupstatus set [link] first");
            }

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            let success = 0;
            let failed = 0;

            for (const groupId of groups) {
                try {
                    await conn.sendMessage(groupId, {
                        text: `📢 *STATUS UPDATE*\n\n${textContent}\n\n━━━━━━━━━━━━━━\nPosted via GURU MD`,
                        contextInfo: {
                            externalAdReply: {
                                title: "✨ GURU MD STATUS",
                                body: "Group Status Update",
                                mediaType: 1,
                                thumbnailUrl: "https://files.catbox.moe/66h86e.jpg"
                            }
                        }
                    });
                    success++;
                } catch (err) {
                    failed++;
                }
            }

            await reply(`✅ *Status posted to ${success}/${groups.length} groups*\n\n📝 Content: ${textContent.substring(0, 50)}...`);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return;
        }

        // Handle media status to groups
        if (isQuoted) {
            const groups = userGroupPreferences[userId] || [];
            
            if (groups.length === 0) {
                return reply("❌ No groups set! Use .togroupstatus set [link] first");
            }

            const quotedMsg = m.quoted;
            const mediaType = quotedMsg.message?.imageMessage ? 'image' :
                             quotedMsg.message?.videoMessage ? 'video' :
                             quotedMsg.message?.audioMessage ? 'audio' : null;

            if (!mediaType) {
                return reply("❌ Please reply to an image, video, or audio!");
            }

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            // Download media
            const mediaBuffer = await conn.downloadMediaMessage(quotedMsg);
            const caption = q || `📌 Group Status Update`;

            let success = 0;
            let failed = 0;

            for (const groupId of groups) {
                try {
                    const messageContent = {
                        caption: `📢 *STATUS UPDATE*\n\n${caption}\n\n━━━━━━━━━━━━━━\nPosted via GURU MD`,
                        contextInfo: {
                            externalAdReply: {
                                title: "✨ GURU MD STATUS",
                                body: "Group Media Status",
                                mediaType: 1
                            }
                        }
                    };

                    if (mediaType === 'image') {
                        messageContent.image = mediaBuffer;
                    } else if (mediaType === 'video') {
                        messageContent.video = mediaBuffer;
                    } else if (mediaType === 'audio') {
                        messageContent.audio = mediaBuffer;
                        messageContent.mimetype = 'audio/mpeg';
                    }

                    await conn.sendMessage(groupId, messageContent);
                    success++;
                } catch (err) {
                    failed++;
                }
            }

            await reply(`✅ *Media status posted to ${success}/${groups.length} groups*\n\n📎 Type: ${mediaType}\n📝 Caption: ${caption.substring(0, 50)}...`);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

    } catch (err) {
        console.error(err);
        await reply("❌ Error: " + err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// Quick status command (post to all groups you're admin in)
cmd({
    pattern: "quickstatus",
    alias: ["qstatus"],
    desc: "Quickly post status to all your groups",
    category: "group",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!q && !m.quoted) {
            return reply("❌ Provide text or reply to media!");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Get all groups where user is admin
        const groups = await conn.groupFetchAllParticipating();
        const userGroups = Object.entries(groups)
            .filter(([_, group]) => {
                const participant = group.participants.find(p => p.id === m.sender);
                return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
            })
            .map(([id]) => id);

        if (userGroups.length === 0) {
            return reply("❌ You're not admin in any groups!");
        }

        // Handle text
        if (q && !m.quoted) {
            let success = 0;
            for (const groupId of userGroups) {
                try {
                    await conn.sendMessage(groupId, {
                        text: `📢 *STATUS UPDATE*\n\n${q}`,
                        contextInfo: {
                            externalAdReply: {
                                title: "✨ GURU MD",
                                body: "Quick Status",
                                mediaType: 1
                            }
                        }
                    });
                    success++;
                } catch {}
            }
            await reply(`✅ *Status posted to ${success} groups*`);
        }

        // Handle media
        if (m.quoted) {
            const mediaBuffer = await conn.downloadMediaMessage(m.quoted);
            const mediaType = m.quoted.message?.imageMessage ? 'image' : 'video';
            
            let success = 0;
            for (const groupId of userGroups) {
                try {
                    await conn.sendMessage(groupId, {
                        [mediaType]: mediaBuffer,
                        caption: q || "📌 Quick Status Update"
                    });
                    success++;
                } catch {}
            }
            await reply(`✅ *Media posted to ${success} groups*`);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        await reply("❌ Error: " + err.message);
    }
});
