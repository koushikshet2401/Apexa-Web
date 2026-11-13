import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/prod-media-inventory-classified.json', 'utf8'));

console.log('Total items in inventory:', data.length);

const byTable = {};
data.forEach(item => {
  byTable[item.table] = (byTable[item.table] || 0) + 1;
});
console.log('\nBy Table:');
console.log(byTable);

const byType = {};
data.forEach(item => {
  byType[item.type] = (byType[item.type] || 0) + 1;
});
console.log('\nBy Type:');
console.log(byType);

console.log('\nItems marked KNOWN_BROKEN_HTTP404:');
data.filter(d => d.status === 'KNOWN_BROKEN_HTTP404').forEach(b => {
  console.log(`[${b.table}] ${b.parent} -> ${b.role} (${b.column}): ${b.currentUrl}`);
});

console.log('\nLocal Static Files:');
data.filter(d => d.type === 'LOCAL').forEach(b => {
  console.log(`[${b.table}] ${b.parent} -> ${b.role} (${b.column}): ${b.currentUrl}`);
});
