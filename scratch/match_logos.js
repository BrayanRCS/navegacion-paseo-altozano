const fs = require('fs');
const path = require('path');

const graphPath = path.join(__dirname, '..', 'mall_graph.json');
const logosDir = path.join(__dirname, '..', 'assets', 'logos');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

const logoFolders = fs.readdirSync(logosDir).filter(f => fs.statSync(path.join(logosDir, f)).isDirectory());

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ''); // alphanumeric only
}

const folderMap = new Map();
logoFolders.forEach(f => {
  folderMap.set(normalize(f), f);
});

// Custom aliases for edge cases
const aliases = {
  [normalize('Carl\'s Jr.')]: 'Carl\'s Jr',
  [normalize('Carls Jr')]: 'Carl\'s Jr',
  [normalize('Jimenez')]: 'Jiménez+',
  [normalize('Jiménez+')]: 'Jiménez+',
  [normalize('Jimenez+')]: 'Jiménez+',
  [normalize('Adidas')]: 'Adidas Performance',
  [normalize('Liverpool Planta Baja')]: 'Liverpool',
  [normalize('Liverpool Nivel 1')]: 'Liverpool',
  [normalize('Liverpool Nivel 2')]: 'Liverpool',
  [normalize('H&M Nivel 1')]: 'H&M',
  [normalize('H&M Planta Baja')]: 'H&M',
  [normalize('La Casa de las Carcasas')]: 'La Casa de las Carcasas',
  [normalize('Casa Carcasa')]: 'Casa Carcasa',
  [normalize('Fame')]: 'Fame - Showroom Fame',
  [normalize('Showroom Fame')]: 'Fame - Showroom Fame',
  [normalize('Opticas Lux')]: 'Ópticas Lux',
  [normalize('Opticas Kauffman')]: 'Ópticas Kauffman',
  [normalize('Taller Creativo de Oscar Torres')]: 'Taller Creativo Oscar Torres',
  [normalize('Obey Yourr Body')]: 'Obey Your Body',
  [normalize('UNAGI Teppan-Yaki & Sushi Bar')]: 'UNAGI Sushi Bar',
};

let matchedCount = 0;
let unmatchedStores = [];

graph.nodes.forEach(node => {
  if (['store', 'anchor_store', 'island', 'restaurant'].includes(node.type) && node.name) {
    const norm = normalize(node.name);
    let matchedFolder = aliases[norm] || folderMap.get(norm);
    
    // Fuzzy matching if not found
    if (!matchedFolder) {
      for (const [fNorm, fName] of folderMap.entries()) {
        if (norm.includes(fNorm) || fNorm.includes(norm)) {
          matchedFolder = fName;
          break;
        }
      }
    }

    if (matchedFolder) {
      const folderPath = path.join(logosDir, matchedFolder);
      const colorSvg = path.join(folderPath, 'color.svg');
      const whiteSvg = path.join(folderPath, 'blanco.svg');
      const logoPng = path.join(folderPath, 'color.png');
      
      let relLogo = null;
      let relWhiteLogo = null;
      if (fs.existsSync(colorSvg)) relLogo = `assets/logos/${encodeURIComponent(matchedFolder)}/color.svg`;
      else if (fs.existsSync(logoPng)) relLogo = `assets/logos/${encodeURIComponent(matchedFolder)}/color.png`;

      if (fs.existsSync(whiteSvg)) relWhiteLogo = `assets/logos/${encodeURIComponent(matchedFolder)}/blanco.svg`;

      node.logo = relLogo;
      node.logo_white = relWhiteLogo;
      node.logo_folder = matchedFolder;
      matchedCount++;
    } else {
      unmatchedStores.push({ id: node.id, name: node.name, level: node.level });
    }
  }
});

console.log(`Matched ${matchedCount} nodes with logos.`);
console.log(`Unmatched stores count: ${unmatchedStores.length}`);
if (unmatchedStores.length > 0) {
  console.log('Unmatched:', JSON.stringify(unmatchedStores, null, 2));
}

// Write back updated graph
fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf8');
console.log('Updated mall_graph.json successfully!');
