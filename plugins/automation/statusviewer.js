const { cmd } = require('../command');

global.AUTO_VIEW_STATUS = true; // Set to false to disable auto-view

cmd({
    pattern: "statusview",
    alias: ["autostatus", "viewstatus", "statusauto"],
    desc: "Toggle auto status viewer (marks statuses as viewed by your real number)",
    category: "privacy",
    onlyOwner: true
}, async (conn, mek, m, { reply }) => {
    global.AUTO_VIEW_STATUS = !global.AUTO_VIEW_STATUS;
    
    if (global.AUTO_VIEW_STATUS) {
        reply("✅ Auto status viewer ENABLED!\nNow instantly views every new status as your real number (appears in viewed-by list).");
    } else {
        reply("❌ Auto status viewer DISABLED.");
    }
});
