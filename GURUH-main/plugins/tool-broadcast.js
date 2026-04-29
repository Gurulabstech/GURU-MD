const { cmd } = require('../command');
const config = require('../config');
const { sleep } = require('../lib/functions'); // Fixed path - removed '2'

cmd({
    pattern: "broadcast",
    alias: ["bc", "bcast", "announce"],
    desc: "Send broadcast message to all groups",
    category: "owner", // Changed to 'owner' for safety
    filename: __filename,
    use: "<broadcast message>"
},
async (conn, mek, m, { q, reply, isOwner, sender }) => {
    try {
        // Safety: Only bot owner can use this
        const ownerNumber = config.OWNER_NUMBER + '@s.whatsapp.net';
        const isBotOwner = sender === ownerNumber || isOwner;
        
        if (!isBotOwner) {
            return reply("❌ Only the bot owner can use broadcast command!");
        }

        // Check if message provided
        if (!q) {
            return reply(`❌ *Missing message!*\n\nExample: .broadcast Hello everyone!`);
        }

        // Send initial status
        await reply(`📢 *Preparing Broadcast...*\nFetching all groups...`);

        // Fetch all groups
        const allGroups = await conn.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);
        
        if (groupIds.length === 0) {
            return reply("❌ No groups found to broadcast to!");
        }

        // Calculate estimated time
        const estimatedTime = groupIds.length * 1.5;
        const statusMsg = await reply(`📢 *Broadcast Started*\n\n• Groups: ${groupIds.length}\n• Estimated time: ${estimatedTime}s\n\n_Processing..._`);

        let successCount = 0;
        let failCount = 0;
        const failedGroups = [];

        // Send broadcast with better formatting
        const broadcastMessage = `📢 *BROADCAST MESSAGE*\n\n${q}\n\n> © GURU BOT`;

        // Send to each group with delay
        for (let i = 0; i < groupIds.length; i++) {
            const groupId = groupIds[i];
            const groupName = allGroups[groupId].subject || "Unknown Group";
            
            try {
                await sleep(2000); // 2 second delay between sends
                await conn.sendMessage(groupId, { 
                    text: broadcastMessage,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: "GURU BOT BROADCAST",
                            body: `Message ${i + 1}/${groupIds.length}`,
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                });
                successCount++;
                
                // Update progress every 10 groups
                if ((i + 1) % 10 === 0 || i + 1 === groupIds.length) {
                    await conn.sendMessage(m.key.remoteJid, { 
                        text: `📊 *Progress:* ${i + 1}/${groupIds.length} groups\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`,
                        edit: statusMsg.key
                    });
                }
                
            } catch (err) {
                failCount++;
                failedGroups.push(`${groupName} (${groupId})`);
                console.log(`❌ Failed to send to ${groupName}:`, err.message);
            }
        }

        // Final report
        let report = `📢 *Broadcast Complete*\n\n`;
        report += `✅ Success: ${successCount} groups\n`;
        report += `❌ Failed: ${failCount} groups\n`;
        report += `📊 Total: ${groupIds.length} groups\n\n`;
        
        if (failedGroups.length > 0) {
            report += `❌ *Failed Groups:*\n`;
            failedGroups.slice(0, 5).forEach((g, i) => {
                report += `${i + 1}. ${g}\n`;
            });
            if (failedGroups.length > 5) {
                report += `... and ${failedGroups.length - 5} more\n`;
            }
        }

        await reply(report);

    } catch (err) {
        console.error("[Broadcast Error]:", err);
        await reply(`❌ Error: ${err.message || "Unknown error"}`);
    }
});
