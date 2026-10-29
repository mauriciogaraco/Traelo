# Halloween (campaña temporal)

Toda la ambientación vive en `src/seasonal/` y se apaga sola. No toca precios, carrito, checkout, pedidos, puntos ni rutas.

## Qué incluye

- `src/seasonal/halloween.ts` — decide si la campaña está activa y marca `<html data-season="halloween">`. Baja `halloween.css` (≈0,9 kB) **solo** si está activa.
- `src/seasonal/halloween.css` — todos los estilos, colgados de `:root[data-season='halloween']`.
- `src/seasonal/HalloweenArt.tsx` — SVG inline (calabaza, murciélago, fantasma, sombrero, telaraña).
- `HalloweenBanner` (Home, entre el hero y Mandado: saludo de marca con UN botón a la lista completa + adelanto "Cronos y dulces" con los productos DISPONIBLES de Cronos y de las categorías Dulces y Confituras, mezclados; el negocio y las categorías se cambian en `seasonalFeatured.ts`), `HalloweenPage` (ruta `/halloween`, la lista completa; fuera de campaña vuelve al Home), `HalloweenHeroDecor` (telaraña/murciélagos en el hero), `HalloweenLogoAccent` (sombrerito sobre el logo; el isotipo no cambia).
- Hilo naranja→ámbar en el filo del header (clase `season-header`).

## Cuándo se ve

Por fecha local del dispositivo, del **28 de octubre al 2 de noviembre de 2026** (`HALLOWEEN_START` / `HALLOWEEN_END`). Pasada esa fecha desaparece sin desplegar nada.

- Forzar para probar: `?halloween=on` (u `off`) en la URL.
- Apagar ya en producción: variable `VITE_HALLOWEEN=off` en Vercel y redeploy.

## Retirar del todo

1. Borrar la carpeta `src/seasonal/` y este archivo.
2. Quitar las líneas que la usan:
   - `src/main.tsx`: el `import { initSeason }` y la llamada `initSeason()`.
   - `src/pages/HomePage.tsx`: los dos `import` y `<HalloweenHeroDecor />` / `<HalloweenBanner />`.
   - `src/components/ui/RefreshModal.tsx`: los dos `import` de `seasonal` y el condicional que muestra `<HalloweenRefreshArt />` en lugar del 🔄.
   - `src/App.tsx`: el `import` de `HALLOWEEN_PATH`, el `lazy` de `HalloweenPage` y su `<Route>`.
   - `src/components/ui/Logo.tsx`: el `import`, `<HalloweenLogoAccent />` y la clase `relative` del badge (inofensiva si se deja).
   - `src/components/layout/TopHeader.tsx`: la clase `season-header`.
3. `npm run typecheck && npm test`.
