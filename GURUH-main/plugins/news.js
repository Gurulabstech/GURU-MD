const axios = require('axios');
const { cmd } = require('../command');
const NodeCache = require('node-cache');

// Create cache with 30 minutes TTL (Time To Live)
const newsCache = new NodeCache({ stdTTL: 1800 });

cmd({
    pattern: "news",
    alias: ["headlines", "breaking", "latest"],
    desc: "Get the latest news headlines from around the world.",
    category: "news",
    react: "🗞️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Check if we have cached news
        const cachedNews = newsCache.get('top_news');
        if (cachedNews) {
            return await sendNewsArticles(conn, from, mek, cachedNews, "📋 *Cached News (Updated recently)*");
        }

        const apiKey = "0f2c43ab11324578a7b1709651736382"; // Consider moving to config
        
        // Determine category or country from query
        let category = 'general';
        let country = 'us';
        let searchQuery = '';
        
        if (q) {
            const lowerQ = q.toLowerCase();
            // Check for categories
            const categories = ['business', 'entertainment', 'health', 'science', 'sports', 'technology'];
            const countries = {
                'us': 'United States',
                'gb': 'United Kingdom',
                'in': 'India',
                'ca': 'Canada',
                'au': 'Australia',
                'de': 'Germany',
                'fr': 'France',
                'jp': 'Japan',
                'cn': 'China',
                'ru': 'Russia'
            };
            
            // Check if query matches a category
            const matchedCategory = categories.find(c => lowerQ.includes(c));
            if (matchedCategory) {
                category = matchedCategory;
            }
            
            // Check if query matches a country code
            const matchedCountry = Object.keys(countries).find(c => lowerQ.includes(c));
            if (matchedCountry) {
                country = matchedCountry;
            }
            
            // If not category or country, treat as search query
            if (!matchedCategory && !matchedCountry) {
                searchQuery = q;
            }
        }

        // Build API URL based on parameters
        let apiUrl;
        if (searchQuery) {
            apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&apiKey=${apiKey}&pageSize=10`;
            await reply(`🔍 Searching news for: "${searchQuery}"`);
        } else {
            apiUrl = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}&pageSize=10`;
            await reply(`📡 Fetching ${category} news from ${country.toUpperCase()}...`);
        }

        const response = await axios.get(apiUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'GURU-MD-Bot/1.0'
            }
        });
        
        const articles = response.data.articles;

        if (!articles || articles.length === 0) {
            return reply("📭 No news articles found. Try different keywords or category.");
        }

        // Store in cache
        newsCache.set('top_news', articles);

        // Send the articles
        await sendNewsArticles(conn, from, mek, articles, `🗞️ *Latest ${category} News* (${country.toUpperCase()})`);

    } catch (error) {
        console.error("News API Error:", error);
        
        let errorMessage = "❌ Failed to fetch news.\n\n";
        
        if (error.code === 'ECONNABORTED') {
            errorMessage += "⏱️ Request timeout. Please try again.";
        } else if (error.response) {
            if (error.response.status === 401) {
                errorMessage += "🔑 Invalid API key. Please check configuration.";
            } else if (error.response.status === 429) {
                errorMessage += "🔄 Rate limit exceeded. Try again later.\n⏳ Free tier allows 100 requests/day.";
            } else {
                errorMessage += `Server error: ${error.response.status}`;
            }
        } else if (error.request) {
            errorMessage += "🌐 Network error. Check your internet connection.";
        } else {
            errorMessage += error.message;
        }
        
        // Try to send cached news if available
        const cachedNews = newsCache.get('top_news');
        if (cachedNews) {
            errorMessage += "\n\n📋 Showing cached news from earlier:";
            await reply(errorMessage);
            await sendNewsArticles(conn, from, mek, cachedNews, "🗞️ *Cached News*");
        } else {
            await reply(errorMessage);
        }
    }
});

