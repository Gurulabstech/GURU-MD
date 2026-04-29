const axios = require('axios');

module.exports = {
    name: "AI Chat Pro",
    alias: ["ai", "chat", "gpt", "ask", "brain", "bot"],
    desc: "AI-powered chat assistant",
    category: "AI",
    usage: ".ai <question>",
    react: "🤖",
    start: async (conn, m, { text, prefix, reply }) => {
        if (!text) return reply(`❌ Please ask a question!\n\nExample: ${prefix}ai What is the capital of France?`);

        try {
            reply('🤔 Thinking...');
            
            // Try multiple AI APIs with fallback
            let response = await fetchFromAPI(text);
            
            if (!response) {
                response = await fetchFromGemini(text);
            }
            
            if (!response) {
                response = await fetchFromLocalAI(text);
            }
            
            if (!response) {
                return reply('❌ AI service unavailable. Please try again later.');
            }
            
            const formattedResponse = `*🤖 AI Response*\n\n${response}\n\n_ᴳᵁᴿᵁᴹᴰ AI Assistant_`;
            
            // Split long messages
            if (formattedResponse.length > 4096) {
                const chunks = formattedResponse.match(/.{1,4096}/g);
                for (const chunk of chunks) {
                    await conn.sendMessage(m.from, { text: chunk }, { quoted: m });
                    await sleep(500);
                }
            } else {
                await conn.sendMessage(m.from, { text: formattedResponse }, { quoted: m });
            }
            
        } catch (error) {
            console.error('[AI Error]:', error);
            reply(`❌ AI chat failed: ${error.message}`);
        }
    }
};

async function fetchFromAPI(query) {
    try {
        const apis = [
            `https://api.akuari.my.id/ai/gpt?text=${encodeURIComponent(query)}`,
            `https://api.akuari.my.id/ai/chatgpt?query=${encodeURIComponent(query)}`
        ];
        
        for (const api of apis) {
            try {
                const res = await axios.get(api, { timeout: 10000 });
                if (res.data && (res.data.result || res.data.response || res.data.message)) {
                    return res.data.result || res.data.response || res.data.message;
                }
            } catch (e) {}
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function fetchFromGemini(query) {
    try {
        const res = await axios.get(`https://api.akuari.my.id/ai/gemini?text=${encodeURIComponent(query)}`, { timeout: 10000 });
        return res.data.result || null;
    } catch (e) {
        return null;
    }
}

async function fetchFromLocalAI(query) {
    try {
        const responses = [
            `I'm not sure about that. Can you ask me something else?`,
            `That's an interesting question! Let me think about it.`,
            `I'm still learning. Could you rephrase that?`,
            `I'll try my best to answer: ${query} is a complex topic.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    } catch (e) {
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
