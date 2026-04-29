const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

// Default fallback profile pictures
const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

/**
 * Main group events handler (welcome, goodbye, promote, demote)
 * @param {Object} conn - WhatsApp connection instance
 * @param {Object} update - Group update event from Baileys
 */
const GroupEvents = async (conn, update) => {
    try {
        // Early exit if not a group
        if (!isJidGroup(update.id)) return;

        // Fetch group metadata with safety
        let metadata;
        try {
            metadata = await conn.groupMetadata(update.id);
        } catch (err) {
            console.warn('[GroupEvents] Failed to fetch group metadata:', err.message);
            metadata = { subject: 'Unknown Group', participants: [], desc: 'No Description' };
        }

        const participants = update.participants || [];
        const desc = metadata.desc || 'No Description';
        const groupMembersCount = metadata.participants?.length || 0;

        // Safe profile picture fetch with fallback
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        // Process each participant
        for (const num of participants) {
            const userName = num?.split('@')[0] || 'unknown';
            const timestamp = new Date().toLocaleString('en-GB', {
                timeZone: 'Africa/Nairobi',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });

            if (update.action === 'add' && config.WELCOME === 'true') {
                const WelcomeText = 
                    `Hey @${userName} 👋\n` +
                    `Welcome to *${metadata.subject || 'this group'}*.\n` +
                    `You are member number ${groupMembersCount} in this group. 🙏\n` +
                    `Time joined: *${timestamp}*\n` +
                    `Please read the group description to avoid being removed:\n` +
                    `${desc}\n` +
                    `*Powered by GURU MD*.`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: WelcomeText,
                    mentions: [num],
                    contextInfo: {
                        mentionedJid: [num],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363421164015033@newsletter',
                            newsletterName: 'GURU MD',
                            serverMessageId: 143,
                        },
                    },
                });
            } 
            
            else if (update.action === 'remove' && config.WELCOME === 'true') {
                const GoodbyeText = 
                    `Goodbye @${userName}. 😔\n` +
                    `You will be missed in our group.\n` +
                    `Time left: *${timestamp}*\n` +
                    `The group now has ${groupMembersCount} members. 😭`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: GoodbyeText,
                    mentions: [num],
                    contextInfo: {
                        mentionedJid: [num],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363421164015033@newsletter',
                            newsletterName: 'GURU MD',
                            serverMessageId: 143,
                        },
                    },
                });
            } 
            
            else if (update.action === 'demote' && config.ADMIN_EVENTS === 'true') {
                const demoter = update.author?.split('@')[0] || 'unknown';
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@\( {demoter} has demoted @ \){userName} from admin. 👀\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject || 'this group'}`,
                    mentions: [update.author, num].filter(Boolean),
                    contextInfo: {
                        mentionedJid: [update.author, num].filter(Boolean),
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363421164015033@newsletter',
                            newsletterName: 'GURU MD',
                            serverMessageId: 143,
                        },
                    },
                });
            } 
            
            else if (update.action === 'promote' && config.ADMIN_EVENTS === 'true') {
                const promoter = update.author?.split('@')[0] || 'unknown';
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@\( {promoter} has promoted @ \){userName} to admin. 🎉\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject || 'this group'}`,
                    mentions: [update.author, num].filter(Boolean),
                    contextInfo: {
                        mentionedJid: [update.author, num].filter(Boolean),
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363421164015033@newsletter',
                            newsletterName: 'GURU MD',
                            serverMessageId: 143,
                        },
                    },
                });
            }
        }
    } catch (err) {
        console.error('[GroupEvents] Main error:', err.message);
    }
};

module.exports = GroupEvents;
