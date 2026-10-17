# Auditoría y diseño — selección de ciudad en la web del cliente (Güira de Melena → San Antonio de los Baños)

> **Actualización 2026-10-15 — decisiones de la sección G tomadas por el propietario.** (1) El
> selector de ciudad **no se muestra todavía** — solo cuando San Antonio esté activa (G.1). (2) Se
> prioriza el **Escalón 2** de E.6: filtro de ciudad en el servidor (`cityId` como parámetro en los
> endpoints de catálogo), con caché del cliente partida por ciudad — no el Escalón 1 de solo-cliente
> (G.6). Esto reordena F: ya no tiene sentido construir el Escalón 1 como paso intermedio, F.3 debe
> apuntar directo al Escalón 2 en cuanto el backend lo confirme. (3) El pill de ciudad en el header
> será un control **separado** de `AddressBar`, no fusionado (G.5). (4) Mandado **queda fuera de
> alcance** de esta expansión por ahora (G.3/E.9). (5) El botón "compartir negocio" con `?ciudad=`
> **se posterga** hasta que exista una segunda ciudad real (G.2). (6) El caso de un carrito legado
> mezclando ciudades **no se diseña ahora** — es imposible hoy (una sola ciudad existe) y se decide
> cuando pueda darse de verdad (G.4). **No se ha escrito ningún código todavía** — estas son
> decisiones de producto, a la espera de que el backend confirme el contrato del Escalón 2 antes de
> empezar la Fase 1.

> **Actualización 2026-10-15 — F.2 implementado.** `src/features/city/` (ciudades conocidas,
> `resolveCityFromQuery`, con tests), `src/store/cityStore.ts` (Zustand + persist,
> `traelo.city.v1`) y `src/hooks/useCityBootstrap.ts`, enganchado como `<CityBootstrap />` en
> `App.tsx` junto a los demás bootstraps invisibles (`SessionBootstrap`, `PointsBootstrap`, etc.).
> Resuelve `?ciudad=` > persistido > default (única ciudad activa hoy), sin red y **sin ningún
> selector visible** (sigue la decisión G.1). Verificado: `tsc --noEmit` limpio, suite completa
> (30 archivos / 325 tests) en verde, y probado en el navegador — el dev server arranca, el
> `localStorage` queda en `guira-de-melena` por default y también al llegar con `?ciudad=`, sin
> errores de consola nuevos. El "No pudimos cargar el catálogo / Error de base de datos" que se ve
> en local es el backend de PRODUCCIÓN real devolviendo un error (ya documentado en memoria del
> proyecto) — no tiene relación con este cambio. F.3 (Escalón 2 real) sigue bloqueado por el
> backend, como ya decía F.1.

**Rama:** `expansion-sanAntonio`. **Alcance:** auditoría de solo lectura de este repositorio (web del cliente) y del informe hermano del backend (misma rama, repo `Traelo-Dashboard-backend`). **Fecha:** 2026-10-15. **Regla seguida:** no se modificó ningún componente, store, tipo ni archivo de configuración — este documento es el único artefacto nuevo. **Fase:** 0 (auditar, diseñar, proponer). No se implementa nada todavía.

---

## A. Estado del entorno

- **Rama actual:** `expansion-sanAntonio`, working tree limpio (`git status` sin cambios al momento de auditar).
- **Stack confirmado** (`package.json`): React 18.3.1 · React Router DOM 6.26.1 · **Zustand 5.0.15** · TypeScript 5.5.3 (`strict: true`) · Vite 5.4.1 · TailwindCSS 3.4.10 · Vitest 3.2.7 · `vite-plugin-pwa`.
- **Nota sobre memoria previa:** la memoria `project-traelo` (v2/v3) describe una web sin backend, con Zustand explícitamente excluido y catálogo servido desde JSON estático. Eso es obsoleto: hoy el catálogo viene 100% del backend (`Traelo-Dashboard-backend`), con Zustand como base de prácticamente todo el estado cliente (`src/store/*`, 11 stores). Lo documento aquí porque el encargo pide no asumir nada ya resuelto.
- **Carpeta `api/` de este repo** (funciones Vercel: `order.js`, `order-notify.js`): infraestructura legada de un flujo de pedidos anterior (JSON estático → WhatsApp/Telegram); el flujo real hoy pasa por `POST /checkout` del backend. No es parte del árbol de decisiones de esta auditoría.
- **Auditoría hermana leída en esta sesión:** `Traelo-Dashboard-backend/audit/expansion-multiciudad/INFORME.md` (misma rama `expansion-sanAntonio`, fecha 2026-10-15). Resumen de lo que de verdad existe hoy en el backend — ver §B.9. Todo lo que este informe propone para el cliente se contrasta contra ESE contrato real, nunca contra el encargo original ni contra una suposición.

