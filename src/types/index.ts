/**
 * Estados de stock. Al ser un union estricto, TypeScript obliga a usar uno de
 * estos valores: para marcar un producto como agotado basta `stockStatus: 'agotado'`.
 */
export type StockStatus = 'disponible' | 'pocas' | 'agotado'

export type Category =
  | 'Alimentos'
  | 'Bebidas'
  | 'Aseo'
  | 'Confituras'
  | 'Comida'

export interface Business {
  id: string
  name: string
  description: string
  /** Imagen del negocio (URL importada o ruta). */
  image: string
  /** Tailwind gradient classes para el placeholder mientras carga la imagen. */
  color: string
  /** Aviso de pago opcional, ej: "Solo billetes de 50 CUP en adelante". */
  paymentNote?: string
}

export interface Product {
  id: string
  name: string
  businessId: string
  businessName: string
  category: Category
  shortDescription: string
  longDescription: string
  /** Emoji de respaldo (se muestra si no hay foto). */
  image: string
  /** Foto real del producto (URL importada). Opcional. */
  photo?: string
  /** Precio por UNIDAD (lo que se muestra). */
  price: number
  /**
   * Unidades por caja/paquete. Si es > 1, el producto se vende por ese formato:
   * cada vez que se añade/incrementa, se suma una caja completa (ej: 24 → 48 → 72).
   * Por defecto (undefined) el producto se vende por unidad.
   */
  formato?: number
  /**
   * Tipos/sabores disponibles (ej: ['Fresa', 'Natural']). Si tiene opciones, el
   * producto NO se puede añadir directo: hay que elegir el tipo en su detalle.
   */
  options?: string[]
  stockStatus: StockStatus
}

export interface CartItem {
  product: Product
  quantity: number
  /** Tipo/sabor elegido (para productos con `options`). */
  option?: string
}

export interface Address {
  nombre: string
  apellidos: string
  telefono: string
  direccion: string
  /** Detalle opcional: "al doblar de la farmacia", "frente al parque", etc. */
  referencia?: string
}

export type OrderStatus = 'pendiente' | 'completado'

export interface Order {
  id: string
  date: string
  items: CartItem[]
  total: number
  status: OrderStatus
  address: Address
}
