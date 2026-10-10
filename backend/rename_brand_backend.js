const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/STAY Q/g, 'STAYQ');
  content = content.replace(/Stay Q/g, 'StayQ');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated brand name in backend:', filePath);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'dist', 'node_modules'].includes(entry.name)) {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.json'))) {
      replaceInFile(fullPath);
    }
  }
}

console.log('Renaming Stay Q -> StayQ in backend/src...');
walkDir('d:/Stay Q/backend/src');
console.log('Backend brand normalization completed!');