---

## B. Estado real del sistema (web del cliente)

### B.1 Rutas, páginas y layout (`src/App.tsx`)

24 rutas públicas bajo `<AppShell>` (`src/components/layout/AppShell.tsx`), todas menos Home cargadas con `lazy()`. Las relevantes al dominio de catálogo/compra: `/` (Home), `/categorias`, `/buscar`, `/negocio/:id`, `/producto/:id`, `/carrito`, `/checkout`, `/mandado`. El resto es cuenta, direcciones, favoritos, pedidos, puntos, referidos, notificaciones — sin relación directa con "ciudad".

Layout: `AppShell` envuelve todo; `TopHeader` (desktop: logo + nav + `AddressBar` + carrito + campana + cuenta) se oculta en mobile a favor de `FloatingTabBar` (bottom nav). `AddressBar` vive en el header en ambos tamaños — es el único selector "de contexto" que existe hoy, y el patrón visual más cercano a lo que necesitaría un selector de ciudad (ver E.4).

### B.2 Cómo se obtiene catálogo, negocios, productos, categorías, precios y entrega — HALLAZGO CENTRAL

`src/api/catalog.ts` consume exactamente 8 endpoints: `/catalog/bootstrap`, `/catalog/version`, `/catalog/changes`, `/catalog/categories`, `/catalog/businesses`, `/catalog/businesses/:id/products`, `/catalog/stats`, `/catalog/featured-products`. **Ninguno acepta ni devuelve `cityId`/`cityCode`** — confirmado campo por campo en `src/types/backend/catalog.ts` (`CatalogBusiness`, `CatalogProduct`, `CatalogBootstrap`): no existe la propiedad, ni siquiera como opcional.

El catálogo vive en **un único store global** (`src/store/catalogStore.ts`), sincronizado de forma incremental por número de versión (`src/services/catalogSync.ts`): bootstrap completo la primera vez, después solo `/catalog/changes?since=N`. Se cachea íntegro en `localStorage` (`src/storage/catalogStorage.ts`) y se usa igual en Home, Buscar, Categorías y la ficha de negocio. **No hay ningún punto de partición por ciudad en esta arquitectura** — es un solo árbol de datos, una sola versión, una sola caché.

Las condiciones de entrega/apertura (`acceptingOrders`, `isOpenNow`, horarios) llegan ya resueltas por negocio desde el backend; `src/features/catalog/businessStatus.ts` solo traduce esos dos booleanos a una etiqueta y documenta explícitamente "nunca calcular abierto/cerrado por horario en el cliente". Hoy no hay nada "de la ciudad" que mostrar aparte de lo del negocio, porque el backend tampoco expone todavía `CityConfig` en ningún endpoint público (confirmado en §B.9).

### B.3 Carrito, persistencia, checkout y pedidos

- `src/store/cartStore.ts` — Zustand + `persist` en `localStorage` (`traelo.cart.v1`). Guarda solo `productId`/`businessId`/cantidad + snapshots informativos; el backend recalcula todo en `/checkout`.
- **Un pedido YA puede incluir varios negocios a la vez** — `CartBusinessInput[]` en `src/types/backend/checkout.ts` y `buildBusinessesInput()` en `src/features/checkout/buildCheckoutInput.ts` agrupan el carrito por negocio, pero todos esos grupos viajan en el mismo `POST /checkout`. `src/features/cart/groupByBusiness.ts` solo agrupa para **mostrar** sin mezclar visualmente; no impide ni valida nada sobre a qué negocios pertenecen las líneas.
- `src/store/checkoutDraftStore.ts` — borrador en memoria (no persistido) del formulario de entrega.
- `src/api/checkout.ts` → `POST /checkout` con `CheckoutOrderInput`: **sin ningún campo de ciudad**, ya sea explícito o implícito en el tipo.
- `src/store/addressStore.ts` — libreta de direcciones **texto libre + pin GPS opcional**, sin ningún campo de ciudad. Esto es coherente con el encargo: la dirección de entrega y el "mercado desde el que se compra" son conceptos independientes (alguien fuera de Cuba compra para un destinatario en Cuba).

