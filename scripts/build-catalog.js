import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const USD_RATE = 500;

const BUSINESS_FILES = [
  'cronos',
  'bodega-central',
  'dlm',
  'panes-macus',
  'mercadito-ahorro',
  'la-marina',
  'linea-callejon',
  'eme-boutique',
  'tu-kprichito',
  'amore',
  'cafeteria-d-leo',
  'al-carbon','dulce-momento',
  'heladeria-mk',
  'las-palmitas',
  'pizzeria-mm',
  'ferreguira',
  'los-llenik',
];

function read(file) {
  return JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
}

const businesses = read('businesses.json');
const products = BUSINESS_FILES.flatMap(id => read(`${id}.json`));

// ── 1. catalog.json (backward compat — se eliminará en una versión futura) ──
const catalog = { businesses, products };
writeFileSync(join(ROOT, 'public', 'data', 'catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');
console.log(`catalog.json — ${businesses.length} negocios, ${products.length} productos`);

// ── 2. businesses.json (standalone, para carga inicial) ──
writeFileSync(join(ROOT, 'public', 'data', 'businesses.json'), JSON.stringify(businesses, null, 2), 'utf8');
console.log(`businesses.json — ${businesses.length} negocios`);

// ── 3. search-index.json (todos los productos sin longDescription) ──
const searchIndex = products.map(({ longDescription: _ld, ...p }) => p);
writeFileSync(join(ROOT, 'public', 'data', 'search-index.json'), JSON.stringify(searchIndex, null, 2), 'utf8');
console.log(`search-index.json — ${searchIndex.length} productos`);

// ── 4. products/[id].json (uno por negocio, datos completos) ──
mkdirSync(join(ROOT, 'public', 'data', 'products'), { recursive: true });
for (const id of BUSINESS_FILES) {
  const bp = products.filter(p => p.businessId === id);
  writeFileSync(join(ROOT, 'public', 'data', 'products', `${id}.json`), JSON.stringify(bp, null, 2), 'utf8');
}
console.log(`products/ — ${BUSINESS_FILES.length} archivos (uno por negocio)`);

// ── 5. catalog-familia.json ──
const usdBusinessIds = new Set(
  businesses.filter(b => b.currency === 'USD').map(b => b.id)
);
const catalogFamilia = {
  businesses,
  products: products.map(p => {
    const isUsd = usdBusinessIds.has(p.businessId) || p.currency === 'USD';
    const toCup = (n) => isUsd ? n : Math.round((n / USD_RATE) * 100) / 100;
    return {
      ...p,
      price: toCup(p.price),
      ...(p.addons   ? { addons:   p.addons.map(a  => ({ ...a,  price: toCup(a.price)  })) } : {}),
      ...(p.packaging ? { packaging: p.packaging.map(pk => ({ ...pk, price: toCup(pk.price) })) } : {}),
    };
  }),
};
writeFileSync(join(ROOT, 'public', 'data', 'catalog-familia.json'), JSON.stringify(catalogFamilia, null, 2), 'utf8');
console.log(`catalog-familia.json — USD_RATE=${USD_RATE}`);
