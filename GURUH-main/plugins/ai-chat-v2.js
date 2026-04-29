module.exports = {
    pattern: 'ai|chat|gpt|ask',
    desc: 'Advanced AI conversation with short-term memory',
    category: 'conversation',
    react: '🤖',

    async function(conn, mek, m, { from, q, sender, reply: taggedReplyFn }) {
        if (!q) return taggedReplyFn('Ask me anything!\nExample: .ai Explain quantum physics like I’m 5');

        try {
            // Simple in-memory history per user (you can later move to database)
            if (!global.aiHistory) global.aiHistory = new Map();
            const userId = sender;
            if (!global.aiHistory.has(userId)) {
                global.aiHistory.set(userId, [{
                    role: 'system',
                    content: 'You are GURU MD, a helpful, witty, maximally truthful AI created by GuruTech. Be concise, fun, use emojis sometimes.'
                }]);
            }

            const history = global.aiHistory.get(userId);
            history.push({ role: 'user', content: q });

            // Call to Grok / xAI API (using the correct endpoint)
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (process.env.XAI_API_KEY || 'your-key-here')
                },
                body: JSON.stringify({
                    model: 'grok-beta',
                    messages: history,
                    temperature: 0.75,
                    max_tokens: 700
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            if (!data.choices?.[0]?.message?.content) {
                throw new Error(data.error?.message || 'No response from AI');
            }

            const answer = data.choices[0].message.content.trim();

            // Send the reply using the passed taggedReplyFn (this uses your bot's tagging system)
            await taggedReplyFn(answer);

            // Save to history
            history.push({ role: 'assistant', content: answer });

            // Keep only last 10 messages + system prompt (memory efficient)
            if (history.length > 11) {
                history.splice(1, history.length - 11);
            }

        } catch (e) {
            console.error('AI command error:', e);
            // Use taggedReplyFn for error too – consistent with your bot
            await taggedReplyFn('AI is taking a quick nap... 😅\n' + (e.message || 'Unknown error'));
        }
    }
};
