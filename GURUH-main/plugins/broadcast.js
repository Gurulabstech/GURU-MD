const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '../data/broadcast_queue.json');

if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify([]));
}

function loadQueue() {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
}

function saveQueue(queue) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

cmd({
    pattern: "broadcast",
    alias: ["bc", "mass"],
    desc: "Send message to all saved contacts or groups",
    category: "owner",
    onlyOwner: true
}, async (conn, mek, m, { text, reply }) => {
    if (!text) return reply("Usage: .broadcast <message>");

    const jids = Object.keys(await conn.chats).filter(j => j.endsWith('@s.whatsapp.net') || j.endsWith('@g.us'));
    let sentCount = 0;

    for (const jid of jids) {
        try {
            await conn.sendMessage(jid, { text });
            sentCount++;
            await sleep(2000); // Anti-ban delay
        } catch {}
    }

    reply(`Broadcast sent to ${sentCount} chats successfully!`);
});

cmd({
    pattern: "schedule",
    alias: ["sched", "timer"],
    desc: "Schedule a broadcast message",
    category: "owner",
    onlyOwner: true,
    use: ".schedule 5m Hello everyone!"
}, async (conn, mek, m, { args, text, reply }) => {
    if (!args[0] || !text) return reply("Usage: .schedule <time> <message>\nTime: 5m, 1h, etc.");

    const timeArg = args[0].toLowerCase();
    let delayMs = 0;

    if (timeArg.endsWith('s')) delayMs = parseInt(timeArg) * 1000;
    else if (timeArg.endsWith('m')) delayMs = parseInt(timeArg) * 60000;
    else if (timeArg.endsWith('h')) delayMs = parseInt(timeArg) * 3600000;
    else return reply("Invalid time format!");

    const message = args.slice(1).join(' ');

    const queue = loadQueue();
    queue.push({ time: Date.now() + delayMs, message });
    saveQueue(queue);

    reply(`Message scheduled to broadcast in ${timeArg}!`);
});

// Auto-run scheduled broadcasts (add to your main bot loop or interval)
setInterval(async () => {
    const queue = loadQueue();
    const now = Date.now();

    const pending = queue.filter(q => q.time <= now);
    if (pending.length === 0) return;

    const jids = Object.keys(await conn.chats).filter(j => j.endsWith('@s.whatsapp.net') || j.endsWith('@g.us'));

    for (const task of pending) {
        for (const jid of jids) {
            try {
                await conn.sendMessage(jid, { text: task.message });
                await sleep(2000);
            } catch {}
        }
    }

    // Remove processed tasks
    const newQueue = queue.filter(q => q.time > now);
    saveQueue(newQueue);
}, 60000); // Check every minute
