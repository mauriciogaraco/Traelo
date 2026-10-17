# Analítica de comportamiento

La web registra lo que hace la gente (visitas, búsquedas, carrito, compras) y lo envía al backend, que lo
guarda en su base de datos. Código: `src/analytics/`. Backend: módulo `behavior`
(repositorio `Traelo-Co/Backend`, PR #37).

> Estado: **implementado y probado contra PostgreSQL 18 local**, no contra Supabase ni en producción. No se
> debe afirmar que los eventos llegan a Supabase hasta probarlo con el backend desplegado (ver «Probar»).

## Contrato (lo que el backend implementa)

`POST {VITE_API_URL}/api/v1/behavior/events` — cabecera `X-Api-Key` (la misma del catálogo) y, si hay sesión,
`Authorization: Bearer`. La cuenta sale **siempre del token**; el body no admite `customerId`.

```jsonc
{
  "visitorId": "uuid",          // anónimo, uno por navegador (caduca a los 180 días)
  "sessionId": "uuid",          // uno por pestaña
  "channel": "WEB",
  "events": [                   // 1 a 50 por lote
    {
      "eventId": "uuid",        // único por evento: un reintento lo reenvía igual y el backend lo ignora
      "type": "business_view",
      "occurredAt": "2026-10-09T20:34:50.473Z",
      "businessId": "…", "productId": "…",
      "properties": { "source": "home" }   // planas: texto ≤300, número, booleano o null (≤20 claves)
    }
  ]
}
```

Respuesta `202 { data: { accepted, duplicates } }` (`duplicates` = eventos ya guardados por su `eventId`).
Un token vencido **no** da 401 aquí: se registra como anónimo. Límite: 120 envíos/min por IP.

### Eventos y dónde se registran

| Evento (conceptual de la especificación → nombre real) | Dónde | Datos |
|---|---|---|
| `business_view` | `BusinessPage` (efecto por negocio abierto) | `source`: pantalla de origen |
| `product_view` | `ProductDetailPage` | producto, negocio, `source` |
| `category_view` | `CategoryCard` (Home) y `CategoriesPage` | `categoryId`, `category`, `source` |
| `search_performed` + `search_no_results` → **`search`** | `SearchPage`, al dejar de escribir (1,2 s), una vez por texto | `query` normalizado, `tab`, `resultCount`, `businessCount`, `productCount`. **`resultCount: 0` = sin resultados** (un solo evento, no dos) |
| `search_result_click` | `SearchPage` (clic delegado en resultados) | texto, negocio/producto abierto |
| `cart_item_added` / `cart_quantity_changed` → **`add_to_cart`** | `analytics/index.ts` → `startCartTracking` | producto, negocio, `quantity` (**delta**), `price` observado |
| `cart_item_removed` / bajar cantidad → **`remove_from_cart`** | ídem | ídem |
| `cart_view` | `CartPage` | `itemCount` |
| `checkout_started` | `CheckoutPage` | `itemCount`, `businessCount` |
| `checkout_step_completed` | `CheckoutPage` (de «dónde» a «revisar») | `step` |
| `favorite_added` / `favorite_removed` | `favoritesService` | negocio/producto |
| `login_completed` / `signup_completed` | `authService` (envío inmediato) | — |

El carrito se registra **comparando estados del store** (no en cada componente): captura tarjeta, ficha,
página del carrito, quitar y vaciar sin tocar cada sitio. Cambiar la cantidad es un `add`/`remove` por la
diferencia. Vaciar el carrito **porque se envió el pedido** no cuenta (`withoutCartEvents`).

### Compras: las registra el servidor
La web **no** envía `order_placed` (el backend lo rechaza). Lo crea el backend al crear el pedido, con el id real,
el total y el negocio. El checkout manda `X-Visitor-Id` / `X-Session-Id` para unirlo a las visitas del mismo
visitante, y con eso el backend detecta **carritos abandonados**
(`GET /api/v1/behavior/abandoned-carts`, solo staff). Una pantalla de éxito local nunca cuenta como compra.

## Identidad y privacidad
- **Anónimo:** `visitorId` (localStorage, `{id, createdAt}`, **caduca a los 180 días**) y `sessionId` (sessionStorage).
  UUID aleatorios: sin IP, sin huella del navegador, sin user-agent.
- **Cuenta:** el backend la toma del token. Al iniciar sesión se envía el lote **ya** y el backend une el historial
  anónimo de ese visitante a la cuenta.
- **Cerrar sesión:** se envía lo pendiente (máx. 2 s) y se **rota** `visitorId`/`sessionId`: quien use después el
  dispositivo no hereda el historial anónimo anterior, y el de la persona queda solo en su cuenta.
- **Consentimiento:** no hay banner. La política (sección 2.7) lo explica y hay un **interruptor** en la política de
  privacidad; desactivarlo descarta lo pendiente y olvida el identificador. También se respeta «No rastrear».
- **Datos personales:** el texto buscado que parece un teléfono o correo **no se envía** (`queryRedacted`); el backend lo
  vuelve a comprobar. Nunca se envían nombres, teléfonos, direcciones, tokens ni datos de pago.
- Al borrar la cuenta, el backend borra en cascada sus eventos.

## Fiabilidad
- Cola en memoria + `localStorage` (**máx. 200 eventos y 24 h**: lo más viejo se descarta; no crece sin fin).
- Lotes de hasta 50 cada 8 s, al ocultar/cerrar la pestaña (`keepalive`) y al volver la conexión.
- Red caída, 5xx, 408 y 429 → reintento con espera creciente (15 s … 5 min), **reenviando los mismos `eventId`**
  (idempotente). Un 4xx (ruta inexistente, clave, validación) **descarta** el lote.
- Vistas idénticas dentro de 2 s cuentan una vez (React StrictMode / re-montajes). Los eventos de carrito **no** se
  deduplican: dos clics son dos añadidos.
- `track()` no lanza ni espera: la analítica no puede romper la navegación ni el checkout.

## Variables de entorno
| Variable | Uso |
|---|---|
| `VITE_API_URL` | origen del backend (sin `/api/v1`); por defecto producción |
| `VITE_API_KEY` | `X-Api-Key` pública (ya existente; no es un secreto) |
| `VITE_ANALYTICS` | `true`/`false` fuerza la analítica. **Por defecto: activa solo en build de producción** |

No hay claves de Supabase ni secretos en el frontend: la web solo habla con el API del backend.

## Probar
**Desarrollo** (la analítica viene apagada para no ensuciar datos reales):
1. Apunta `VITE_API_URL` a un backend **de pruebas** con la migración `…_add_behavior_events` aplicada.
2. Pon `VITE_ANALYTICS=true` en `.env.local` y reinicia `npm run dev`.
3. Navega; a los ~8 s ve el `POST /api/v1/behavior/events` en la pestaña Red (202).
4. Comprueba las filas: `select "eventType", "visitorId", "customerId", properties from analytics_events order by "createdAt" desc;`
5. Reenvía un lote idéntico (mismos `eventId`): la respuesta trae `duplicates` y no aparecen filas nuevas.

**Producción:** aplicar primero la migración del backend (`npm run prisma:deploy`) y desplegar el backend; después la web.
Si la web sale antes, sus envíos reciben 404 y se descartan sin efectos (se pierden los eventos hasta que el backend esté).

## Limitaciones conocidas
- Los eventos pendientes al cerrar sesión que no alcanzan a enviarse en 2 s se envían después con la identidad nueva.
- Solo hay pruebas unitarias de la lógica (el repositorio no tiene herramientas de pruebas de componentes); la
  instrumentación de las pantallas se verificó a mano en el navegador.
- La app Android necesita su propia integración (el backend ya acepta `channel: APP`).