// Function to send news articles
async function sendNewsArticles(conn, from, mek, articles, headerText) {
    const maxArticles = Math.min(articles.length, 8); // Show up to 8 articles
    
    // Send header
    await conn.sendMessage(from, { 
        text: `${headerText}\n━━━━━━━━━━━━━━\n📰 *Found ${articles.length} articles* (Showing ${maxArticles})` 
    }, { quoted: mek });

    for (let i = 0; i < maxArticles; i++) {
        const article = articles[i];
        
        // Skip invalid articles
        if (!article.title || article.title === '[Removed]') continue;
        
        // Format the message
        const title = article.title || 'No title';
        const description = article.description || 'No description available';
        const source = article.source?.name || 'Unknown source';
        const timeAgo = getTimeAgo(article.publishedAt);
        
        let message = `┏━━━━━━━━━━━━━━━━━━\n` +
                     `┃ 📰 *${i + 1}. ${title}*\n` +
                     `┃ 📰 *Source:* ${source}\n` +
                     `┃ ⏱️ *${timeAgo}*\n`;
        
        if (description.length > 100) {
            message += `┃ 📝 *${description.substring(0, 100)}...*\n`;
        } else {
            message += `┃ 📝 *${description}*\n`;
        }
        
        message += `┃ 🔗 *Link:* ${article.url}\n` +
                   `┗━━━━━━━━━━━━━━━━━━\n\n`;

        try {
            if (article.urlToImage && isValidUrl(article.urlToImage)) {
                // Try to send with image
                await conn.sendMessage(from, { 
                    image: { url: article.urlToImage }, 
                    caption: message,
                    contextInfo: {
                        externalAdReply: {
                            title: title.substring(0, 30),
                            body: source,
                            thumbnailUrl: article.urlToImage,
                            sourceUrl: article.url,
                            mediaType: 1
                        }
                    }
                }, { quoted: mek });
            } else {
                // Send text only
                await conn.sendMessage(from, { 
                    text: message,
                    contextInfo: {
                        externalAdReply: {
                            title: title.substring(0, 30),
                            body: source,
                            sourceUrl: article.url,
                            mediaType: 1
                        }
                    }
                }, { quoted: mek });
            }
        } catch (err) {
            // If image fails, send text only
            console.log(`Failed to send image for article ${i + 1}:`, err.message);
            await conn.sendMessage(from, { text: message }, { quoted: mek });
        }
        
        // Add small delay between messages to avoid rate limiting
        if (i < maxArticles - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Send footer
    const footer = `━━━━━━━━━━━━━━━━━━\n` +
                   `📊 *Total Articles:* ${articles.length}\n` +
                   `💡 *Tip:* Use .news <category> for specific news\n` +
                   `📌 *Categories:* business, sports, tech, health\n` +
                   `🌍 *Countries:* us, gb, in, ca, au, de\n\n` +
                   `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ GURU-TECH`;
    
    await conn.sendMessage(from, { text: footer }, { quoted: mek });
}

// Helper function to format time ago
function getTimeAgo(publishedAt) {
    if (!publishedAt) return 'Unknown time';
    
    const published = new Date(publishedAt);
    const now = new Date();
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Add command for different news categories
cmd({
    pattern: "category",
    alias: ["newscat", "categories"],
    desc: "Get news by category",
    category: "news",
    react: "📑",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    const categories = ['business', 'entertainment', 'health', 'science', 'sports', 'technology'];
    const countries = {
        'us': 'United States',
        'gb': 'United Kingdom', 
        'in': 'India',
        'ca': 'Canada',
        'au': 'Australia'
    };
    
    let msg = "📋 *Available News Categories*\n\n";
    msg += "┏━━━━━━━━━━━━━━━━━━\n";
    
    msg += "┃ *Categories:*\n";
    categories.forEach(cat => {
        msg += `┃ 📌 ${cat}\n`;
    });
    
    msg += "┃\n┃ *Countries:*\n";
    Object.entries(countries).forEach(([code, name]) => {
        msg += `┃ 🌍 ${code} - ${name}\n`;
    });
    
    msg += "┗━━━━━━━━━━━━━━━━━━\n\n";
    msg += "💡 *Usage:*\n";
    msg += "• .news technology\n";
    msg += "• .news business us\n";
    msg += "• .news covid india\n\n";
    msg += "> © GURU-TECH";
    
    await reply(msg);
});
