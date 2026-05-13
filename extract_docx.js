const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Use built-in zlib approach via the unzipper or manual Buffer parsing
// .docx is just a ZIP file — use node's built-in capabilities

const docxPath = 'C:/Users/KVirata/Downloads/grove_help_spec.docx';
const outPath = 'C:/Users/KVirata/Desktop/sprout-garden/extracted_text.txt';

// Read the ZIP file as buffer
const buf = fs.readFileSync(docxPath);

// Find the word/document.xml entry manually using ZIP local file header signature
// ZIP local file header: PK\x03\x04
// We'll use a simple approach: find 'word/document.xml' in the buffer

function findZipEntry(buf, entryName) {
    const sig = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04
    const nameBytes = Buffer.from(entryName, 'utf8');

    let pos = 0;
    while (pos < buf.length - 30) {
        // Search for local file header signature
        const sigIdx = buf.indexOf(sig, pos);
        if (sigIdx === -1) break;

        // Parse local file header
        const compression = buf.readUInt16LE(sigIdx + 8);
        const compressedSize = buf.readUInt32LE(sigIdx + 18);
        const uncompressedSize = buf.readUInt32LE(sigIdx + 22);
        const fileNameLen = buf.readUInt16LE(sigIdx + 26);
        const extraLen = buf.readUInt16LE(sigIdx + 28);

        const fileName = buf.slice(sigIdx + 30, sigIdx + 30 + fileNameLen).toString('utf8');
        const dataStart = sigIdx + 30 + fileNameLen + extraLen;

        if (fileName === entryName) {
            const compressedData = buf.slice(dataStart, dataStart + compressedSize);
            if (compression === 0) {
                // Stored (no compression)
                return compressedData;
            } else if (compression === 8) {
                // Deflate
                const zlib = require('zlib');
                return zlib.inflateRawSync(compressedData);
            }
        }

        pos = sigIdx + 1;
    }
    return null;
}

const xmlBuf = findZipEntry(buf, 'word/document.xml');
if (!xmlBuf) {
    fs.writeFileSync(outPath, 'ERROR: could not find word/document.xml in docx');
    process.exit(1);
}

const xmlStr = xmlBuf.toString('utf8');

// Extract text from XML using regex on w:t elements
const matches = xmlStr.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
const texts = matches.map(m => {
    const inner = m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
    return inner;
});

// Group by paragraph: split on </w:p>
const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
const paras = xmlStr.match(paraRegex) || [];
const lines = paras.map(p => {
    const tMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    return tMatches.map(m => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')).join('');
});

const fullText = lines.join('\n');
fs.writeFileSync(outPath, fullText, 'utf8');

// Also write a summary to stdout via a file
fs.writeFileSync('C:/Users/KVirata/Desktop/sprout-garden/extract_done.txt', 'Done. Lines: ' + lines.length + ' Chars: ' + fullText.length);