### B.4 Enlaces promocionales y navegación a negocio/producto

- `/negocio/:id` (`src/pages/BusinessPage.tsx`) acepta: el id real del backend, un **slug corto** (`src/features/catalog/businessSlug.ts`, p. ej. `/negocio/la-marina`) o un **id heredado de la web anterior** (`src/features/catalog/legacyLinks.ts`, por nombre de negocio) — todos se resuelven y redirigen (`<Navigate replace>`) al slug canónico.
- `/producto/:id` (`src/pages/ProductRoute.tsx`) análogo, vía `Product.externalId` para enlaces viejos tipo `cr-014`.
- `/r/:code` (referidos) — atribución persistida en `localStorage` con regla "primer código gana" (`src/lib/referralAttribution.ts`): **patrón directamente reutilizable** para capturar una ciudad desde un enlace (ver E.3).
- `?negocio=`, `?q=`, `?categoria=` — redirecciones legadas del Home anterior (`useLegacyHomeRedirect` en `HomePage.tsx`).
- Todo esto se resuelve contra el catálogo **global** ya cargado en memoria — funciona hoy sin ningún concepto de ciudad porque nunca hace falta cambiar de "conjunto de datos" para encontrar un negocio o producto. **No existe hoy ningún botón "compartir negocio"** (confirmado por búsqueda en todo `src/`): los únicos vectores de enlace compartible son la URL del navegador y los enlaces de referidos.

### B.5 Autenticación

Siempre opcional (`src/hooks/useAuth.ts` + `src/store/sessionStore.ts`): `GUEST` es el estado normal, nada exige cuenta para comprar. `Customer` es un sistema de identidad separado de `User` (staff) — coincide exactamente con lo que describe el informe del backend en B.2.

### B.6 Diseño visual actual

Tokens en `src/index.css` (variables CSS RGB, con variante oscura): `--c-primary: 249 115 22` (`#F97316`), `--c-primary-pressed: #EA580C`, `--c-primary-text: #C2410C`, `--c-primary-soft: #FFEDD5`. Tipografía Plus Jakarta Sans (WOFF2 estático en `src/assets/fonts/`). `AddressBar` (`src/components/address/AddressBar.tsx`) es un *pill* (`rounded-full bg-background`, icono + etiqueta + chevron) que abre `AddressSheet`, un bottom-sheet — el lenguaje visual más próximo y reutilizable para un selector de ciudad. No hay geolocalización para decidir nada de catálogo: `useDeviceLocation` (`src/hooks/useDeviceLocation.ts`) solo se usa en `MandadoPage` para fijar un pin de recogida/entrega, nunca para inferir ubicación de compra — ya cumple la restricción del encargo de no usar GPS para esto.

### B.7 Tests

Vitest, `environment: 'node'`, solo `src/**/*.test.ts` (lógica pura, sin DOM) — `npm test` / `npm run typecheck`. Cobertura real y fuerte en `features/cart`, `features/catalog` (slug, status, ranking, búsqueda), `features/checkout`, `services/*Service.ts`. Ninguno de estos tests menciona ciudad/localidad (coherente con que el concepto no existe aún en el código).

### B.8 Configuración de API

`src/config/env.ts` fija **una sola** URL de backend (`VITE_API_URL`, por defecto producción) y **una sola** API key — sin ningún concepto de "entorno por ciudad". `src/api/client.ts` es el único punto de entrada HTTP de toda la app (incluye refresh de token); nada fuera de él construye URLs a mano. Cualquier cambio de contrato (p. ej. un parámetro `cityId`) tiene un solo lugar de entrada real.

