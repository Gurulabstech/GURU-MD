const { cmd } = require('../command');

cmd({
    pattern: "obfuscate",
    alias: ["obf", "securejs"],
    desc: "Obfuscate JavaScript code",
    react: "🔒",
    category: "utility",
    use: 'Reply to a JavaScript message with .obfuscate',
    filename: __filename
},
async (conn, mek, m, { from, reply, quoted }) => {
    try {
        // Try to load the obfuscator package
        let JavaScriptObfuscator;
        try {
            JavaScriptObfuscator = require('javascript-obfuscator');
        } catch (e) {
            return reply(
                "❌ Package not installed!\n\n" +
                "Run this command to install:\n" +
                "```bash\nnpm install javascript-obfuscator\n```" +
                "\nThen restart your bot."
            );
        }

        // Check if it's a reply
        if (!quoted || !quoted.text) {
            return reply("❌ Please reply to a JavaScript code message");
        }

        const originalCode = quoted.text;
        
        // Obfuscation options (high security)
        const obfuscationOptions = {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            numbersToExpressions: true,
            simplify: true,
            shuffleStringArray: true,
            splitStrings: true,
            stringArrayThreshold: 0.8,
            rotateStringArray: true,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            identifierNamesGenerator: 'hexadecimal',
            selfDefending: true,
            disableConsoleOutput: false,
            debugProtection: false,
            debugProtectionInterval: false,
            transformObjectKeys: true,
            unicodeEscapeSequence: true
        };

        // Obfuscate the code
        const obfuscatedResult = JavaScriptObfuscator.obfuscate(originalCode, obfuscationOptions);
        const obfuscatedCode = obfuscatedResult.getObfuscatedCode();

        // Create before/after comparison
        const comparison = `
📜 *ORIGINAL CODE (${formatBytes(originalCode.length)}):*
\`\`\`javascript
${truncate(originalCode, 200)}
\`\`\`

🔒 *OBFUSCATED CODE (${formatBytes(obfuscatedCode.length)}):*
\`\`\`javascript
${truncate(obfuscatedCode, 300)}
\`\`\`

✅ Obfuscation complete! Sending secured code file...
`.trim();

        // Send the comparison as a message
        await reply(comparison);

        // Send the full obfuscated code as a text file
        await conn.sendMessage(
            from, 
            {
                document: Buffer.from(obfuscatedCode),
                fileName: 'secured_code.js',
                mimetype: 'application/javascript',
                caption: `🔒 Secured JavaScript Code | Obfuscated by YOU 🫵🏻`
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error("Obfuscation Error:", e);
        reply(`❌ Obfuscation failed: ${e.message}`);
    }
});

// Helper function to truncate long text
function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...\n\n⚠️ TRUNCATED - DOWNLOAD FULL FILE BELOW';
}

// Helper function to format bytes
function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}
