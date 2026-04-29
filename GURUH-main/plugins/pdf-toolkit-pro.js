const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const Jimp = require('jimp');

module.exports = {
    name: "PDF Toolkit Pro",
    alias: ["pdf", "topdf", "pdfmerge", "pdfsplit", "pdfcompress", "pdfprotect", "pdfunlock"],
    desc: "Advanced PDF manipulation tools",
    category: "Tools",
    usage: ".pdf <command> (reply to media)",
    react: "📄",
    start: async (conn, m, { text, prefix, reply, quoted, args }) => {
        if (!text) return reply(`❌ Please specify PDF command!\n\n*Commands:*\n▸ topdf - Convert image to PDF\n▸ pdfmerge - Merge multiple PDFs\n▸ pdfsplit - Split PDF pages\n▸ pdfcompress - Compress PDF\n▸ pdfprotect - Add password\n\nExample: ${prefix}topdf (reply to image)`);

        const subCmd = args[0]?.toLowerCase();
        
        try {
            if (subCmd === 'topdf') {
                await convertToPDF(conn, m, quoted, reply);
            }
            else if (subCmd === 'pdfmerge') {
                await mergePDFs(conn, m, quoted, reply);
            }
            else {
                reply('❌ PDF command not implemented yet!');
            }
        } catch (error) {
            console.error('[PDF Error]:', error);
            reply(`❌ PDF operation failed: ${error.message}`);
        }
    }
};

async function convertToPDF(conn, m, quoted, reply) {
    if (!quoted) return reply('❌ Reply to an image!');
    
    let imageMsg = quoted.message?.imageMessage;
    if (!imageMsg) return reply('❌ Reply to an image only!');
    
    reply('📄 Converting image to PDF...');
    
    try {
        // Download image
        const buffer = await quoted.download();
        
        // Create PDF
        const doc = new PDFDocument();
        const tempPath = path.join(os.tmpdir(), `doc_${Date.now()}.pdf`);
        const writeStream = fs.createWriteStream(tempPath);
        
        doc.pipe(writeStream);
        
        // Load image and add to PDF
        const image = await Jimp.read(buffer);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        
        // Add to PDF with proper dimensions
        doc.image(buffer, 0, 0, {
            fit: [doc.page.width, doc.page.height],
            align: 'center',
            valign: 'center'
        });
        
        doc.end();
        
        writeStream.on('finish', async () => {
            await conn.sendMessage(m.from, {
                document: fs.readFileSync(tempPath),
                mimetype: 'application/pdf',
                fileName: 'GURU_MD_Converted.pdf',
                caption: '📄 *Image converted to PDF*\n\nᴳᵁᴿᵁᴹᴰ'
            }, { quoted: m });
            
            fs.unlinkSync(tempPath);
        });
        
    } catch (error) {
        reply(`❌ PDF conversion failed: ${error.message}`);
    }
}

async function mergePDFs(conn, m, quoted, reply) {
    reply('🔄 PDF merge feature coming soon...');
}