### B.9 Contrato real de multiciudad — resumen del informe hermano del backend

(`Traelo-Dashboard-backend/audit/expansion-multiciudad/INFORME.md`, misma rama, mismo día.) Lo cito porque es la fuente de verdad contra la que se diseña este documento, no una suposición:

- **Implementado ya (con aprobación explícita del propietario):** modelos `City`, `CityConfig`, `DelivererCity`, `UserCityAccess`, campos `Business.cityId`/`Order.cityId`/`Deliverer.onDutyCityId` (todos *nullable* a propósito), migraciones 1-6 aplicadas y backfilleadas al 100% a Güira de Melena.
- **NO implementado:** San Antonio de los Baños no está sembrada (paso 7, pendiente). **Ningún controlador, servicio ni endpoint fue tocado** — el catálogo público, el checkout, la cola de despacho y los reportes siguen siendo 100% globales, exactamente como describe este informe en §B.2-B.4.
- Diseño propuesto por el backend (no implementado): `cityId` como filtro añadido **encima** de los filtros que ya existen (`businessId`/`delivererId`/`customerId`), nunca en su lugar; catálogo público con `cityId` requerido o con default; checkout valida que todos los negocios del pedido compartan ciudad; cola de despacho particionada por `onDutyCityId`.
- Riesgo ya señalado por el backend y directamente relevante para el cliente: catálogo público sin paginar — con dos ciudades sin filtro de servidor, el payload de arranque se duplica.

---

## C. Diferencias detectadas

- El encargo da por hecho que "negocios/productos de la localidad seleccionada" ya es algo filtrable. **No lo es, en ningún punto de la cadena**: ni el tipo que devuelve la API (`CatalogBusiness`/`CatalogProduct`), ni el store del cliente, ni ningún endpoint consumido hoy.
- El encargo pide "conocer las condiciones de entrega aplicables a esa localidad": el modelo que las tendría (`CityConfig`) existe en la base de datos del backend, pero **ningún endpoint lo sirve todavía** — el cliente no tiene de dónde leerlas.
- Memoria previa del proyecto (`project-traelo`, v2/v3): describe "sin Zustand, catálogo JSON estático" — completamente obsoleta frente al código real de esta rama (Zustand 5 + backend real). Ya anoté esta discrepancia para que no se repita en memoria.

---

## D. Riesgos (de implementar ya, sin esperar al backend)

- **D.1 — Filtro sin datos reales.** Cualquier filtro de ciudad construido hoy en el cliente sería un *placeholder*: no hay campo `cityId`/`cityCode` en ningún negocio ni producto que llegue por la API para filtrar de verdad.
- **D.2 — Arquitectura de sync incompatible con "cambiar de ciudad".** El catálogo es una sola caché incremental versionada; no hay manera de pedir "solo lo de esta ciudad" sin que el backend lo soporte — hoy "cambiar de ciudad" en el cliente no puede significar nada más que filtrar en memoria un catálogo que de todas formas se bajó completo.
- **D.3 — Mezcla de ciudades en un pedido.** El carrito y el checkout YA soportan varios negocios en un mismo pedido (B.3); si San Antonio tuviera negocios reales antes de que el backend valide "misma ciudad" en `/checkout` (su propio diseño, aún no implementado), un cliente podría mezclar negocios de ciudades distintas sin ningún aviso, ni en el cliente ni en el servidor.
- **D.4 — Enlaces promocionales rotos.** Si se activa un filtro de ciudad sin que el enlace compartido lleve consigo la ciudad del negocio, "aterrizar en su localidad correcta" (requisito explícito del encargo) se rompe: el negocio simplemente no aparecería en el catálogo filtrado de la ciudad equivocada.
- **D.5 — Rendimiento.** Mismo riesgo ya señalado por el backend (B.9): bootstrap sin paginar, el payload crece con cada ciudad nueva si no hay filtro de servidor.

---

## E. Diseño propuesto (cliente)

### E.1 Qué representa "ciudad" aquí

