const fs = require('fs');
const content = fs.readFileSync('src/lib/calculators/index.ts', 'utf8');
const calculators = [];
const blockRegex = /\{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)",\s*\n\s*description:\s*"([^"]+)",\s*\n\s*category:\s*"([^"]+)"/g;
let match;
while ((match = blockRegex.exec(content)) !== null) {
  calculators.push({ id: match[1], slug: match[2], title: match[3], description: match[4], category: match[5] });
}
fs.writeFileSync('/tmp/calculators-data.json', JSON.stringify(calculators));
console.log('Saved ' + calculators.length + ' calculators');
