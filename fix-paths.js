const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        filelist = walkSync(path.join(dir, file), filelist);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync(__dirname);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('/assets/logo.png')) {
    content = content.replace(/\/assets\/logo\.png/g, './assets/logo.png');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
