/** DTOs de /api/v1/catalog — ver docs/BACKEND_API.md §2. */

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  imageBlurhash: string | null;
  sortOrder: number;
};

export type CatalogBusinessHours = {
  dayOfWeek: number; // 0=domingo..6=sábado
  openTime: string; // "HH:mm"
  closeTime: string;
  closed: boolean;
};

export type CatalogBusinessClosure = {
  date: string; // "YYYY-MM-DD"
  reason: string | null;
};

export type CatalogBusiness = {
  id: string;
  name: string;
  phone: string;
  address: string;
  acceptingOrders: boolean;
  isOpenNow: boolean;
  logoUrl: string | null;
  /** Placeholder borroso mientras carga logoUrl. Opcional: catálogos cacheados de antes no lo traen. */
  logoBlurhash?: string | null;
  /** Fecha de alta del negocio en Tráelo (ISO). Opcional: catálogos cacheados de antes de este campo no lo traen. */
  joinedAt?: string;
  hours: CatalogBusinessHours[];
  closures?: CatalogBusinessClosure[]; // presente solo en /bootstrap
};

export type CatalogProductOffer = {
  id: string;
  price: number;
  /** Cuándo arrancó la oferta (ISO). Opcional: catálogos cacheados de antes de este campo no lo traen. */
  startsAt?: string;
  endsAt: string;
};

/** Opción de empaque del catálogo (Product.packaging) — ver docs/BACKEND_API.md. */
export type CatalogPackagingOption = {
  name: string;
  price: number;
  /** Sin ella: un empaque por unidad. Con ella: uno cada `capacity` unidades, redondeando hacia arriba. */
  capacity?: number;
};

export type CatalogProduct = {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  category: string | null;
  categoryId: string | null;
  categoryName: string | null;
  price: number | null;
  effectivePrice: number | null;
  offer: CatalogProductOffer | null;
  imageUrl: string | null;
  /** Placeholder borroso mientras carga imageUrl. Opcional: ver CatalogBusiness.logoBlurhash. */
  imageBlurhash?: string | null;
  lowStock: boolean;
  /** Opciones de empaque disponibles. Opcional/vacío: sin empaque para este producto. El costo/capacity siempre se confirman en el servidor al pedir. */
  packaging?: CatalogPackagingOption[] | null;
  /** "Ofertas destacadas" del Home — lo marca un OWNER/ADMIN a mano. Opcional: catálogos cacheados de antes de este campo no lo traen (equivale a false). */
  featured?: boolean;
  /**
   * Variantes del catálogo web (backend PR #6). Opcionales: un backend anterior no las manda.
   * formato = unidades por caja (`price` ya es el de la caja); options = tipos/sabores;
   * addons = agregos con precio por unidad.
   */
  formato?: number | null;
  options?: string[] | null;
  addons?: CatalogAddonOption[] | null;
  /** Id del producto en el catálogo web anterior (ej. "cr-014"), para los enlaces viejos. */
  externalId?: string | null;
};

/** Agrego opcional de un producto (Product.addons), precio por unidad. */
export type CatalogAddonOption = {
  name: string;
  price: number;
};

export type CatalogBootstrap = {
  version: number;
  categories: CatalogCategory[];
  businesses: CatalogBusiness[];
  products: CatalogProduct[];
};

export type CatalogVersion = { version: number };

export type CatalogEntityType =
  | 'BUSINESS'
  | 'PRODUCT'
  | 'CATEGORY'
  | 'BUSINESS_HOURS'
  | 'BUSINESS_CLOSURE'
  | 'PRODUCT_OFFER';

export type CatalogChangeType = 'UPSERT' | 'DELETE';

export type CatalogChange = {
  version: number;
  entityType: CatalogEntityType;
  entityId: string;
  changeType: CatalogChangeType;
  createdAt: string;
};

export type CatalogChangesResult = {
  changes: CatalogChange[];
  latestVersion: number;
};

/** Estadísticas públicas para ordenar la búsqueda y el Home — ver docs/BACKEND_API.md §2 (GET /catalog/stats). */
export type CatalogBusinessStats = {
  /** Pedidos completados en la ventana general (windowDays, 60 días) — usado por Buscar. */
  orders: number;
  /** Pedidos completados en la última semana (weekWindowDays) — "Top Negocios" del Home. */
  ordersWeek: number;
  /** Promedio de reseñas (1.0–5.0) o null si todavía no tiene. */
  ratingAverage: number | null;
  ratingCount: number;
};

export type CatalogProductStats = {
  /** Unidades vendidas en la ventana general (windowDays, 60 días) — usado por Buscar. */
  units: number;
  /** Unidades vendidas en la última semana (weekWindowDays) — "Productos top" del Home. */
  unitsWeek: number;
};

/** Forma que devuelve el backend (listas). */
export type CatalogStatsResponse = {
  windowDays: number;
  weekWindowDays: number;
  generatedAt: string;
  businesses: (CatalogBusinessStats & { businessId: string })[];
  products: (CatalogProductStats & { productId: string })[];
};

/** Forma que usa la app (mapas por id, para consultar en O(1) al ordenar). */
export type CatalogStats = {
  windowDays: number;
  weekWindowDays: number;
  generatedAt: string;
  businesses: Record<string, CatalogBusinessStats>;
  products: Record<string, CatalogProductStats>;
};