El mercado desde el que la persona quiere comprar — nunca su ubicación física ni la del destinatario (igual que pide el encargo). **Nunca se solicita geolocalización para esto**: ya hoy `useDeviceLocation` está acotado a Mandado y no se reutiliza para esta decisión (B.6); el diseño mantiene esa separación.

### E.2 Nueva pieza de estado: `cityStore`

Mismo patrón exacto que `cartStore`/`addressStore` (Zustand + `persist` en `localStorage`, p. ej. `traelo.city.v1`):

```ts
type CityOption = { code: string; name: string } // lo que el backend exponga cuando exista el endpoint (ver E.6)
type CityState = {
  cities: CityOption[]              // hoy: vacío o hardcodeado a una sola opción (ver F.2)
  selectedCityCode: string | null
  setCity: (code: string) => void
}
```

### E.3 Resolución de la ciudad activa al cargar — reutilizando el patrón de atribución de referidos

Orden de prioridad (idéntico en espíritu a `referralAttribution.ts`, "primer dato gana / se persiste / se limpia tras usarlo"):

1. `?ciudad=<code>` en la URL — para enlaces promocionales y compartidos.
2. Valor persistido en `localStorage` de una visita anterior.
3. Si solo hay una ciudad activa (hoy: Güira), se usa sin preguntar — cero friction mientras San Antonio no esté lista (coherente con `CityConfig.acceptingOrders = false` del paso 7 del backend).
4. Si hay 2+ ciudades activas y ninguna señal previa: selector explícito la primera vez.

### E.4 UI

Pill de ciudad en `TopHeader`, junto a `AddressBar`, mismo lenguaje visual (`rounded-full bg-background`, icono + etiqueta + chevron) y mismo mecanismo (bottom-sheet tipo `AddressSheet`) — cero tokens nuevos, cero componente nuevo de base. La disposición exacta en mobile (¿dos pills en una fila, o una combinada "Güira de Melena · Mi dirección"?) es una decisión de maqueta de la fase visual siguiente, no de esta auditoría (ver G.5).

### E.5 Enlaces promocionales a negocio

Hoy no existe un botón "compartir negocio" (B.4); el vector real es la URL del navegador. Dos piezas, en orden de dependencia:

- Si/cuando se agregue un botón de compartir, el link debe anexar `?ciudad=<code-del-negocio>`.
- `BusinessPage`/`findBusinessByParam` necesitan, para negocios fuera de la ciudad activa, el mismo tipo de resolución que ya usan para ids legados (`<Navigate>` tras resolver) — pero esto exige que el cliente pueda saber a qué ciudad pertenece un negocio que no está en su catálogo filtrado actual, lo cual depende de que el backend exponga esa información (ver E.6, dependencia bloqueante).

### E.6 Catálogo — dos escalones, a decidir junto con el backend

- **Escalón 1 (bajo riesgo, sin tocar `catalogSync.ts`):** el backend agrega `cityId`/`cityCode` a `CatalogBusiness` como campo nuevo (mismo patrón ya usado para `joinedAt`/`logoBlurhash`: "opcional, catálogos cacheados de antes no lo traen"). El cliente sigue bajando el catálogo completo igual que hoy y filtra en memoria por `selectedCityCode` en los selectores de Home/Buscar/Categorías/Negocio. No resuelve D.5 a largo plazo, pero no requiere ningún cambio de arquitectura de sync ni de caché.
- **Escalón 2 (alineado con el diseño del backend, E.5 de su informe):** los endpoints de catálogo aceptan `cityId`; el cliente pasa a cachear **por ciudad** (clave de `localStorage` por ciudad) y un cambio de ciudad fuerza un bootstrap nuevo — mismo mecanismo que hoy ya existe para "versión remota menor que la local" en `syncToLatest()`. Esto sí es un cambio de arquitectura del store/sync, y merece su propia fase, no esta auditoría.

### E.7 Carrito y checkout (una vez el backend exponga ciudad por negocio)

