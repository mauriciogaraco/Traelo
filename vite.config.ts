import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registro manual (ver src/pwa.ts): el script auto-inyectado por defecto
      // solo registra el service worker, sin detectar cuando hay una versión
      // nueva. Registrar a mano con `virtual:pwa-register` sí recarga la
      // página sola en cuanto el SW nuevo toma control.
      injectRegister: false,
      includeAssets: ['favicon.png', 'logo.webp', 'traelo_192x192.png', 'traelo_512x512.png'],
      manifest: {
        name: 'Tráelo',
        short_name: 'Tráelo',
        description: 'Compra en negocios locales y recíbelo en casa',
        theme_color: '#F97316',
        background_color: '#F8F6F2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'es',
        categories: ['shopping', 'food'],
        icons: [
          { src: '/traelo_192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/traelo_512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // La versión nueva toma el control de inmediato (sin esperar a cerrar pestañas).
        skipWaiting: true,
        clientsClaim: true,
        // Fuerza la recarga de pestañas con una versión vieja de la app (ver public/sw-force-reload.js)
        // y maneja los avisos de Web Push (ver public/sw-push.js).
        importScripts: ['sw-force-reload.js', 'sw-push.js'],
        // Las rutas /api/* (función serverless) nunca deben caer en el index.html del app shell.
        navigateFallbackDenylist: [/^\/api\//],
        // Precache solo el app shell (JS/CSS/HTML + la fuente). Las imágenes se cachean on-demand.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        // El mapa (MapLibre, ~290 KB comprimido) se baja SOLO al abrir el seguimiento en vivo: fuera del
        // precache para no gastar datos de quien nunca lo usa (conexión limitada); se guarda al usarlo.
        globIgnores: ['**/maplibre-gl-*.{js,css}'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/maplibre-gl-[^/]+\.(js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-library',
              expiration: { maxEntries: 4, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          // El catálogo (API del backend) NO pasa por el service worker: la web lo guarda en
          // localStorage y lo sincroniza por versión (services/catalogSync.ts), como la app móvil.
          {
            // Fotos del catálogo en Cloudinary (ya redimensionadas, ver lib/images.ts): CacheFirst,
            // cambian de URL (?v=) cuando cambia la foto.
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'catalog-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 14 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Imágenes propias (categorías, hero, fotos viejas): CacheFirst tras la primera visita.
            // El APK de la app (~30 MB) queda FUERA: no debe ocupar el almacenamiento del teléfono ni
            // pasar por la caché (la descarga muestra su progreso leyendo la red directamente).
            urlPattern: /\/assets\/(?!.*\.apk$)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
