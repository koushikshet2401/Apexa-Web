import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/prod-media-inventory-classified.json', 'utf8'));

const localItems = data.filter(d => d.type === 'LOCAL');
console.log(`Checking ${localItems.length} local file references...`);

const uniqueLocalPaths = [...new Set(localItems.map(d => d.currentUrl))];

uniqueLocalPaths.forEach(relPath => {
  const cleanPath = relPath.replace(/^\/+/, '');
  const fullPath = path.resolve('public', cleanPath);
  const exists = fs.existsSync(fullPath);
  const size = exists ? fs.statSync(fullPath).size : 0;
  console.log(`[${exists ? 'EXISTS (' + (size / 1024).toFixed(1) + ' KB)' : 'MISSING'}] public/${cleanPath}`);
});
