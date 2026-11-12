# Redirigir el enlace viejo de Vercel a www.traelo-market.com

1. El script al inicio de `index.html` redirige cualquier `*.vercel.app` a la web oficial
   (y desregistra el service worker y borra cachés). Para probar un preview: `?noredirect=1`.
2. Hay que desplegar ESTE código en el proyecto viejo de Vercel (si está conectado a otro repo,
   copiar el bloque `<script>` de `index.html` ahí). Los usuarios con la PWA vieja la actualizan
   solos al abrirla y son redirigidos.
3. En el proyecto viejo, además: Settings → Domains → redirigir a `www.traelo-market.com`, y
   quitar las variables de entorno de pedidos (`TELEGRAM_BOT_TOKEN`, etc.) para que un pedido
   fallido no se pierda en silencio.
