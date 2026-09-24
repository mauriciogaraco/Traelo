/**
 * Animación "añadir al carrito" sin librerías: una pequeña explosión de
 * partículas sale del botón "+" y converge en el icono de carrito de la barra
 * de navegación visible (`[data-cart-target]`: la barra flotante en móvil o el header en
 * escritorio), que rebota al recibirlas.
 *
 * Cada partícula traza un arco: el contenedor anima el eje X y el punto el
 * eje Y, cada uno con su propia curva de easing.
 */

/** Hay un destino por navegación (barra flotante / header); se usa el que esté visible. */
function findTarget(): HTMLElement | null {
  const targets = document.querySelectorAll<HTMLElement>('[data-cart-target]')
  for (const el of targets) {
    if (el.getClientRects().length > 0) return el
  }
  return null
}
const PARTICLE_COUNT = 8
const PARTICLE_COLORS = ['#F97316', '#FB923C', '#EA580C', '#FDBA74']

export function bumpCart(): void {
  const target = findTarget()
  if (!target) return
  target.classList.remove('cart-bump')
  void target.offsetWidth // reinicia la animación si se dispara seguido
  target.classList.add('cart-bump')
  window.setTimeout(() => target.classList.remove('cart-bump'), 500)
}

export function flyToCart(originEl: HTMLElement | null): void {
  if (typeof document === 'undefined') return

  const target = findTarget()
  if (!originEl || !target) {
    bumpCart()
    return
  }

  const o = originEl.getBoundingClientRect()
  const t = target.getBoundingClientRect()
  const startX = o.left + o.width / 2
  const startY = o.top + o.height / 2
  const endX = t.left + t.width / 2
  const endY = t.top + t.height / 2

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    spawnParticle(startX, startY, endX, endY, i)
  }

  // El carrito rebota cuando las primeras partículas están llegando.
  window.setTimeout(bumpCart, 560)
}

function spawnParticle(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  index: number
): void {
  const size = 7 + Math.random() * 7
  const delay = index * 32
  const duration = 580 + Math.random() * 220

  // Pequeña dispersión inicial alrededor del botón (efecto "estallido").
  const scatterX = (Math.random() - 0.5) * 46
  const scatterY = (Math.random() - 0.5) * 22 - 8
  const originX = startX + scatterX
  const originY = startY + scatterY
  const dx = endX - originX
  const dy = endY - originY

  const wrap = document.createElement('div')
  wrap.style.cssText = [
    'position:fixed',
    `left:${originX}px`,
    `top:${originY}px`,
    'z-index:9999',
    'pointer-events:none',
    // eje X: arranca lento y acelera (ease-in)
    `transition:transform ${duration}ms cubic-bezier(0.66,0,0.86,0.44) ${delay}ms`,
    'will-change:transform',
  ].join(';')

  const dot = document.createElement('div')
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length]
  dot.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    `margin-left:${-size / 2}px`,
    `margin-top:${-size / 2}px`,
    'border-radius:9999px',
    `background:${color}`,
    'box-shadow:0 2px 8px -1px rgba(249,115,22,0.55)',
    // eje Y: arranca rápido (ease-out) + encoge y se desvanece al final
    `transition:transform ${duration}ms cubic-bezier(0.2,0.8,0.3,1) ${delay}ms,opacity 200ms ease-in ${delay + duration - 170}ms`,
    'will-change:transform,opacity',
  ].join(';')

  wrap.appendChild(dot)
  document.body.appendChild(wrap)

  // reflow para fijar el estado inicial antes de animar
  void wrap.offsetWidth

  requestAnimationFrame(() => {
    wrap.style.transform = `translateX(${dx}px)`
    dot.style.transform = `translateY(${dy}px) scale(0.35)`
    dot.style.opacity = '0.15'
  })

  let finished = false
  const cleanup = () => {
    if (finished) return
    finished = true
    wrap.remove()
  }
  dot.addEventListener('transitionend', cleanup)
  window.setTimeout(cleanup, delay + duration + 280)
}
