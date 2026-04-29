// plugins/smartReplyPro.js
module.exports = {
    name: 'SmartReplyPro',
    version: '3.0.0',
    author: 'ᴳᵁᴿᵁᴹᴰ Team',
    description: 'Advanced smart replies with context and learning',
    
    init() {
        console.log('🧠 SmartReplyPro Plugin Loaded');
        this.userProfiles = new Map();
        this.conversationHistory = new Map();
        this.learnedResponses = new Map();
        this.loadKnowledgeBase();
    },
    
    events: {
        'messages.upsert': async ({ conn, mek, from, body, sender, isGroup }) => {
            // Skip commands and bot's own messages
            if (mek.key.fromMe || body?.startsWith(config.PREFIX)) return;
            
            // Update user profile
            this.updateUserProfile(sender, body);
            
            // Get intelligent reply
            const reply = await this.generateIntelligentReply(sender, body, from, isGroup);
            
            // Send reply with probability (50% chance for non-essential)
            if (reply && (this.isImportantMessage(body) || Math.random() > 0.5)) {
                await conn.sendMessage(from, {
                    text: `ᴳᵁᴿᵁᴹᴰ\n\n${reply}`
                });
                
                // Learn from this interaction
                this.learnFromInteraction(sender, body, reply);
            }
        }
    },
    
    updateUserProfile(userId, message) {
        if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
                messageCount: 0,
                topics: new Set(),
                mood: 'neutral',
                lastActive: new Date(),
                preferences: {}
            });
        }
        
        const profile = this.userProfiles.get(userId);
        profile.messageCount++;
        profile.lastActive = new Date();
        
        // Analyze message for topics
        const topics = this.extractTopics(message);
        topics.forEach(topic => profile.topics.add(topic));
        
        // Analyze mood
        profile.mood = this.analyzeMood(message, profile.mood);
        
        // Update conversation history
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, []);
        }
        
        const history = this.conversationHistory.get(userId);
        history.push({ role: 'user', content: message, time: new Date() });
        
        // Keep only last 20 messages
        if (history.length > 20) {
            history.shift();
        }
    },
    
    async generateIntelligentReply(userId, message, chatId, isGroup) {
        const messageLower = message.toLowerCase();
        const profile = this.userProfiles.get(userId) || {};
        const history = this.conversationHistory.get(userId) || [];
        
        // Check for learned responses
        const learnedReply = this.getLearnedResponse(messageLower);
        if (learnedReply) return learnedReply;
        
        // Context-aware replies
        const lastMessages = history.slice(-3).map(h => h.content).join(' ');
        
        // Greetings
        if (this.isGreeting(messageLower)) {
            const greetings = [
                `Hey there! ${profile.messageCount > 1 ? 'Good to see you again!' : 'Nice to meet you!'}`,
                `Hello! ${profile.topics.size > 0 ? `Still into ${Array.from(profile.topics).pop()}?` : "How's your day?"}`,
                `What's up! ᴳᵁᴿᵁᴹᴰ's here for you! 🔥`,
                `Yo! Ready for some magic? ✨`
            ];
            return this.getRandom(greetings);
        }
        
        // Questions
        if (message.includes('?')) {
            const questionReplies = [
                `Great question! Let me think about that... 🤔`,
                `Interesting! What do you think about it?`,
                `Hmm, that's a good point. Let's explore it together!`,
                `I love questions like this! My circuits are buzzing! ⚡`
            ];
            return this.getRandom(questionReplies);
        }
        
        // Personal queries
        if (messageLower.includes('how are you') || messageLower.includes('hru')) {
            return `ᴳᵁᴿᵁᴿᴹᴰ's feeling ${profile.mood === 'happy' ? 'fantastic' : 'great'}! How about you?`;
        }
        
        // Thank you
        if (messageLower.includes('thank') || messageLower.includes('thanks')) {
            const thanksReplies = [
                `You're welcome! Always here to help! 🙌`,
                `Anytime! That's what ᴳᵁᴿᵁᴹᴰ is for! 😎`,
                `No problem! Hit me up whenever! 💯`,
                `Glad I could help! You're awesome! 🌟`
            ];
            return this.getRandom(thanksReplies);
        }
        
        // Goodbye
        if (messageLower.includes('bye') || messageLower.includes('goodbye') || messageLower.includes('gn')) {
            return `Take care! ${isGroup ? 'See you in the group!' : 'Chat soon!'} 👋`;
        }
        
        // Group-specific responses
        if (isGroup) {
            if (messageLower.includes('@everyone') || messageLower.includes('@all')) {
                return `📢 Attention everyone! Something important?`;
            }
            
            if (messageLower.includes('welcome') || messageLower.includes('new')) {
                return `🎉 Welcome to the party!`;
            }
        }
        
        // Contextual reply based on history
        if (lastMessages.includes('music') || lastMessages.includes('song')) {
            return `🎵 Talking about music? What's your favorite genre?`;
        }
        
        if (lastMessages.includes('food') || lastMessages.includes('eat')) {
            return `🍕 Food talk! I'm getting hungry just thinking about it!`;
        }
        
        if (lastMessages.includes('game') || lastMessages.includes('play')) {
            return `🎮 Gaming time! What are you playing these days?`;
        }
        
        // Time-based responses
        const hour = new Date().getHours();
        if (hour < 12) {
            return `Good morning! Ready to conquer the day? ☀️`;
        } else if (hour < 18) {
            return `Good afternoon! How's your day going? 🌤️`;
        } else {
            return `Good evening! Winding down for the day? 🌙`;
        }
    },
    
    isGreeting(message) {
        const greetings = ['hi', 'hello', 'hey', 'sup', 'yo', 'hola', 'namaste'];
        return greetings.some(greet => message.includes(greet));
    },
    
    isImportantMessage(message) {
        const importantKeywords = ['help', 'emergency', 'urgent', 'important', '?', 'how to', 'what is'];
        return importantKeywords.some(keyword => message.toLowerCase().includes(keyword));
    },
    
    extractTopics(message) {
        const topics = [];
        const topicMap = {
            'music': ['song', 'music', 'artist', 'band', 'album'],
            'food': ['eat', 'food', 'hungry', 'restaurant', 'cook'],
            'sports': ['game', 'play', 'team', 'score', 'win'],
            'tech': ['phone', 'computer', 'app', 'software', 'code'],
            'movies': ['movie', 'film', 'watch', 'cinema', 'actor']
        };
        
        message = message.toLowerCase();
        Object.entries(topicMap).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => message.includes(keyword))) {
                topics.push(topic);
            }
        });
        
        return topics;
    },
    
    analyzeMood(message, previousMood) {
        message = message.toLowerCase();
        
        const positiveWords = ['happy', 'good', 'great', 'awesome', 'love', 'excited', 'amazing'];
        const negativeWords = ['sad', 'bad', 'angry', 'hate', 'tired', 'bored', 'upset'];
        
        const positiveCount = positiveWords.filter(word => message.includes(word)).length;
        const negativeCount = negativeWords.filter(word => message.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'happy';
        if (negativeCount > positiveCount) return 'sad';
        return previousMood;
    },
    
    getLearnedResponse(message) {
        // Check for exact matches first
        for (const [pattern, response] of this.learnedResponses.entries()) {
            if (message.includes(pattern)) {
                return response;
            }
        }
        return null;
    },
    
    learnFromInteraction(userId, userMessage, botReply) {
        // Extract key phrases from user message
        const words = userMessage.toLowerCase().split(' ').filter(word => word.length > 3);
        
        words.forEach(word => {
            if (!this.learnedResponses.has(word)) {
                this.learnedResponses.set(word, botReply);
            }
        });
        
        // Save to file periodically
        this.saveKnowledgeBase();
    },
    
    loadKnowledgeBase() {
        try {
            const fs = require('fs');
            const path = require('path');
            const knowledgeFile = path.join(__dirname, '..', 'data', 'smart_reply_kb.json');
            
            if (fs.existsSync(knowledgeFile)) {
                const data = JSON.parse(fs.readFileSync(knowledgeFile, 'utf8'));
                this.learnedResponses = new Map(Object.entries(data.learnedResponses || {}));
                console.log('📚 Loaded knowledge base with', this.learnedResponses.size, 'responses');
            }
        } catch (error) {
            console.error('Failed to load knowledge base:', error);
        }
    },
    
    saveKnowledgeBase() {
        try {
            const fs = require('fs');
            const path = require('path');
            const dataDir = path.join(__dirname, '..', 'data');
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            const knowledgeFile = path.join(dataDir, 'smart_reply_kb.json');
            const data = {
                learnedResponses: Object.fromEntries(this.learnedResponses),
                savedAt: new Date().toISOString()
            };
            
            fs.writeFileSync(knowledgeFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save knowledge base:', error);
        }
    },
    
    getRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
};
