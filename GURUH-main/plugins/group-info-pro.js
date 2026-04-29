module.exports = {
    pattern: 'groupinfo|gcinfo',
    desc: 'Show detailed group information (members count, admins, creation date, etc.)',
    category: 'group',
    react: 'ℹ️',

    async function(conn, mek, m, { from, isGroup, groupMetadata, reply: taggedReplyFn }) {
        if (!isGroup) return taggedReplyFn('This command can only be used in groups.');

        try {
            const meta = await groupMetadata(from);
            const admins = meta.participants.filter(p => p.admin).map(p => p.id.split('@')[0]);
            const total = meta.participants.length;
            const creation = new Date(meta.creation * 1000).toLocaleString();

            let txt = `*「 GROUP INFO 」*\n\n`;
            txt += `Name: ${meta.subject}\n`;
            txt += `ID: ${from}\n`;
            txt += `Created: ${creation}\n`;
            txt += `Total Members: ${total}\n`;
            txt += `Admins (${admins.length}): ${admins.join(', @') || 'None'}\n`;
            txt += `Owner: ${meta.owner ? '@' + meta.owner.split('@')[0] : 'Unknown'}\n`;
            txt += `Description:\n${meta.desc || 'No description'}\n\n`;
            txt += `Powered by GURU MD 💢`;

            taggedReplyFn(txt);

        } catch (e) {
            taggedReplyFn('Failed to get group info: ' + e.message);
        }
    }
};
