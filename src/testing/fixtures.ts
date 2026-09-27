import type { CatalogBusiness, CatalogCategory, CatalogProduct } from '../types/backend/catalog';
import type { Order } from '../types/backend/order';
import type { OrderTracking } from '../types/backend/tracking';

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

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    orderNumber: 1234,
    customerName: 'Ana',
    customerAddress: 'Calle 23',
    addressReference: null,
    customerPhone: '55501234',
    deliveryFee: 250,
    status: 'PENDING',
    orderDate: '2026-09-18T10:00:00.000Z',
    assignedAt: null,
    completedAt: null,
    cancelledAt: null,
    delivererId: null,
    delivererName: null,
    registeredByUserId: null,
    registeredByName: null,
    customerId: 'cust-1',
    source: 'APP',
    raffleNumber: null,
    productsTotal: 1000,
    platformFee: 50,
    total: 1300,
    traeloEarning: 0,
    traeloDeliveryShare: 0,
    delivererEarning: 0,
    businesses: [],
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
    ...overrides,
  };
}

/** Tracking de un pedido ASSIGNED sin ubicación todavía (el caso base); pisar lo que haga falta. */
export function makeTracking(overrides: Partial<OrderTracking> = {}): OrderTracking {
  return {
    orderId: 'o1',
    orderNumber: 1234,
    status: 'ASSIGNED',
    trackingActive: true,
    serverTime: '2026-09-19T12:00:00.000Z',
    deliverer: { name: 'Saúl' },
    location: null,
    route: null,
    destination: { address: 'Calle 23 entre 10 y 12', reference: null, latitude: null, longitude: null },
    ...overrides,
  };
}
