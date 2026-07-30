const fs = require('fs');
const path = require('path');

const inventory = JSON.parse(fs.readFileSync('scripts/tool_inventory.json', 'utf-8'));

const categories = {};
for (const item of inventory) {
  const cat = item.category || 'unknown';
  if (!categories[cat]) categories[cat] = { total: 0, has_handler: 0, missing: 0 };
  categories[cat].total++;
  if (item.status === 'has_handler') categories[cat].has_handler++;
  else categories[cat].missing++;
}

console.log('=== Category Breakdown ===');
console.table(categories);
