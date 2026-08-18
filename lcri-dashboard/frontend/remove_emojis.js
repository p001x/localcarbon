const fs = require('fs');
const path = require('path');

function removeEmojis(text) {
    // Regex for emoji ranges (including many symbols used as emojis)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B50}]|[\u{1F004}]|[\u{1F0CF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}-\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{FE0F}]|[\u{200D}]/gu;
    
    let cleaned = text.replace(emojiRegex, '');
    
    // Also remove specific icons found in the grep output just to be safe
    const specificEmojis = ['✅', '📊', '⏱️', '🏠', '📍', '🌱', '🏛️', '📓', '🔮', '🗺️', '📖', '🗂️', '🌿', '🇷🇼', '💾', '🗑️', '🌍', 'ℹ️', '💰', '🌳', '📈', '⚠️', '🚨', '🏆', '⏳', '🛡️', '🌴', '🐘', '📐', '🪵', '💨', '⚖️', '🤖', '📄'];
    specificEmojis.forEach(e => {
        cleaned = cleaned.split(e).join('');
    });
    
    return cleaned;
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const newContent = removeEmojis(content);
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log('Cleaned ' + file);
            }
        }
    }
}

const srcDir = path.join(__dirname, 'src');
processDir(srcDir);
console.log('Done');
