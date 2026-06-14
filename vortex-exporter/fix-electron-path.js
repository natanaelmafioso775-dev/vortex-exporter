const fs = require('fs');
const path = require('path');
fs.writeFileSync(
  path.join(__dirname, 'node_modules', 'electron', 'path.txt'),
  'electron.exe',
  'utf-8'
);
console.log('path.txt fixed');