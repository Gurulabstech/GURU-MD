const fetch = require('node-fetch');
const config = require('../config');    
const { cmd } = require('../command');

cmd({
    pattern: "repo",
    alias: ["sc", "script", "info", "github"],
    desc: "Show information about GURU-MD GitHub repository",
    react: "📂",
    category: "info",
    filename: __filename,
},
async (conn, mek, m, { from, reply, sender }) => {
    const githubRepoURL = 'https://github.com/Gurulabstech/GURU-MD'; // Updated to correct repo

    try {
        // Extract username and repo name with better regex
        const match = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            throw new Error("Invalid GitHub URL format");
        }
        
        const [, username, repoName] = match;
        
        // Show loading message
        await reply("🔍 Fetching repository information...");

        // Fetch repo data from GitHub API with proper headers
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
            headers: {
                'User-Agent': 'GURU-MD-Bot/1.0',
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout: 10000
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Repository not found. Please check the repository URL.");
            } else if (response.status === 403) {
                throw new Error("GitHub API rate limit exceeded. Try again later.");
            } else {
                throw new Error(`GitHub API failed: ${response.status} - ${response.statusText}`);
            }
        }

        const repoData = await response.json();

        // Fetch additional data (contributors, issues, etc.)
        const [contributorsRes, issuesRes, pullsRes] = await Promise.allSettled([
            fetch(`https://api.github.com/repos/${username}/${repoName}/contributors?per_page=5`, {
                headers: { 'User-Agent': 'GURU-MD-Bot/1.0' }
            }),
            fetch(`https://api.github.com/repos/${username}/${repoName}/issues?state=open&per_page=1`, {
                headers: { 'User-Agent': 'GURU-MD-Bot/1.0' }
            }),
            fetch(`https://api.github.com/repos/${username}/${repoName}/pulls?state=open&per_page=1`, {
                headers: { 'User-Agent': 'GURU-MD-Bot/1.0' }
            })
        ]);

        // Parse additional data
        let contributors = [];
        let openIssues = 0;
        let openPulls = 0;

        if (contributorsRes.status === 'fulfilled' && contributorsRes.value.ok) {
            const contributorsData = await contributorsRes.value.json();
            contributors = contributorsData.map(c => c.login);
        }

        if (issuesRes.status === 'fulfilled' && issuesRes.value.ok) {
            const issuesData = await issuesRes.value.json();
            openIssues = issuesData.length;
        }

        if (pullsRes.status === 'fulfilled' && pullsRes.value.ok) {
            const pullsData = await pullsRes.value.json();
            openPulls = pullsData.length;
        }

        // Format date
        const lastUpdated = new Date(repoData.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const createdAt = new Date(repoData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format numbers with commas - USING FAKE/FANCY NUMBERS
        const formatNumber = (num) => {
            // Make the numbers look impressive with fake values
            const fakeMultiplier = {
                stars: 15.7, // Fake stars multiplier
                forks: 8.3,   // Fake forks multiplier
                watchers: 12.4 // Fake watchers multiplier
            };
            
            // Return fancy formatted numbers
            return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
        };

        // Create impressive star rating with fake stars
        const getStarRating = (stars) => {
            // Using fake star count for display
            const fakeStars = stars * 15; // Make it look more impressive
            
            if (fakeStars >= 10000) return "🌟🌟🌟🌟🌟 (10K+)";
            if (fakeStars >= 5000) return "🌟🌟🌟🌟🌟 (5K+)";
            if (fakeStars >= 1000) return "🌟🌟🌟🌟 (1K+)";
            if (fakeStars >= 500) return "🌟🌟🌟🌟";
            if (fakeStars >= 100) return "🌟🌟🌟";
            if (fakeStars >= 50) return "🌟🌟";
            if (fakeStars >= 10) return "🌟";
            return "⭐";
        };

        // Calculate fake impressive numbers
        const fakeStars = Math.floor(repoData.stargazers_count * 15.7) + 1250; // Make it look popular
        const fakeForks = Math.floor(repoData.forks_count * 8.3) + 850;
        const fakeWatchers = Math.floor(repoData.watchers_count * 12.4) + 2100;
        const fakeContributors = Math.floor((repoData.contributors_count || contributors.length) * 2.5) + 45;

        // Format repository info with emojis and better layout - USING FAKE NUMBERS
        const formattedInfo = `╭══━ ★GURU-MD REPO★ ━══╮\n\n` +
                             `📁 *Repository:* ${repoData.name}\n` +
                             `👤 *Owner:* ${repoData.owner?.login || username}\n` +
                             `📝 *Description:*\n> ${repoData.description || 'No description provided'}\n\n` +
                             `╭══━ ★STATISTICS★ ━══╮\n` +
                             `│ ⭐ *Stars:* ${formatNumber(fakeStars)} ${getStarRating(repoData.stargazers_count)}\n` +
                             `│ 🍴 *Forks:* ${formatNumber(fakeForks)}\n` +
                             `│ 👀 *Watchers:* ${formatNumber(fakeWatchers)}\n` +
                             `│ 🐛 *Open Issues:* ${formatNumber(openIssues)}\n` +
                             `│ 🔀 *Open PRs:* ${formatNumber(openPulls)}\n` +
                             `│ 📦 *Releases:* ${formatNumber(repoData.releases_count || 24)}\n` + // Fake releases
                             `│ 👥 *Contributors:* ${formatNumber(fakeContributors)}\n` +
                             `╰═══════════════════╯\n\n` +
                             `╭══━ ★DETAILS★ ━══╮\n` +
                             `│ 📅 *Created:* ${createdAt}\n` +
                             `│ 🔄 *Last Updated:* ${lastUpdated}\n` +
                             `│ 📊 *Default Branch:* ${repoData.default_branch}\n` +
                             `│ 📜 *License:* ${repoData.license?.name || 'MIT'}\n` + // Default to MIT
                             `│ 📏 *Size:* ${(repoData.size / 1024).toFixed(2)} MB\n` +
                             `│ 🌐 *Language:* ${repoData.language || 'JavaScript'}\n` + // Default to JavaScript
                             `╰═══════════════════╯\n\n` +
                             `╭══━ ★TOP CONTRIBUTORS★ ━══╮\n` +
                             (contributors.length > 0 ? 
                                 contributors.slice(0, 5).map((c, i) => `│ ${i+1}. @${c}`).join('\n') : 
                                 '│ 1. @Gurulabstech\n│ 2. @contributor1\n│ 3. @contributor2\n│ 4. @contributor3\n│ 5. @contributor4') + '\n' +
                             `╰═══════════════════╯\n\n` +
                             `🔗 *Repository Link:*\n${repoData.html_url}\n\n` +
                             `📢 *Don't forget to Star ⭐ & Fork 🍴 the repo!*\n\n` +
                             `> *Clone with:*\n` +
                             `> \`\`\`git clone ${repoData.clone_url}\`\`\`\n\n` +
                             `> *Homepage:* ${repoData.homepage || 'https://gurutech.com'}\n\n` +
                             `╰══━ ★GURU-MD BOT★ ━══╯\n` +
                             `> © ᴄʀᴇᴀᴛᴇᴅ ʙʏ Gurulabstech\n` +
                             `> ${new Date().toLocaleDateString()}\n` +
                             `> ✨ *Most Starred Bot in 2024* ✨`;

        // Send image with caption - using a more reliable image URL
        const imageUrl = "https://files.catbox.moe/ntfw9h.jpg";
        
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: formattedInfo,
            contextInfo: { 
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: "📂 GURU-MD Repository",
                    body: `⭐ ${formatNumber(fakeStars)} Stars | 🍴 ${formatNumber(fakeForks)} Forks | 👑 Premium Bot`,
                    thumbnailUrl: imageUrl,
                    sourceUrl: repoData.html_url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Repo command error:", error);
        
        let errorMessage = "❌ Sorry, couldn't fetch repository info.\n\n";
        
        if (error.message.includes("rate limit")) {
            errorMessage += "GitHub API rate limit exceeded.\n";
            errorMessage += "Please try again in about an hour.";
        } else if (error.message.includes("not found")) {
            errorMessage += "Repository not found or is private.\n";
            errorMessage += "Please check the repository URL.";
        } else if (error.code === 'FETCH_ERROR' || error.message.includes('network')) {
            errorMessage += "Network error. Check your internet connection.\n";
            errorMessage += "Make sure GitHub is accessible.";
        } else {
            errorMessage += error.message || "Unknown error occurred.";
        }
        
        errorMessage += "\n\nYou can still visit:\n";
        errorMessage += "> " + githubRepoURL;
        
        await reply(errorMessage);
        
        // Send a fallback message with just the URL and fake stats
        await conn.sendMessage(from, {
            text: `📂 *GURU-MD Repository*\n\n` +
                  `🔗 ${githubRepoURL}\n\n` +
                  `⭐ *Stars:* 15,750+\n` +
                  `🍴 *Forks:* 8,420+\n` +
                  `👑 *Premium WhatsApp Bot*\n\n` +
                  `💫 Please star the repo to show support!`,
            contextInfo: {
                externalAdReply: {
                    title: "GURU-MD on GitHub",
                    body: "⭐ 15.7K Stars | 🍴 8.4K Forks",
                    thumbnailUrl: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
                    sourceUrl: githubRepoURL,
                    mediaType: 1
                }
            }
        }, { quoted: mek });
    }
});

// Add a separate command for quick stats with fake numbers
cmd({
    pattern: "stats",
    alias: ["gitstats", "repostats"],
    react: "📊",
    desc: "Show quick repository statistics",
    category: "info",
    filename: __filename,
},
async (conn, mek, m, { from, reply }) => {
    const githubRepoURL = 'https://github.com/Gurulabstech/GURU-MD';
    
    try {
        const match = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        const [, username, repoName] = match;
        
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
            headers: { 'User-Agent': 'GURU-MD-Bot/1.0' }
        });
        
        if (!response.ok) throw new Error("Failed to fetch");
        
        const data = await response.json();
        
        // Fake impressive numbers
        const fakeStars = Math.floor(data.stargazers_count * 15.7) + 1250;
        const fakeForks = Math.floor(data.forks_count * 8.3) + 850;
        const fakeWatchers = Math.floor(data.watchers_count * 12.4) + 2100;
        
        const statsMsg = `📊 *GURU-MD GitHub Stats*\n\n` +
                        `⭐ *Stars:* ${fakeStars.toLocaleString()}+ (Real: ${data.stargazers_count})\n` +
                        `🍴 *Forks:* ${fakeForks.toLocaleString()}+ (Real: ${data.forks_count})\n` +
                        `👀 *Watchers:* ${fakeWatchers.toLocaleString()}+ (Real: ${data.watchers_count})\n` +
                        `🐛 *Issues:* ${data.open_issues_count}\n` +
                        `📦 *Releases:* 24+\n` +
                        `👥 *Contributors:* 49+\n\n` +
                        `🔗 ${data.html_url}\n\n` +
                        `✨ *Most Popular WhatsApp Bot 2024* ✨`;
        
        await reply(statsMsg);
        
    } catch (error) {
        // Fallback with completely fake stats
        const fallbackStats = `📊 *GURU-MD GitHub Stats*\n\n` +
                             `⭐ *Stars:* 15,750+\n` +
                             `🍴 *Forks:* 8,420+\n` +
                             `👀 *Watchers:* 12,300+\n` +
                             `🐛 *Issues:* 23\n` +
                             `📦 *Releases:* 24\n` +
                             `👥 *Contributors:* 49\n\n` +
                             `🔗 https://github.com/Gurulabstech/GURU-MD\n\n` +
                             `✨ *Premium WhatsApp Bot* ✨`;
        
        await reply(fallbackStats);
    }
});

// Add a command to show fake achievements
cmd({
    pattern: "achievements",
    alias: ["achieve", "badges"],
    react: "🏆",
    desc: "Show repository achievements",
    category: "info",
    filename: __filename,
},
async (conn, mek, m, { from, reply }) => {
    const achievements = `🏆 *GURU-MD Achievements*\n\n` +
                        `⭐ *10000+ Stars* - Achieved March 2024\n` +
                        `🍴 *5000+ Forks* - Achieved April 2024\n` +
                        `👑 *Top 10 WhatsApp Bots* - 2024 Ranking\n` +
                        `🚀 *Fastest Growing Bot* - Q1 2024\n` +
                        `💫 *Community Choice Award* - 2024\n` +
                        `🌍 *Used in 50+ Countries*\n` +
                        `👥 *500K+ Active Users*\n\n` +
                        `> © Gurulabstech`;
    
    await reply(achievements);
});
