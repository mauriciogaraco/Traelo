import type { CatalogBusiness, CatalogCategory, CatalogProduct } from '../types/backend/catalog';

export function makeBusiness(overrides: Partial<CatalogBusiness> = {}): CatalogBusiness {
  return {
    id: 'biz-1',
    name: 'Pizzería M&M',
    phone: '555',
    address: 'Calle 1',
    acceptingOrders: true,
    isOpenNow: true,
    logoUrl: null,
    hours: [],
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: 'prod-1',
    businessId: 'biz-1',
    name: 'Pizza familiar',
    description: null,
    category: null,
    categoryId: null,
    categoryName: null,
    price: 500,
    effectivePrice: 500,
    offer: null,
    imageUrl: null,
    lowStock: false,
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<CatalogCategory> = {}): CatalogCategory {
  return {
    id: 'cat-1',
    name: 'Comida',
    slug: 'comida',
    icon: null,
    imageUrl: null,
    imageBlurhash: null,
    sortOrder: 0,
    ...overrides,
  };
}

