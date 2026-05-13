const fs = require('fs');
const zlib = require('zlib');

const docxPath = 'C:/Users/KVirata/Downloads/grove_help_spec.docx';
const outPath = 'C:/Users/KVirata/Desktop/sprout-garden/extracted_text.txt';

const buf = fs.readFileSync(docxPath);

function findZipEntry(buf, entryName) {
    const sig = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    const nameBytes = Buffer.from(entryName, 'utf8');

    let pos = 0;
    while (pos < buf.length - 30) {
        const sigIdx = buf.indexOf(sig, pos);
        if (sigIdx === -1) break;

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
                return compressedData;
            } else if (compression === 8) {
                return zlib.inflateRawSync(compressedData);
            }
        }

        pos = sigIdx + 4;
    }
    return null;
}

const xmlBuf = findZipEntry(buf, 'word/document.xml');
if (!xmlBuf) {
    fs.writeFileSync(outPath, 'ERROR: could not find word/document.xml in docx');
    process.exit(1);
}

const xmlStr = xmlBuf.toString('utf8');

// Extract paragraphs: split on </w:p> boundaries
const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
const paras = xmlStr.match(paraRegex) || [];
const lines = paras.map(p => {
    const tMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    return tMatches.map(m => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')).join('');
});

const fullText = lines.join('\n');
fs.writeFileSync(outPath, fullText, 'utf8');
fs.writeFileSync('C:/Users/KVirata/Desktop/sprout-garden/done.txt', 'Done. Lines: ' + lines.length + ' Chars: ' + fullText.length);
