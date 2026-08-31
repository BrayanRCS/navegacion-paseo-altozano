const fs = require('fs');
const path = require('path');

const docPath = path.join(__dirname, '..', 'DIRECTORIO_TIENDAS_PASEO_ALTOZANO.md');
const graphPath = path.join(__dirname, '..', 'mall_graph.json');

let doc = fs.readFileSync(docPath, 'utf8');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

const logoStores = new Set(graph.nodes.filter(n => n.logo).map(n => n.name.toLowerCase()));

// Replace lines with [ ] Pendiente if store name matches
const lines = doc.split('\n');
const updatedLines = lines.map(line => {
  if (line.includes('| [ ] Pendiente |')) {
    // extract store name between ** **
    const match = line.match(/\*\*(.*?)\*\*/);
    if (match) {
      const storeName = match[1].trim().toLowerCase();
      // Check if storeName is in logoStores or partial match
      let hasLogo = false;
      for (const s of logoStores) {
        if (s.includes(storeName) || storeName.includes(s)) {
          hasLogo = true;
          break;
        }
      }
      if (hasLogo) {
        return line.replace('| [ ] Pendiente |', '| [x] Recibido |');
      }
    }
  }
  return line;
});

fs.writeFileSync(docPath, updatedLines.join('\n'), 'utf8');
console.log('Updated DIRECTORIO_TIENDAS_PASEO_ALTOZANO.md with [x] Recibido!');
