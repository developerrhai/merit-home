const fs = require('fs');
const path = require('path');

const dir1 = 'C:\\Users\\admin\\Desktop\\freelance\\merit-home';
const dir2 = 'C:\\Users\\admin\\Desktop\\arise-academy';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next') && !file.includes('recordings')) {
        results = results.concat(walk(file));
      }
    } else {
      // Exclude binary / build files
      if (!file.endsWith('.log') && !file.endsWith('.pem') && !file.endsWith('.sql') && !file.includes('.tsbuildinfo')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files1 = walk(dir1);
const files2 = walk(dir2);

const rel1 = files1.map(f => path.relative(dir1, f));
const rel2 = files2.map(f => path.relative(dir2, f));

const onlyIn1 = rel1.filter(f => !rel2.includes(f));
const onlyIn2 = rel2.filter(f => !rel1.includes(f));
const common = rel1.filter(f => rel2.includes(f));

console.log("=== FILES ONLY IN MERIT HOME ===");
console.log(onlyIn1.length > 0 ? onlyIn1.join('\n') : "None");
console.log("\n=== FILES ONLY IN ARISE ACADEMY (Bright Classes) ===");
console.log(onlyIn2.length > 0 ? onlyIn2.join('\n') : "None");

let diffCount = 0;
let logicDiffs = [];

for (const f of common) {
  try {
    let c1 = fs.readFileSync(path.join(dir1, f), 'utf-8');
    let c2 = fs.readFileSync(path.join(dir2, f), 'utf-8');

    // Ignore name and domain replacements roughly
    c1 = c1.replace(/merit home/gi, 'XXX').replace(/bright classes/gi, 'XXX').replace(/arise academy/gi, 'XXX');
    c2 = c2.replace(/merit home/gi, 'XXX').replace(/bright classes/gi, 'XXX').replace(/arise academy/gi, 'XXX');
    c1 = c1.replace(/merithome/gi, 'XXX').replace(/brightclasses/gi, 'XXX').replace(/ariseacademy/gi, 'XXX');
    c2 = c2.replace(/merithome/gi, 'XXX').replace(/brightclasses/gi, 'XXX').replace(/ariseacademy/gi, 'XXX');
    c1 = c1.replace(/merit/gi, 'XXX').replace(/bright/gi, 'XXX').replace(/arise/gi, 'XXX');
    c2 = c2.replace(/merit/gi, 'XXX').replace(/bright/gi, 'XXX').replace(/arise/gi, 'XXX');
    // Also API domains
    c1 = c1.replace(/institute-api.rhaitech.online/gi, 'XXX').replace(/bright-classes.vercel.app/gi, 'XXX').replace(/api.ariseneet.online/gi, 'XXX').replace(/ariseneet.online/gi, 'XXX');
    c2 = c2.replace(/institute-api.rhaitech.online/gi, 'XXX').replace(/bright-classes.vercel.app/gi, 'XXX').replace(/api.ariseneet.online/gi, 'XXX').replace(/ariseneet.online/gi, 'XXX');

    // Basic normalization of whitespaces
    c1 = c1.replace(/\s+/g, ' ').trim();
    c2 = c2.replace(/\s+/g, ' ').trim();

    if (c1 !== c2) {
      diffCount++;
      logicDiffs.push(f);
    }
  } catch (err) {
    // skip non-text files or read errors
  }
}

console.log(`\n=== FOUND ${diffCount} FILES WITH POTENTIAL CODE DIFFERENCES ===`);
console.log(logicDiffs.join('\n'));
