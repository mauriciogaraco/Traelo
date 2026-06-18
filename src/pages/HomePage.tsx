import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { ProductCard } from '../components/product/ProductCard'
import { Logo } from '../components/ui/Logo'
import { useCart } from '../context/CartContext'
import { categories, categoryEmoji } from '../data/catalog'
import type { Category } from '../types'
import { SUPPORT_WHATSAPP } from '../lib/config'

const CATEGORY_LABELS: Record<Category, string> = {
  Combos: 'Combos',
  Comidas: 'Comidas',
  Regalos: 'Regalos',
  Bebidas: 'Bebidas',
  Panadería: 'Panadería',
}

export function HomePage() {
  const { products, loading } = useCatalog()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<Category | 'Todos'>('Todos')
  const productsRef = useRef<HTMLElement>(null)

  const filtered =
    activeCategory === 'Todos'
      ? products
      : products.filter((p) => p.category === activeCategory)

  function selectCategory(cat: Category | 'Todos') {
    setActiveCategory(cat)
    setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center justify-between bg-gradient-hero border-b border-border/50">
        <Logo />
        <button
          onClick={() => navigate('/carrito')}
          className="relative w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-primary shadow-soft"
          aria-label="Carrito"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h2l1.5 10.5a1 1 0 0 0 1 .9h7.8a1 1 0 0 0 1-.8L19 8H7" />
            <circle cx="9.5" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero px-5 pt-8 pb-10">
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Entrega en Güira de Melena
          </span>
        </div>
        <h1 className="font-brand text-[2.4rem] leading-tight text-text-primary mt-3">
          Hazle llegar una sonrisa a tu familia.
        </h1>
        <p className="text-base text-text-secondary mt-3 leading-relaxed">
          Compra desde cualquier lugar y nosotros nos encargamos de la entrega directa en Güira de Melena.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => selectCategory('Combos')}
            className="flex-1 h-13 bg-gradient-primary text-white font-bold rounded-2xl shadow-btn-primary text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            🎁 Ver Combos
          </button>
          <button
            onClick={() => selectCategory('Todos')}
            className="h-13 px-5 bg-surface border border-border text-text-primary font-bold rounded-2xl text-sm active:scale-[0.97] transition-transform"
          >
            Todo
          </button>
        </div>
        {/* Trust mini */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-5">
          {['Pago por Zelle', 'Atención por WhatsApp', 'Entrega garantizada'].map((t) => (
            <span key={t} className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-accent flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Category chips */}
      <div className="px-4 pt-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <CategoryChip
            label="Todos"
            emoji="🛍️"
            active={activeCategory === 'Todos'}
            onClick={() => selectCategory('Todos')}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={CATEGORY_LABELS[cat]}
              emoji={categoryEmoji[cat]}
              active={activeCategory === cat}
              onClick={() => selectCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Products */}
      <section ref={productsRef} className="px-4 pt-5 scroll-mt-4">
        <SectionTitle
          title={activeCategory === 'Todos' ? 'Todo el catálogo' : CATEGORY_LABELS[activeCategory as Category]}
          action={
            <span className="text-xs font-semibold text-text-secondary">
              {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
            </span>
          }
        />
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-7 h-7 border-[2.5px] border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-text-secondary">Cargando catálogo...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-8 text-center">
            <span className="text-4xl">😕</span>
            <p className="text-sm text-text-secondary mt-2">Sin productos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 items-stretch">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Cómo funciona */}
      <section className="px-4 pt-10">
        <SectionTitle title="¿Cómo funciona?" />
        <div className="grid grid-cols-2 gap-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="bg-surface border border-border rounded-3xl p-4">
              <div className="text-3xl mb-2">{step.emoji}</div>
              <p className="text-[11px] font-bold text-primary mb-0.5">Paso {i + 1}</p>
              <p className="text-sm font-bold text-text-primary leading-snug">{step.title}</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section className="px-4 pt-8">
        <div className="bg-gradient-to-br from-secondary to-background border border-border/60 rounded-3xl p-5">
          <h3 className="text-base font-bold text-text-primary mb-4 text-center">
            Por qué elegir Tráelo Familia
          </h3>
          <div className="space-y-3">
            {TRUST_SIGNALS.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-accent">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">{t.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="px-4 pt-6 pb-10">
        <div className="bg-surface border border-border rounded-3xl px-5 py-6 text-center shadow-soft">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-base font-bold text-text-primary">¿Tienes dudas?</h3>
          <p className="text-sm text-text-secondary mt-1.5 max-w-xs mx-auto">
            Estamos disponibles por WhatsApp para ayudarte con tu pedido.
          </p>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-bold text-white shadow-soft transition-transform hover:scale-[1.02]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.59 5.99L0 24l6.21-1.63a11.96 11.96 0 0 0 5.85 1.49h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.41ZM12.07 21.84h-.01a9.94 9.94 0 0 1-5.07-1.39l-.36-.21-3.69.97.99-3.6-.23-.37a9.93 9.93 0 0 1-1.53-5.27c0-5.49 4.46-9.95 9.95-9.95 2.66 0 5.16 1.03 7.04 2.91a9.88 9.88 0 0 1 2.91 7.04c0 5.49-4.47 9.95-9.96 9.95Zm5.46-7.45c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46 0 1.45 1.06 2.85 1.21 3.05.15.2 2.09 3.19 5.07 4.47.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
            </svg>
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}

const HOW_IT_WORKS = [
  {
    emoji: '🎁',
    title: 'Elige el regalo',
    desc: 'Selecciona combos o productos para tu familia.',
  },
  {
    emoji: '📝',
    title: 'Completa los datos',
    desc: 'Tu WhatsApp y la dirección de tu familiar.',
  },
  {
    emoji: '💳',
    title: 'Paga por Zelle',
    desc: 'Te contactamos para coordinar el pago.',
  },
  {
    emoji: '🚀',
    title: 'Entregamos',
    desc: 'Tu familiar recibe el pedido en Güira de Melena.',
  },
]

const TRUST_SIGNALS = [
  {
    title: 'Entrega local garantizada',
    desc: 'Entregamos directamente en Güira de Melena.',
  },
  {
    title: 'Atención por WhatsApp',
    desc: 'Coordinamos todo contigo de forma personalizada.',
  },
  {
    title: 'Pago por Zelle',
    desc: 'Seguro y sin complicaciones desde cualquier lugar.',
  },
  {
    title: 'Negocios locales verificados',
    desc: 'Trabajamos solo con negocios de confianza en Güira.',
  },
]

function CategoryChip({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string
  emoji: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 ${
        active
          ? 'bg-gradient-primary text-white border-transparent shadow-btn-primary'
          : 'bg-surface text-text-primary border-border hover:border-primary/40'
      }`}
    >
      <span>{emoji}</span>
      {label}
    </button>
  )
}

function SectionTitle({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="flex items-center gap-2.5 text-[1.2rem] font-extrabold text-text-primary tracking-[-0.02em]">
        <span className="w-1.5 h-5 rounded-full bg-gradient-primary" aria-hidden="true" />
        {title}
      </h2>
      {action && <div className="pb-0.5">{action}</div>}
    </div>
  )
}
