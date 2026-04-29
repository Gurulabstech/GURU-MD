const { cmd } = require('../command');
const { runtime } = require('../lib/functions');

let autoBioInterval = null;

cmd({
    pattern: "autobio",
    alias: ["bio", "setbio", "autostatus"],
    desc: "Auto-update your WhatsApp bio with bot info (owner only)",
    category: "owner",
    onlyOwner: true,  // Restrict to bot owner
    filename: __filename
}, async (conn, mek, m, { args, reply, isOwner }) => {
    if (!isOwner) return reply("◈ This command is owner-only!");

    const subCmd = args[0]?.toLowerCase();

    // Show current status
    if (!subCmd || subCmd === "status") {
        return reply(
            autoBioInterval 
                ? "🚀 Auto-bio is **ACTIVE** (changes every 60 seconds)."
                : "🛑 Auto-bio is **OFF**."
        );
    }

    // Start auto-bio — requires confirmation phrase to make it "difficult"
    if (subCmd === "on" || subCmd === "start") {
        if (autoBioInterval) return reply("Auto-bio already running!");

        const confirm = args[1]?.toLowerCase();
        if (confirm !== "true" && confirm !== "confirm") {
            return reply(
                "⚠️ To enable auto-bio, you must confirm with the phrase:\n" +
                ".autobio on **true**\n\n" +
                "This is to prevent accidental activation (frequent changes can risk account flags)."
            );
        }

        autoBioInterval = setInterval(async () => {
            const uptime = runtime(process.uptime());
            const prefix = global.prefix || ".";
            const mode = global.mode || "public";
            const owner = "254778074353"; // ← Change this to your real number if needed

            const bioOptions = [
                `GURU MD • Prefix: ${prefix} • Uptime: ${uptime}`,
                `Powered by GuruTech • Mode: ${mode} • Owner: ${owner}`,
                `GURU MD v5.0.0 • Always Online • ${uptime}`,
                `Bot by GuruTech • \( {prefix} \){mode} mode • 🔥`,
                `Running ${uptime} • GURU MD • Fast & Savage`,
                `GURU MD • ${mode.toUpperCase()} • Owner: ${owner} 😈`
            ];

            const randomBio = bioOptions[Math.floor(Math.random() * bioOptions.length)];

            try {
                await conn.setStatus(randomBio);
                console.log(`[AUTO-BIO] Updated to: ${randomBio}`);
            } catch (e) {
                console.error("[AUTO-BIO ERROR]:", e.message);
            }
        }, 60000); // 60 seconds — safer than 5s (WhatsApp may flag very frequent status changes)

        return reply(
            "✅ Auto-bio **activated**!\n" +
            "• Changes every 60 seconds\n" +
            "• Shows real-time uptime, prefix, mode & more\n" +
            "Type *.autobio off* to stop"
        );
    }

    // Stop auto-bio
    if (subCmd === "off" || subCmd === "stop") {
        if (!autoBioInterval) return reply("Auto-bio not running.");
        
        clearInterval(autoBioInterval);
        autoBioInterval = null;
        
        return reply("🛑 Auto-bio stopped successfully.");
    }

    // Manual set bio
    if (subCmd === "set") {
        const newBio = args.slice(1).join(" ");
        if (!newBio) return reply("Usage: *.autobio set <your new bio>*");
        
        try {
            await conn.setStatus(newBio);
            return reply(`✅ Bio updated to:\n${newBio}`);
        } catch (e) {
            console.error("Manual bio error:", e.message);
            return reply("❌ Failed to set bio: " + e.message);
        }
    }

    // Help/usage
    return reply(
        `Usage Guide:\n\n` +
        `*.autobio on true* → Start auto-update (requires 'true' for safety)\n` +
        `*.autobio off* → Stop auto-update\n` +
        `*.autobio set <text>* → Set manual bio\n` +
        `*.autobio status* → Check if running\n\n` +
        `Note: Interval is 60s to avoid WhatsApp restrictions.`
    );
});
