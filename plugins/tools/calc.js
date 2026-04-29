// plugins/calc.js
const { cmd } = require('../command');

cmd({
    pattern: "calc ?(.*)",
    desc: "Calculate math expressions (e.g. .calc 2+3*4)",
    category: "utility",
    react: "🧮",
    filename: __filename
}, async (conn, mek, m, { reply, args }) => {
    try {
        const expression = args.join(' ').trim();
        if (!expression) return reply("Please provide a math expression!\nExample: .calc 2 + 3 * 4");

        // Very basic and safe eval alternative (no dangerous functions)
        const safeCalc = new Function('return ' + expression.replace(/[^0-9+\-*/(). ]/g, ''));

        const result = safeCalc();

        if (isNaN(result) || result === undefined) {
            return reply("Invalid expression!");
        }

        await reply(`*\( {expression}* = * \){result}*`);

    } catch (e) {
        console.error('[calc]', e);
        await reply("Invalid math expression! Please try again.\nExample: .calc (5+3)*2");
    }
});
