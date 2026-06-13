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

/** Horario de atención del negocio (para no permitir pedidos fuera de hora). */
export interface BusinessSchedule {
  /** Días que abre: 0=Domingo … 6=Sábado. */
  days: number[]
  /** Hora de apertura "HH:mm" (24h). */
  open: string
  /** Hora de cierre "HH:mm" (24h). */
  close: string
  /** Etiqueta legible, ej: "Lun–Sáb · 9:00 am – 5:00 pm". */
  label: string
}

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
  /** Tarifa de mensajería propia del negocio. Si no se define, se usa FEE_BASE global. */
  deliveryFee?: number
  /** Horario de atención. */
  schedule: BusinessSchedule
}

/** Agrego opcional (extra) que se puede sumar a un producto, ej: { name: 'Queso', price: 200 }. */
export interface Addon {
  name: string
  price: number
}

/** Envase obligatorio para llevar el producto, ej: { name: 'Termopack', price: 200 }. */
export interface Packaging {
  name: string
  price: number
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
  /**
   * Agregos opcionales (extras). Se puede añadir como máximo UNO por producto,
   * ej: pizza + queso. Cada agrego suma su precio a la línea.
   */
  addons?: Addon[]
  /**
   * Envases para llevar (obligatorio elegir uno si está presente). Cada envase
   * suma su precio por unidad. Ej: [{name:'Jaba',price:10},{name:'Termopack',price:150}].
   * Si solo hay uno, se considera obligatorio y se selecciona automáticamente.
   */
  packaging?: Packaging[]
  stockStatus: StockStatus
}

export interface CartItem {
  product: Product
  quantity: number
  /** Tipo/sabor elegido (para productos con `options`). */
  option?: string
  /** Agrego (extra) elegido, opcional (máximo uno). */
  addon?: Addon
  /** Envase elegido (obligatorio en productos con `packaging`). */
  packaging?: Packaging
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
  /** Suma de los productos (sin mensajería). */
  subtotal?: number
  /** Tarifa de mensajería aplicada. */
  fee?: number
  /** subtotal + fee. */
  total: number
  /** Momento de entrega elegido, ej: "Lo antes posible" o "Hoy 7:30 pm". */
  delivery?: string
  status: OrderStatus
  address: Address
}
