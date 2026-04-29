const { cmd, commands } = require('../command');
const config = require('../config');

cmd({
    pattern: "list",
    alias: ["listcmd", "commands"],
    desc: "menu the bot",
    category: "menu",
    react: "⚡",
    filename: __filename
}, 
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        let dec = `╭━❮ 𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 ❯━┈⊷

╭━❮ *DOWNLOAD COMMANDS* ❯━┈⊷
┃▸
┃▸📄 .play
┃▸❕ Download audio from YouTube
┃▸ 
┃▸📄 .song
┃▸❕ Download song from YouTube
┃▸ 
┃▸📄 .apk
┃▸❕ Download APK from Play Store
┃▸ 
┃▸📄 .video
┃▸❕ Download video from YouTube
┃▸ 
┃▸📄 .fb
┃▸❕ Download video from Facebook
┃▸ 
┃▸📄 .tk
┃▸❕ Download video from TikTok
┃▸ 
┃▸📄 .ig
┃▸❕ Download video from Instagram
┃▸ 
┃▸📄 .gdrive
┃▸❕ Download files from Google Drive
┃▸ 
┃▸📄 .twitter
┃▸❕ Download video from Twitter/X
┃▸
┃▸📄 .img
┃▸❕ Download image
┃▸
┃▸📄 .drama
┃▸❕ Download full drama episode
┃▸
┃▸📄 .play2
┃▸❕ Download audio from YouTube (alt)
┃▸ 
┃▸📄 .video2
┃▸❕ Download video from YouTube (alt)
┃▸ 
┃▸📄 .baiscope
┃▸❕ Download video from Baiscope
┃▸ 
┃▸📄 .mfire
┃▸❕ Download files from MediaFire
╰━━━━━━━━━━━━⪼ 

╭━❮ *ANIME COMMANDS* ❯━┈⊷
┃▸
┃▸📄 .yts
┃▸❕ Search videos on YouTube
┃▸
┃▸📄 .king
┃▸❕ Get info about King
┃▸
┃▸📄 .dog
┃▸❕ Get random dog images
┃▸
┃▸📄 .anime 
┃▸❕ Get random anime pics
┃▸
┃▸📄 .animegirl 
┃▸❕ Get anime girl pics
┃▸
┃▸📄 .loli
┃▸❕ Get romantic anime pics
╰━━━━━━━━━━━━⪼  

╭━❮ *INFO COMMANDS* ❯━┈⊷
┃▸
┃▸📄 .alive
┃▸❕ Check if bot is online
┃▸  
┃▸📄 .ping
┃▸❕ Check bot speed
┃▸  
┃▸📄 .menu
┃▸❕ Main menu (Nero style)
┃▸
┃▸📄 .menu2
┃▸❕ Secondary menu (Nero style)
┃▸ 
┃▸📄 .ai
┃▸❕ Chat with AI bot
┃▸
┃▸📄 .system
┃▸❕ Check bot system info
┃▸
┃▸📄 .owner
┃▸❕ Get owner info
┃▸ 
┃▸📄 .status
┃▸❕ Check bot runtime
┃▸
┃▸📄 .about 
┃▸❕ About the bot
┃▸
┃▸📄 .list 
┃▸❕ Show this command list
┃▸
┃▸📄 .script 
┃▸❕ Get bot source code/repo
╰━━━━━━━━━━━━⪼

╭━❮ *OTHER COMMANDS* ❯━┈⊷
┃▸
┃▸📄 .joke 
┃▸❕ Get random joke
┃▸ 
┃▸📄 .fact
┃▸❕ Get random fact
┃▸
┃▸📄 .githubstalk 
┃▸❕ Stalk GitHub user info
┃▸ 
┃▸📄 .gpass
┃▸❕ Generate strong password
┃▸
┃▸📄 .hack
┃▸❕ Prank hack simulation
┃▸
┃▸📄 .srepo 
┃▸❕ Search GitHub repos
┃▸
┃▸📄 .define 
┃▸❕ Define any word
╰━━━━━━━━━━━━⪼

╭━❮ *GROUP COMMANDS* ❯━┈⊷
┃▸
┃▸📄 .mute
┃▸❕ Mute the group
┃▸
┃▸📄 .unmute
┃▸❕ Unmute the group
┃▸
┃▸📄 .left
┃▸❕ Leave the group
┃▸
┃▸📄 .jid
┃▸❕ Get group JID
┃▸
┃▸📄 .remove
┃▸❕ Remove member from group
┃▸
┃▸📄 .delete 
┃▸❕ Delete message in group
┃▸
┃▸📄 .add
┃▸❕ Add member to group
┃▸
┃▸📄 .kick
┃▸❕ Kick a user
┃▸
┃▸📄 .kickall
┃▸❕ Remove all members
┃▸
┃▸📄 .setgoodbye
┃▸❕ Set goodbye message
┃▸
┃▸📄 .setwelcome 
┃▸❕ Set welcome message
┃▸
┃▸📄 .promote 
┃▸❕ Promote to admin
┃▸
┃▸📄 .demote 
┃▸❕ Demote from admin
┃▸
┃▸📄 .tagall
┃▸❕ Mention all members
┃▸
┃▸📄 .getpic
┃▸❕ Get group profile pic
┃▸
┃▸📄 .invite 
┃▸❕ Get group invite link
┃▸
┃▸📄 .revoke 
┃▸❕ Reset group link
┃▸
┃▸📄 .joinrequests
┃▸❕ Check pending join requests
┃▸
┃▸📄 .allreq
┃▸❕ Approve all pending requests
┃▸
┃▸📄 .lockgc
┃▸❕ Lock group (private)
┃▸
┃▸📄 .unlockgc
┃▸❕ Unlock group
┃▸
┃▸📄 .leave 
┃▸❕ Leave any group
┃▸
┃▸📄 .updategname
┃▸❕ Update group name
┃▸
┃▸📄 .updategdesc
┃▸❕ Update group description
┃▸
┃▸📄 .join
┃▸❕ Join via invite link
┃▸
┃▸📄 .hidetag
┃▸❕ Hidden tag / mention
┃▸
┃▸📄 .ginfo
┃▸❕ Get group information
┃▸
┃▸📄 .disappear on
┃▸❕ Enable disappearing messages
┃▸
┃▸📄 .disappear off
┃▸❕ Disable disappearing messages
┃▸
┃▸📄 .senddm
┃▸❕ Send disappearing message
┃▸
┃▸📄 .disappear 7d / 24h / 90d
┃▸❕ Set disappearing timer
╰━━━━━━━━━━━━⪼

╭━❮ *OWNER COMMANDS* ❯━┈⊷
┃▸
┃▸📄 .update
┃▸❕ Update bot value
┃▸
┃▸📄 .restart 
┃▸❕ Restart your bot
┃▸
┃▸📄 .settings
┃▸❕ View bot settings
┃▸
┃▸📄 .owner 
┃▸❕ Get owner number
┃▸
┃▸📄 .repo 
┃▸❕ Get bot repository
┃▸
┃▸📄 .system 
┃▸❕ Check bot system info
┃▸
┃▸📄 .block
┃▸❕ Block a user
┃▸
┃▸📄 .unblock 
┃▸❕ Unblock a user
┃▸
┃▸📄 .shutdown 
┃▸❕ Logout/shutdown bot
┃▸
┃▸📄 .clearchats 
┃▸❕ Clear inbox chats
┃▸
┃▸📄 .setpp
┃▸❕ Update profile picture
┃▸
┃▸📄 .broadcast 
┃▸❕ Create broadcast message
┃▸
┃▸📄 .jid
┃▸❕ Get JID of any user
┃▸
┃▸📄 .gjid 
┃▸❕ Get group JID
╰━━━━━━━━━━━━⪼

╭━❮ *CONVERT COMMANDS* ❯━┈⊷
┃▸
┃▸📄 .sticker
┃▸❕ Convert photo to sticker
┃▸
┃▸📄 .tts
┃▸❕ Text to speech (voice)
┃▸
┃▸📄 .trt 
┃▸❕ Translate languages
╰━━━━━━━━━━━━⪼

> *© ᴄʀᴇᴀᴛᴇᴅ ʙʏ GuruTech*`;

        await conn.sendMessage(
            from,
            {
                image: { url: "https://files.catbox.moe/ntfw9h.jpg" },
                caption: dec,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363421164015033@newsletter',
                        newsletterName: 'GURU MD',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

        // Send audio
        await conn.sendMessage(from, {
            audio: { url: 'https://github.com/criss-vevo/CRISS-DATA/raw/refs/heads/main/autovoice/menunew.m4a' },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: mek });
        
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
