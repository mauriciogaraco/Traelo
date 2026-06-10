import { useEffect, useMemo, useRef, useState } from "react";
import { products, businesses } from "../data/catalog";
import { AddressBar } from "../components/address/AddressBar";
import { BusinessRail } from "../components/home/BusinessRail";
import { CategoryRail } from "../components/home/CategoryRail";
import { ProductCard } from "../components/product/ProductCard";
import { Pagination } from "../components/ui/Pagination";
import { Logo } from "../components/ui/Logo";
import { PaymentNote } from "../components/ui/PaymentNote";
import type { Category } from "../types";

const PAGE_SIZE = 20;

export function HomePage() {
  const [query, setQuery] = useState("");
  const [business, setBusiness] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "Todos">("Todos");
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modo búsqueda: al escribir se muestran SOLO resultados (sin negocios/categorías).
  const searchActive = query.trim() !== "";
  // Modo navegación por negocio/categoría.
  const browseActive = business !== null || category !== "Todos";

  const filtered = useMemo(() => {
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
  }, [query, business, category, browseActive]);

  // Reinicia la página al cambiar cualquier filtro.
  useEffect(() => {
    setPage(1);
  }, [query, business, category]);

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

      <div className="px-4">
        {/* Buscador con botón */}
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
            {/** add a commit */}
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
            <section className="pt-6">
              {browseActive ? resultsBlock : <StartHint />}
            </section>
          </>
        )}
      </div>
    </div>
  );
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