El carrito YA permite mezclar negocios distintos (B.3) — eso no cambia. La regla nueva es más fina: **mezclar negocios de la misma ciudad sigue permitido; agregar un producto de una ciudad distinta a la que ya tiene el carrito debe bloquearse** en el cliente, con el mismo lenguaje que ya usa `removeBusinessItems` (ofrecer vaciar el carrito o cambiar de ciudad). Si `buildCheckoutInput` necesita mandar `cityId` explícito o el backend lo infiere de los `businessId` del pedido es una decisión del backend (su propio informe no lo especifica todavía) — no se diseña aquí para no anticipar un contrato que el backend no ha fijado.

### E.8 Direcciones — sin cambio

Siguen siendo texto libre + pin opcional, desacopladas de la ciudad — es exactamente lo que pide el encargo (alguien fuera de Cuba compra para alguien en Cuba; la dirección de entrega nunca determina el mercado).

### E.9 Mandado (encargo personalizado) — pregunta abierta

`Mandado` no tiene `businessId` (`src/api/mandado.ts`), así que no hereda ciudad de ningún negocio. Si Mandado también debe acotarse por ciudad (p. ej. que un mensajero de Güira no reciba un mandado de San Antonio), hace falta decidir de dónde sale esa ciudad — de la dirección de recogida, de una selección explícita, o de ninguna parte si el encargo decide que Mandado queda fuera del alcance de esta expansión. Ninguno de los dos informes (este ni el del backend) resuelve esto — queda en G.

---

## F. Plan de implementación (fases, no ejecutar todavía)

- **F.1 — Bloqueante real:** el Escalón 2 (E.6, ya decidido en G.6) no puede construirse de verdad hasta que el backend complete su paso 7 (sembrar San Antonio) y fije el contrato exacto de `cityId` en los endpoints de catálogo/checkout (parámetro requerido vs. opcional, nombre, dónde cachear). Esperar esa confirmación antes de tocar `catalogSync.ts`/`catalogStorage.ts`.
- **F.2 — Lo único que sí se puede construir ya, sin red, riesgo cero:** `cityStore` + persistencia + lectura de `?ciudad=` (puro, testeable igual que `referralAttribution.test.ts`). Sin selector visible todavía (G.1) — es estado y lógica pura, sin ningún componente nuevo en pantalla.
- **F.3 — Cuando el backend confirme el contrato del Escalón 2:** adaptar `catalogSync.ts` para cachear por ciudad (clave de `localStorage` por ciudad) y forzar un bootstrap nuevo al cambiar de ciudad — mismo mecanismo que ya existe hoy para "versión remota menor que la local". Recién entonces se agrega el pill de ciudad al header (separado de `AddressBar`, G.5), siempre oculto mientras solo haya una ciudad activa (G.1).
- **F.4 — Carrito/checkout cross-city (E.7):** solo tiene sentido construir y probar con negocios reales de San Antonio (`CityConfig.acceptingOrders = true`), no antes — mismo criterio de secuencia que usa el propio plan del backend (su paso 7 es deliberadamente el último).

---

## G. Decisiones (tomadas por el propietario, 2026-10-15)

1. **Selector visible:** no, solo cuando San Antonio esté activa. (afecta F.2 — el hueco visual se deja preparado, pero sin render real todavía.)
2. **Botón "compartir negocio" con `?ciudad=`:** se posterga hasta que exista una segunda ciudad real. (E.5)
3. **Mandado:** fuera de alcance de esta expansión por ahora; no se le agrega ciudad. (E.9)
4. **Carrito legado mezclando ciudades:** no se diseña — es imposible hoy (una sola ciudad existe); se decide si/cuando pueda darse de verdad.
5. **Maqueta del header:** pill de ciudad **separada** de `AddressBar`, dos controles independientes. (E.4)
6. **Escalón de catálogo (E.6):** se prioriza el **Escalón 2** (filtro `cityId` en el servidor, caché del cliente por ciudad) directamente — no se construye el Escalón 1 como paso intermedio. Pendiente: que el backend confirme la forma exacta del parámetro/contrato antes de tocar `catalogSync.ts`.

---

## H. Recomendación final

