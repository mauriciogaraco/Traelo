import type { CatalogBusiness, CatalogCategory, CatalogProduct } from '../../types/backend/catalog';

/**
 * Búsqueda local tolerante — checklist §9: "pizza"/"pizz"/"piza" deben encontrarse
 * entre sí. Nada de esto pega al servidor; opera solo sobre lo que ya está en el store.
 */

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Distancia de edición mínima para hacer calzar `pattern` contra ALGUNA subcadena de
 * `text` (no contra `text` completo) — permite que "piza" calce dentro de "pizzeria"
 * sin penalizar el resto de la palabra. DP estándar de "approximate substring search":
 * la primera fila es 0 (empezar en cualquier posición de `text` es gratis) y la
 * respuesta es el mínimo de la última fila (terminar en cualquier posición es gratis).
 */
function fuzzySubstringDistance(pattern: string, text: string): number {
  const m = pattern.length;
  const n = text.length;
  if (m === 0) return 0;

  let prevRow = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const currentRow = new Array(n + 1).fill(0);
    currentRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = pattern[i - 1] === text[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(prevRow[j] + 1, currentRow[j - 1] + 1, prevRow[j - 1] + cost);
    }
    prevRow = currentRow;
  }
  return Math.min(...prevRow);
}

/**
 * true si `query` aparece en `text` tolerando typos pequeños (1-2 caracteres) — checklist
 * §9: "pizza"/"pizz"/"piza" deben encontrarse entre sí, y calzar aunque `text` sea más
 * largo ("piza" dentro de "Pizzería M&M").
 */
export function fuzzyIncludes(text: string, query: string): boolean {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  if (normalizedText.includes(normalizedQuery)) return true;

  const threshold = normalizedQuery.length <= 4 ? 1 : 2;
  return fuzzySubstringDistance(normalizedQuery, normalizedText) <= threshold;
}

export type CatalogSearchResult = {
  categories: CatalogCategory[];
  businesses: CatalogBusiness[];
  products: CatalogProduct[];
};

export function searchCatalog(
  query: string,
  source: { categories: CatalogCategory[]; businesses: CatalogBusiness[]; products: CatalogProduct[] },
): CatalogSearchResult {
  const trimmed = query.trim();
  if (!trimmed) return { categories: [], businesses: [], products: [] };

  return {
    categories: source.categories.filter((c) => fuzzyIncludes(c.name, trimmed)),
    businesses: source.businesses.filter(
      (b) => fuzzyIncludes(b.name, trimmed) || fuzzyIncludes(b.address, trimmed),
    ),
    products: source.products.filter(
      (p) => fuzzyIncludes(p.name, trimmed) || (p.categoryName ? fuzzyIncludes(p.categoryName, trimmed) : false),
    ),
  };
}
