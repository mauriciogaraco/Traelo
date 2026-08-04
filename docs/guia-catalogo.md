# Guía de gestión del catálogo — Tráelo

Referencia para actualizar precios, horarios, inventario y negocios sin IA.

---

## 01 · Estructura de archivos

Todos los datos del catálogo viven en la carpeta `data/`. Cada negocio tiene su propio archivo JSON de productos, y hay un archivo central de negocios.

| Archivo | Propósito |
|---|---|
| `data/businesses.json` | Lista de negocios, horarios y configuración |
| `data/cronos.json` | Productos del negocio "cronos" |
| `data/mercadito-ahorro.json` | Productos de El Mercadito |
| `scripts/build-catalog.js` | Script que genera el catálogo final |
| `public/data/catalog.json` | Catálogo generado — **NO editar directamente** |

> ⚠️ Nunca edites `public/data/catalog.json` directamente. Siempre edita los archivos en `data/` y ejecuta `npm run catalog` al finalizar.

---

## 02 · Cambiar precios

Abre el archivo JSON del negocio correspondiente. Localiza el producto por su `name` y modifica el campo `price`. El precio siempre es en **CUP** (pesos cubanos).

```json
{
  "id": "ma-003",
  "name": "Perrito caliente",
  "price": 1000,
  "stockStatus": "disponible"
}
```

> 💡 El catálogo familia (para clientes en el exterior) convierte automáticamente a USD dividiendo entre **500 CUP** al ejecutar `npm run catalog`.

### Opciones con precios distintos

Si un producto tiene variantes de precio diferente (ej. picoloro 10" vs 12"), el campo `price` contiene el precio de la variante más barata y se aclara en `shortDescription`:

```json
"price": 3500,
"options": ["10 Pulgadas", "12 Pulgadas"],
"shortDescription": "10\" → 3500 CUP · 12\" → 4000 CUP"
```

---

## 03 · Agotado / Disponible

Cambia el campo `stockStatus` en el producto correspondiente:

```json
"stockStatus": "agotado"      // bloquea el botón de añadir al carrito
"stockStatus": "disponible"   // permite ordenar
```

### Opciones con un sabor agotado

Si un producto tiene `options` y uno de los sabores se agota, **elimínalo del array** de opciones:

```json
"options": ["Vainilla", "Fresa", "Uva"]
// Si Fresa se agota → quitar "Fresa" del array
```

---

## 04 · Horarios

Los horarios se configuran en `data/businesses.json` dentro del campo `schedule` de cada negocio.

### Referencia de días

| Número | Día |
|---|---|
| `0` | Domingo |
| `1` | Lunes |
| `2` | Martes |
| `3` | Miércoles |
| `4` | Jueves |
| `5` | Viernes |
| `6` | Sábado |

### Ejemplo

```json
"schedule": {
  "days": [2, 3, 4, 5, 6],
  "open": "09:00",
  "close": "18:00",
  "label": "Mar–Sáb · 9:00 am – 6:00 pm"
}
```

> 💡 Si el negocio tiene horario diferenciado un día (ej. domingo abre más tarde), usa el campo opcional `scheduleExtra` con los mismos campos.

---

## 05 · Cerrar / abrir un negocio

En `data/businesses.json`, agrega o elimina el campo `status` en el negocio:

### Cerrar

```json
{
  "id": "cronos",
  "name": "Cronos",
  "status": "cerrado",
  "schedule": { ... }
}
```

### Abrir

```json
{
  "id": "cronos",
  "name": "Cronos",
  "schedule": { ... }
}
```

> ⚠️ El campo `status: "cerrado"` bloquea completamente los pedidos al negocio, independientemente del horario.

---

## 06 · Añadir un producto nuevo

Abre el archivo JSON del negocio y agrega un objeto al final del array. Copia un producto existente como base y modifica los campos.

### Campos del producto

| Campo | | Descripción |
|---|---|---|
| `id` | requerido | Identificador único. Ej: `cr-010` |
| `name` | requerido | Nombre visible del producto |
| `businessId` | requerido | ID del negocio. Ej: `cronos` |
| `businessName` | requerido | Nombre del negocio. Ej: `Cronos` |
| `category` | requerido | Categoría. Ej: `Batidos`, `Comida` |
| `price` | requerido | Precio en CUP (número entero) |
| `stockStatus` | requerido | `"disponible"` o `"agotado"` |
| `photo` | opcional | Ruta: `/assets/images/products/NegocioX/imagen.jpg` |
| `shortDescription` | opcional | Texto corto visible en tarjeta |
| `options` | opcional | Array de sabores/tamaños — obliga al usuario a elegir |
| `formato` | opcional | Unidades por caja/paquete. Ej: `4` → "Caja × 4" |
| `addons` | opcional | Extras opcionales: `[{"name":"Termopack","price":200}]` |

### Imagen del producto

Copia la imagen a:

```
public/assets/images/products/NombreNegocio/nombre-imagen.jpg
```

Y referencia la ruta en el JSON:

```json
"photo": "/assets/images/products/NombreNegocio/nombre-imagen.jpg"
```

---

## 07 · Añadir un negocio nuevo

Requiere tres pasos en tres archivos distintos:

**Paso 1** — Agrega el negocio a `data/businesses.json`:

```json
{
  "id": "mi-negocio",
  "name": "Mi Negocio",
  "description": "Descripción breve.",
  "image": "/assets/images/business/mi-negocio.jpg",
  "color": "from-amber-100 to-orange-50",
  "schedule": {
    "days": [1, 2, 3, 4, 5, 6],
    "open": "09:00",
    "close": "18:00",
    "label": "Lun–Sáb · 9:00 am – 6:00 pm"
  }
}
```

**Paso 2** — Crea `data/mi-negocio.json` con los productos:

```json
[
  {
    "id": "mn-001",
    "name": "Nombre del producto",
    "businessId": "mi-negocio",
    "businessName": "Mi Negocio",
    "category": "Categoría",
    "shortDescription": "Descripción corta",
    "price": 500,
    "stockStatus": "disponible"
  }
]
```

**Paso 3** — Agrega el ID a `BUSINESS_FILES` en `scripts/build-catalog.js`:

```js
const BUSINESS_FILES = [
  'cronos',
  'bodega-central',
  // ... otros negocios ...
  'mi-negocio',   // ← agregar aquí
];
```

> 💡 La imagen del negocio va en `public/assets/images/business/` y también en `src/assets/images/business/`.

---

## 08 · Reconstruir el catálogo

Cada vez que termines de editar archivos en `data/`, ejecuta desde la terminal:

```bash
npm run catalog
```

El script generará dos archivos automáticamente:

- `public/data/catalog.json` — catálogo en CUP (app principal)
- `public/data/catalog-familia.json` — catálogo en USD (÷ 500 CUP)

Si todo va bien verás: `catalog.json — 16 negocios, 647 productos`

---

## 09 · Subir cambios a GitHub

Después de reconstruir el catálogo, sube los cambios:

```bash
git add data/negocio.json public/data/catalog.json public/data/catalog-familia.json
git commit -m "chore: Negocio — descripción del cambio"
git push
```

Si también cambiaste `businesses.json`, inclúyelo en el `git add`:

```bash
git add data/businesses.json data/negocio.json public/data/catalog.json public/data/catalog-familia.json
```

Para abrir un Pull Request, ve a **github.com/mauriciogaraco/Traelo** → "Compare & pull request" después del push.