**No iniciar ninguna UI de selección de ciudad real todavía.** El backend, en su propio informe (misma rama, mismo día), es explícito: implementó solo las migraciones de base (1-6) y backfilleó todo a Güira, pero **no tocó ningún endpoint** — construir el Escalón 2 (ya decidido en G.6) hoy sería construir contra una API que no existe. Lo único de bajo riesgo y reutilizable que se puede avanzar ya es F.2 (estado + resolución de `?ciudad=`, sin tocar ninguna pantalla real ni depender de red). El siguiente paso de peso (F.3) debe esperar a que quien lleve el backend fije el contrato exacto de `cityId` en catálogo/checkout — coordinarlo explícitamente contra `Traelo-Dashboard-backend/audit/expansion-multiciudad/INFORME.md` antes de escribir una sola línea de `catalogSync.ts`, para no diseñar dos lados de una misma API por separado.

No se ha modificado ningún componente, store, tipo ni archivo de configuración de este repositorio en esta sesión. Este informe queda a la espera de aprobación explícita antes de empezar a implementar cualquier parte de la Fase 1.

---

## I. Continuación 2026-10-17 — contrato real del backend, qué se construyó y qué sigue bloqueado

> Rama `expansion-sanAntonio` del backend revisada en solo lectura (commits "catálogo público por ciudad",
> "CityConfig en el checkout", "contrato NOT NULL de Business.cityId"). Esto reemplaza lo que §B.9/§F.1 decían
> sobre "ningún endpoint tocado": el backend ya filtra por ciudad en parte del catálogo y valida el checkout.

### I.1 Contrato público que existe hoy (verificado en el código del backend)

| Pieza | Estado |
|---|---|
| `GET /catalog/bootstrap?cityId=` y `GET /catalog/businesses?cityId=` | **Existe**, `cityId` opcional (sin él, catálogo global como antes). |
| `GET /catalog/version`, `/changes`, `/stats`, `/featured-products`, `/categories` | **Globales**: no aceptan `cityId`. |
| Checkout / cotización | Valida en el servidor `MIXED_CITY_BUSINESSES` (400) si los negocios son de ciudades distintas; usa `CityConfig` de la ciudad del carrito para "acepta pedidos". |
| `GET /cities` | **Solo staff** (`authenticate` + OWNER/ADMIN/EMPLOYEE). **No hay endpoint público de ciudades.** |
| DTO público de negocio/producto | **No incluye `cityId`** ni nombre de ciudad. |

### I.2 Bloqueos del backend (la web NO los puede resolver; no se modificó el backend)

1. **Bug de contrato: el id de Güira no pasa la validación.** La migración `20261015010000_add_city` siembra Güira con
   `id = 'cty_guira_de_melena'`, pero los DTOs validan `cityId` con `z.cuid()` (`catalog.dto.ts`, `businesses.dto.ts`,
   `deliverers.dto.ts`, `users.dto.ts`, `mandado.dto.ts`, `notifications.dto.ts`). Comprobado: `z.cuid()` rechaza
   `cty_guira_de_melena` → `GET /catalog/businesses?cityId=cty_guira_de_melena` respondería **400**. Una ciudad creada
   por `POST /cities` (id cuid generado) sí pasa. Consecuencia: hoy no se puede filtrar el catálogo **por Güira**. La web
   por eso **no manda `cityId` para Güira** (`CityOption.apiId` ausente) y el día que se siembre San Antonio los clientes de
   Güira verían también sus negocios. **Hay que corregir la validación (aceptar el id sembrado) antes de sembrar San Antonio.**
2. **Falta un endpoint público de ciudades** (id, `code`, nombre, `acceptingOrders`). Sin él la web no puede obtener el `id`
   de San Antonio ni sus datos reales; por eso **San Antonio NO está en `KNOWN_CITIES`** (mostrarla sería inventar una oferta).
3. **El DTO público de negocio no trae `cityId`**: un enlace directo a un negocio de otra ciudad no se puede resolver a su
   localidad. La web lo trata con honestidad (ver I.3) en vez de adivinar.
4. `featured-products` y `stats` (y el registro de `changes`) son globales: la web filtra destacados contra el catálogo activo; un
   cambio de otra ciudad puede provocar un bootstrap de más (correcto, solo menos eficiente).

