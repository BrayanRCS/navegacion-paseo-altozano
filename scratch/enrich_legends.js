const fs = require('fs');
const path = require('path');

const legendsPath = path.join(__dirname, '..', 'gemini-code-1787086839436.json');
const graphPath = path.join(__dirname, '..', 'mall_graph.json');

const legends = JSON.parse(fs.readFileSync(legendsPath, 'utf8'));
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

// Build map from graph: [level_storeId] -> logo
const logoMap = new Map();
graph.nodes.forEach(n => {
  if (n.logo) {
    const key = `${n.level}_${n.name.toLowerCase()}`;
    logoMap.set(key, { logo: n.logo, logo_white: n.logo_white, logo_folder: n.logo_folder });
  }
});

for (const levelKey in legends.mall_legends) {
  const levelObj = legends.mall_legends[levelKey];
  const lvlNum = levelObj.level;
  
  ['stores', 'islands', 'restaurants'].forEach(category => {
    if (Array.isArray(levelObj[category])) {
      levelObj[category].forEach(item => {
        const key = `${lvlNum}_${item.name.toLowerCase()}`;
        // Also try matching by name only
        let match = logoMap.get(key);
        if (!match) {
          for (const [k, v] of logoMap.entries()) {
            if (k.endsWith(`_${item.name.toLowerCase()}`)) {
              match = v;
              break;
            }
          }
        }
        if (match) {
          item.logo = match.logo;
          item.logo_white = match.logo_white;
        }
      });
    }
  });
}

fs.writeFileSync(legendsPath, JSON.stringify(legends, null, 2), 'utf8');
console.log('Updated gemini-code-1787086839436.json with logos successfully!');
