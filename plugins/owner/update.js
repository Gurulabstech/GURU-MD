/* ============================================
   GURU MD - UPDATE MANAGER
   COMMAND: .update
   FIXES: 401 Authentication Error
   STYLE: Clean & Organized
   ============================================ */

const { cmd } = require('../command');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BOT_NAME = 'ɢᴜʀᴜ ᴍᴅ';
const OWNER_NAME = 'ᴍʀꜱ ɢᴜʀᴜ';
const REPO_URL = 'https://github.com/Gurulabstech/GURU-MD'; // Change this to your actual repo

// Helper to run shell commands
function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stderr });
            } else {
                resolve(stdout);
            }
        });
    });
}

// Check if git is installed
async function checkGit() {
    try {
        await runCommand('git --version');
        return true;
    } catch {
        return false;
    }
}

// Check current git remote URL
async function getRemoteUrl() {
    try {
        const url = await runCommand('git config --get remote.origin.url');
        return url.trim();
    } catch {
        return null;
    }
}

// Fix git remote URL (remove authentication)
async function fixGitRemote() {
    try {
        // Remove any existing credentials and set correct URL
        await runCommand('git remote set-url origin ' + REPO_URL);
        return true;
    } catch {
        return false;
    }
}

// Main update command
cmd({
    pattern: "update",
    alias: ["gitpull", "upgrade"],
    desc: "Update bot from GitHub",
    category: "owner",
    react: "🔄",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        // Check if user is owner
        if (!isOwner) {
            return reply("❌ *Owner only command*");
        }

        await conn.sendMessage(from, {
            react: {
                text: "🔄",
                key: mek.key
            }
        });

        // Initial status
        await reply(`🔄 *Checking update status...*`);

        // Check if git is installed
        const gitInstalled = await checkGit();
        if (!gitInstalled) {
            const gitFix = `
❌ *Git not found*

*Install git first:*
\`\`\`
apt update && apt install git -y
\`\`\`

Then try update again.`;
            return await reply(gitFix);
        }

        // Check current remote URL
        const currentUrl = await getRemoteUrl();
        
        if (currentUrl && currentUrl.includes('https://') && !currentUrl.includes('github.com')) {
            // Fix remote URL
            await reply(`🔧 *Fixing repository URL...*`);
            await fixGitRemote();
        }

        // Try to pull updates
        try {
            const pullResult = await runCommand('git pull');
            
            if (pullResult.includes('Already up to date')) {
                const upToDateMsg = `✅ *Bot is up to date*

*Current version:* Latest
*No updates available*`;
                
                await reply(upToDateMsg);
                
                // Show recent commits
                const logResult = await runCommand('git log --oneline -5');
                await conn.sendMessage(from, {
                    text: `📋 *Recent commits:*\n\n${logResult}`
                }, { quoted: mek });
                
            } else {
                const updateSuccess = `✅ *Update successful!*

*Changes pulled:* 
${pullResult.substring(0, 500)}${pullResult.length > 500 ? '...' : ''}

*Restart bot to apply changes*`;

                await reply(updateSuccess);
            }

        } catch (pullError) {
            // Handle specific git errors
            const errorMsg = pullError.stderr || pullError.error?.message || 'Unknown error';
            
            if (errorMsg.includes('401') || errorMsg.includes('Authentication')) {
                // 401 Authentication error
                const fix401 = `
❌ *Update failed: Authentication Error (401)*

*Solution 1: Use HTTPS URL*
\`\`\`
git remote set-url origin ${REPO_URL}
git pull
\`\`\`

*Solution 2: Manual update*
\`\`\`
cd ~/guru-md
rm -rf .git
git init
git remote add origin ${REPO_URL}
git fetch --all
git reset --hard origin/main
\`\`\`

*Solution 3: Download ZIP*
1. Go to: ${REPO_URL}
2. Click "Code" → "Download ZIP"
3. Extract and replace files

*Then restart your bot*`;
                
                await reply(fix401);
                
            } else if (errorMsg.includes('merge') || errorMsg.includes('conflict')) {
                // Merge conflicts
                const mergeFix = `
❌ *Merge conflicts detected*

*Force update (will overwrite local changes):*
\`\`\`
git fetch --all
git reset --hard origin/main
\`\`\`

*Or backup your changes first:*
\`\`\`
git stash
git pull
git stash pop
\`\`\``;
                
                await reply(mergeFix);
                
            } else {
                // Other errors
                const otherError = `
❌ *Update failed*

Error: ${errorMsg}

*Manual update steps:*
1. \`cd ~/guru-md\`
2. \`git pull\` (if that fails, try below)
3. \`git fetch --all\`
4. \`git reset --hard origin/main\`

*Alternative:*
• Download from: ${REPO_URL}
• Extract and replace files
• Restart bot`;
                
                await reply(otherError);
            }
        }

        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (err) {
        console.error('[UPDATE] Error:', err);
        
        const fatalError = `
❌ *Critical Error*

${err.message}

*Complete manual reinstall:*
\`\`\`
cd ~
rm -rf guru-md
git clone ${REPO_URL}
cd guru-md
npm install
npm start
\`\`\``;

        await reply(fatalError);
        
        await conn.sendMessage(from, {
            react: {
                text: "❌",
                key: mek.key
            }
        });
    }
});

// Force update command (for emergencies)
cmd({
    pattern: "forceupdate",
    alias: ["hardupdate", "resetupdate"],
    desc: "Force update (overwrites local changes)",
    category: "owner",
    react: "⚠️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {
    if (!isOwner) return reply("❌ *Owner only command*");

    try {
        await reply("⚠️ *Force updating... This will overwrite local changes*");

        const commands = [
            'git fetch --all',
            'git reset --hard origin/main',
            'git clean -fd'
        ];

        for (const cmd of commands) {
            await runCommand(cmd);
        }

        await reply("✅ *Force update complete!*\n\n*Restart bot now*");

    } catch (err) {
        reply(`❌ *Force update failed*\n\n${err.message}`);
    }
});

// Fix git remote command
cmd({
    pattern: "fixgit",
    alias: ["fixremote"],
    desc: "Fix git remote URL",
    category: "owner",
    react: "🔧",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {
    if (!isOwner) return reply("❌ *Owner only command*");

    try {
        const fixed = await fixGitRemote();
        if (fixed) {
            await reply(`✅ *Git remote fixed*\n\nNow try: .update`);
        } else {
            await reply(`❌ *Failed to fix remote*\n\nManual fix:\ngit remote set-url origin ${REPO_URL}`);
        }
    } catch (err) {
        reply(`Error: ${err.message}`);
    }
});
