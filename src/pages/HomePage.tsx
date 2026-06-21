import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";
import { useCart } from "../context/CartContext";
import { AddressBar } from "../components/address/AddressBar";
import { BusinessRail } from "../components/home/BusinessRail";
import { CategoryRail } from "../components/home/CategoryRail";
import { ProductCard } from "../components/product/ProductCard";
import { Pagination } from "../components/ui/Pagination";
import { Logo } from "../components/ui/Logo";
import { PaymentNote } from "../components/ui/PaymentNote";
import { ShareSection } from "../components/home/ShareSection";
import { ClosedTodayBanner } from "../components/home/ClosedTodayBanner";
import { ordersClosedForToday } from "../lib/hours";
import { formatPrice } from "../lib/format";
import { flyToCart } from "../lib/flyToCart";
import { hasAddons, hasOptions, hasPackaging } from "../lib/cart";
import type { Category, Product } from "../types";

const PAGE_SIZE = 20;

export function HomePage() {
  const { businesses, products, loading, syncing } = useCatalog();
  const [query, setQuery] = useState("");
  const [business, setBusiness] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "Todos">("Todos");
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const ordersClosed = ordersClosedForToday();

  // Modo búsqueda: al escribir se muestran SOLO resultados (sin negocios/categorías).
  const searchActive = query.trim() !== "";
  // Modo navegación por negocio/categoría.
  const browseActive = business !== null || category !== "Todos";

  const filtered = useMemo(() => {
    if (loading) return [];
    const q = query.trim().toLowerCase();
    if (q) {
      // Búsqueda global: ignora negocio/categoría seleccionados.
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.businessName.toLowerCase().includes(q),
      );
    }
    if (browseActive) {
      return products.filter((p) => {
        const matchBusiness = !business || p.businessId === business;
        const matchCategory = category === "Todos" || p.category === category;
        return matchBusiness && matchCategory;
      });
    }
    return [];
  }, [loading, query, business, category, browseActive, products]);

  // Reinicia la página al cambiar cualquier filtro.
  useEffect(() => {
    setPage(1);
  }, [query, business, category]);

  // Al seleccionar un negocio, baja con scroll suave hasta los productos.
  useEffect(() => {
    if (business) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [business]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <header className="bg-gradient-warm px-4 pt-4 pb-4 rounded-b-[1.75rem] border-b border-border/70">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
        </header>
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="w-7 h-7 border-[2.5px] border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-text-secondary">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeBiz = businesses.find((b) => b.id === business);
  const resultsTitle = searchActive
    ? "Resultados"
    : activeBiz
      ? activeBiz.name
      : category !== "Todos"
        ? category
        : "Resultados";

  function clearAll() {
    setQuery("");
    setBusiness(null);
    setCategory("Todos");
  }

  const resultsBlock = (
    <>
      {!searchActive && activeBiz?.paymentNote && (
        <div className="mb-3 rounded-2xl overflow-hidden border border-amber-100">
          <PaymentNote note={activeBiz.paymentNote} />
        </div>
      )}
      <SectionTitle
        title={resultsTitle}
        action={
          <span className="text-xs font-semibold text-text-secondary">
            {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          </span>
        }
      />
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-8 text-center">
          <span className="text-4xl">🔎</span>
          <h3 className="text-base font-bold text-text-primary mt-2">
            Sin resultados
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Prueba con otra palabra, categoría o negocio.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 items-stretch">
            {pageItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );

  return (
    <div className="animate-fade-in">
      {/* Navbar: solo logo + dirección */}
      <header className="bg-gradient-warm px-4 pt-4 pb-4 rounded-b-[1.75rem] border-b border-border/70">
        <div className="flex items-center gap-2">
          <Logo />
          <div className="ml-auto min-w-0">
            <AddressBar variant="pill" />
          </div>
        </div>
      </header>

      {syncing && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-medium text-text-secondary bg-stone-100/80 border-b border-border/30">
          <div className="w-2.5 h-2.5 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
          Actualizando catálogo...
        </div>
      )}

      <div className="px-4">
        {/* Buscador */}
        <form
          className="pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            inputRef.current?.blur();
          }}
        >
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando hoy?"
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-surface border border-border text-[15px] text-text-primary placeholder:text-text-secondary shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40"
              aria-label="Buscar productos"
            />
          </div>
        </form>

        {ordersClosed && <ClosedTodayBanner />}

        {searchActive ? (
          /* Modo búsqueda: solo resultados + limpiar */
          <section className="pt-5">
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 mb-3 text-sm font-bold text-primary"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Limpiar búsqueda
            </button>
            {resultsBlock}
          </section>
        ) : (
          <>
            {/* Destacados */}
            <FeaturedSection products={products} />

            {/* Negocios */}
            <section className="pt-5">
              <SectionTitle
                title="Negocios"
                action={
                  browseActive ? (
                    <button
                      onClick={clearAll}
                      className="text-xs font-bold text-primary"
                    >
                      Limpiar filtros
                    </button>
                  ) : undefined
                }
              />
              <BusinessRail
                businesses={businesses}
                selectedId={business}
                onSelect={setBusiness}
              />
            </section>

            {/* Categorías */}
            <section className="pt-5">
              <SectionTitle title="Categorías" />
              <CategoryRail selected={category} onSelect={setCategory} />
            </section>

            {/* Resultados (solo si hay negocio/categoría) o invitación */}
            <section ref={resultsRef} className="pt-6 scroll-mt-4">
              {browseActive ? resultsBlock : <StartHint />}
            </section>
          </>
        )}
      </div>
      <div className="px-4 pt-6">
        {/* Promo leve */}
        <div className="rounded-3xl bg-gradient-to-br from-secondary to-background border border-border/60 px-5 py-4 mb-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Entrega en Güira de Melena
          </span>
          <p className="text-[1.15rem] font-extrabold text-text-primary leading-snug">
            Hazle llegar una sonrisa<br />a tu familia.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {["Pago por Zelle", "Entrega garantizada", "Atención por WhatsApp"].map((t) => (
              <span key={t} className="flex items-center gap-1 text-[10.5px] font-semibold text-text-secondary">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-accent flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Cómo funciona */}
        <SectionTitle title="¿Cómo funciona?" />
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1 mb-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex-shrink-0 w-[130px] bg-surface border border-border rounded-2xl p-3">
              <span className="text-2xl">{step.emoji}</span>
              <p className="text-[10px] font-bold text-primary mt-1.5 mb-0.5">Paso {i + 1}</p>
              <p className="text-xs font-bold text-text-primary leading-snug">{step.title}</p>
              <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <ShareSection />
        <SupportSection />
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  { emoji: '🎁', title: 'Elige el regalo', desc: 'Combos o productos para tu familia.' },
  { emoji: '📝', title: 'Completa los datos', desc: 'Tu WhatsApp y la dirección de quien recibe.' },
  { emoji: '💳', title: 'Paga por Zelle', desc: 'Te contactamos para coordinar.' },
  { emoji: '🚀', title: 'Entregamos', desc: 'Directo en Güira de Melena.' },
]

const FEATURED_IDS = ['combo-papa', 'combo-001', 'combo-super']

function FeaturedSection({ products }: { products: Product[] }) {
  const hero = products.find((p) => p.id === 'combo-papa')
  const others = FEATURED_IDS.slice(1)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p)

  if (!hero) return null

  return (
    <section className="pt-5">
      <SectionTitle title="Destacados" />
      <FeaturedHeroCard product={hero} />
      {others.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {others.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}

function FeaturedHeroCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addItem, getQuantity } = useCart()
  const qty = getQuantity(product.id)
  const needsChoice = hasOptions(product) || hasAddons(product) || hasPackaging(product)
  const isOut = product.stockStatus === 'agotado'

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (isOut) return
    if (needsChoice) { navigate(`/producto/${product.id}`); return }
    flyToCart(e.currentTarget)
    addItem(product)
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group block rounded-3xl overflow-hidden border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 shadow-soft"
    >
      <div className="px-5 pt-5 pb-4">
        {/* Badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-700 text-[10px] font-bold mb-3">
          <span className="text-[11px]">🎁</span>
          Especial Día del Padre
        </span>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[1.1rem] font-extrabold text-text-primary leading-tight">
              {product.name}
            </h3>
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed line-clamp-2">
              {product.longDescription}
            </p>
            <p className="text-xs text-amber-700 font-semibold mt-1.5">
              El Mercadito
            </p>
          </div>
          <span className="text-5xl flex-shrink-0 leading-none">👨</span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">Precio</span>
            <p className="text-xl font-extrabold text-text-primary leading-none">
              {formatPrice(product.price)} <span className="text-sm font-bold text-text-secondary">USD</span>
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={isOut}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-40"
          >
            {qty > 0 ? (
              <>
                <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[11px] font-extrabold">{qty}</span>
                Añadir más
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                Añadir
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}

function StartHint() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
      <span className="text-5xl">🛍️</span>
      <h3 className="text-lg font-bold text-text-primary mt-3">
        Empieza tu pedido
      </h3>
      <p className="text-sm text-text-secondary mt-1.5 max-w-xs mx-auto">
        Selecciona un{" "}
        <span className="font-semibold text-text-primary">negocio</span>, elige
        una <span className="font-semibold text-text-primary">categoría</span> o
        usa el <span className="font-semibold text-text-primary">buscador</span>{" "}
        para ver los productos.
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="flex items-center gap-2.5 text-[1.35rem] font-extrabold text-text-primary tracking-[-0.02em]">
        <span
          className="w-1.5 h-6 rounded-full bg-gradient-primary"
          aria-hidden="true"
        />
        {title}
      </h2>
      {action && <div className="pb-0.5">{action}</div>}
    </div>
  );
}

function SupportSection() {
  return (
    <section className="pt-8 pb-8">
      <div className="rounded-3xl border border-border bg-surface px-6 py-8 text-center shadow-soft">
        <div className="text-5xl mb-3">💬</div>

        <h3 className="text-lg font-bold text-text-primary">
          ¿Necesitas ayuda?
        </h3>

        <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
          Si tienes dudas sobre cómo realizar un pedido, algún problema con la
          plataforma o necesitas asistencia, estamos disponibles para ayudarte.
        </p>

        <a
          href="https://wa.me/5358365388"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-white shadow-soft transition-transform hover:scale-[1.02]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.59 5.99L0 24l6.21-1.63a11.96 11.96 0 0 0 5.85 1.49h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.41ZM12.07 21.84h-.01a9.94 9.94 0 0 1-5.07-1.39l-.36-.21-3.69.97.99-3.6-.23-.37a9.93 9.93 0 0 1-1.53-5.27c0-5.49 4.46-9.95 9.95-9.95 2.66 0 5.16 1.03 7.04 2.91a9.88 9.88 0 0 1 2.91 7.04c0 5.49-4.47 9.95-9.96 9.95Zm5.46-7.45c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46 0 1.45 1.06 2.85 1.21 3.05.15.2 2.09 3.19 5.07 4.47.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
          </svg>
          Contactar por WhatsApp
        </a>
      </div>
    </section>
  );
}