### I.3 Construido (todo inactivo con una sola ciudad: la web de Güira se comporta como antes)

- **Ciudades**: `getCities()` único punto de lectura; `CityOption.apiId` opcional; resolución validada (una elección guardada que
  ya no existe o un valor manipulado no cuenta). `?ciudad=` solo acepta ciudades conocidas.
- **Pregunta de entrada** (decisión del propietario 2026-10-17): con 2+ ciudades, "¿Desde dónde quieres hacer tu pedido?" sale
  **en cada visita nueva** (sessionStorage), aunque haya una elección guardada (queda marcada como "Tu última localidad"); no se repite
  al navegar ni al recargar dentro de la misma visita; un enlace con `?ciudad=` cuenta como elección. No usa GPS ni exige sesión.
- **Selector permanente**: `CityPill` separado de `AddressBar` (G.5): en línea en escritorio, fila propia con nombre completo en teléfono.
  `CityNote` en carrito (con "Cambiar") y checkout (solo texto): la localidad ≠ la dirección de entrega.
- **Catálogo por ciudad**: caché por ciudad (Güira conserva `traelo.catalog.v1`), cambio de ciudad vacía lo anterior al instante, pinta la
  caché de la nueva, no espera a una red lenta y **descarta** cualquier respuesta de la ciudad anterior que llegue tarde. Pasa `cityId`
  a `/bootstrap` y `/businesses` solo si la ciudad tiene `apiId`. Destacados filtrados contra el catálogo activo (solo con 2+).
- **Carrito por ciudad**: `items` sigue siendo el de la ciudad activa (los 10 consumidores no cambian); los de otras ciudades se guardan
  aparte y se restauran al volver. Carritos anteriores (solo `items`) pasan a ser de Güira sin migración. Vaciar tras un pedido solo vacía el activo.
- **Validación antes del pedido**: con 2+ ciudades, un negocio del carrito fuera del catálogo activo se marca y se puede quitar (sin red);
  `MIXED_CITY_BUSINESSES` del servidor detiene el paso con un mensaje claro. El servidor sigue siendo la autoridad.
- **Enlaces**: "no encontrado" ofrece "Ver en <otra localidad>" sin salir de la URL (al cambiar se carga ese catálogo y el mismo enlace se
  resuelve solo). La ficha de producto ya no dice "no encontrado" mientras el catálogo todavía llega.
- **Corrección colateral**: `Sheet` pasa a un portal en `<body>`: abierta desde el header (con `backdrop-blur`) se centraba respecto al header,
  no a la pantalla (afectaba también a `AddressSheet`).

### I.4 Pendiente / no activar todavía

Activar San Antonio (agregarla a la lista con su `apiId`) requiere: (1) corregir I.2-1, (2) endpoint público de ciudades, (3) idealmente `cityId` en el
DTO público de negocio, (4) sembrar San Antonio con `acceptingOrders` real. Hasta entonces el flujo multiciudad no debe activarse en producción.

### I.5 Actualización 2026-10-17 (revisión del backend, solo lectura)

- **I.2-1 resuelto en el backend**: rama `fix/id-ciudad-guira` (PR #50) agrega `cityIdSchema`; `cty_guira_de_melena` ya pasa en
  `/catalog/bootstrap`, `/catalog/businesses` y `/catalog/featured-products`. Falta confirmar que esté **desplegado**; hasta entonces la web
  sigue sin mandar `cityId` para Güira (si el servidor en producción aún tiene `z.cuid()`, respondería 400). Al activar San Antonio,
  Güira DEBE llevar `apiId: 'cty_guira_de_melena'` a la vez, o sus clientes verán también los negocios de San Antonio.
- **Destacados**: `/catalog/featured-products?cityId=` ya existe. La web sigue filtrando en el cliente contra el catálogo activo
  (correcto). Migrarlo al servidor requiere clave de caché por ciudad en `featuredProductsStore`; es una optimización, no un bloqueo.
- **Siguen bloqueados**: endpoint público de ciudades (I.2-2), `cityId` en el DTO público de negocio (I.2-3) y sembrar San Antonio (I.2-4).
  San Antonio NO se agrega a `KNOWN_CITIES`.
