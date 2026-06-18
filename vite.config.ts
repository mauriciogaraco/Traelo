import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.webp', 'traelo_192x192.png', 'traelo_512x512.png'],
      manifest: {
        name: 'Tráelo Familia',
        short_name: 'Familia',
        description: 'Desde cualquier lugar, cerca de los tuyos. Envía regalos a tu familia en Cuba.',
        theme_color: '#C96A3D',
        background_color: '#FAF8F5',
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
        // Precache solo el app shell (JS/CSS/HTML). Las imágenes se cachean on-demand.
        globPatterns: ['**/*.{js,css,html}'],
        runtimeCaching: [
          {
            // catalog.json: NetworkFirst con timeout corto. La app muestra localStorage
            // mientras tanto; el SW entrega datos frescos en cuanto llegan.
            urlPattern: /\/data\/catalog-familia\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'catalog-data',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
          {
            // Imágenes: CacheFirst — se sirven rápido tras la primera visita.
            urlPattern: /\/assets\/images\//,
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
