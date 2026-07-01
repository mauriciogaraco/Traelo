import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const USD_RATE = 500;

const BUSINESS_FILES = [
  'bodega-central',
  'dlm',
  'panes-macus',
  'mercadito-ahorro',
  'la-marina',
  'linea-callejon',
  'al-carbon',
  'eme-boutique',
];

function read(file) {
  return JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
}

const businesses = read('businesses.json');
const products = BUSINESS_FILES.flatMap(id => read(`${id}.json`));

const catalog = { businesses, products };
writeFileSync(
  join(ROOT, 'public', 'data', 'catalog.json'),
  JSON.stringify(catalog, null, 2),
  'utf8'
);
console.log(`catalog.json — ${businesses.length} negocios, ${products.length} productos`);

const usdBusinessIds = new Set(
  businesses.filter(b => b.currency === 'USD').map(b => b.id)
);

const catalogFamilia = {
  businesses,
  products: products.map(p => ({
    ...p,
    price: usdBusinessIds.has(p.businessId)
      ? p.price
      : Math.round((p.price / USD_RATE) * 100) / 100,
  })),
};
writeFileSync(
  join(ROOT, 'public', 'data', 'catalog-familia.json'),
  JSON.stringify(catalogFamilia, null, 2),
  'utf8'
);
console.log(`catalog-familia.json — USD_RATE=${USD_RATE}`);
