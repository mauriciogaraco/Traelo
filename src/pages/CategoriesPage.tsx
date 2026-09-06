import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";
import { AddressBar } from "../components/address/AddressBar";
import { BusinessRail } from "../components/home/BusinessRail";
import { BusinessCategoryGrid } from "../components/categories/BusinessCategoryGrid";
import { ProductCard } from "../components/product/ProductCard";
import { Pagination } from "../components/ui/Pagination";
import { Logo } from "../components/ui/Logo";
import { PaymentNote } from "../components/ui/PaymentNote";
import { businessCategories, productCategoryHints } from "../data/catalog";
import type { BusinessCategory } from "../types";

const PAGE_SIZE = 20;

export function CategoriesPage() {
  const { businesses: allBusinesses, products: allProducts, loading, loadBusinessProducts } = useCatalog();
  const businesses = allBusinesses.filter((b) => !b.hidden);
  const products = allProducts.filter((p) => !allBusinesses.find((b) => b.id === p.businessId)?.hidden);
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef<HTMLElement>(null);

  const catParam = searchParams.get("cat") as BusinessCategory | null;
  const cat = catParam && businessCategories.includes(catParam) ? catParam : null;
  const business = searchParams.get("negocio");
  const page = parseInt(searchParams.get("pagina") ?? "1", 10);

  function setCat(next: BusinessCategory | null) {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      next ? n.set("cat", next) : n.delete("cat");
      n.delete("negocio");
      n.delete("pagina");
      return n;
    }, { replace: true });
  }
  function setBusiness(id: string | null) {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      id ? n.set("negocio", id) : n.delete("negocio");
      n.delete("pagina");
      return n;
    }, { replace: true });
  }
  function setPage(pg: number) {
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      pg > 1 ? n.set("pagina", String(pg)) : n.delete("pagina");
      return n;
    }, { replace: true });
  }

  const categoryBusinesses = useMemo(
    () => (cat ? businesses.filter((b) => b.businessCategories?.includes(cat)) : []),
    [businesses, cat],
  );

  const filtered = useMemo(() => {
    // Sin negocio elegido no hay resultados: primero se elige un negocio de la categoría.
    if (!cat || !business) return [];
    const hints = productCategoryHints[cat];
    const bizProducts = products.filter((p) => p.businessId === business);
    const hinted = hints ? bizProducts.filter((p) => hints.includes(p.category)) : bizProducts;
    // Si el negocio no tiene productos que calcen con la pista, se muestran todos (evita vacíos).
    const result = hints && hinted.length === 0 ? bizProducts : hinted;

    return [...result].sort(
      (a, b) => Number(a.stockStatus === "agotado") - Number(b.stockStatus === "agotado"),
    );
  }, [cat, business, products]);

  useEffect(() => {
    if (business && !loading) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      loadBusinessProducts(business);
    }
  }, [business, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header />
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

  return (
    <div className="animate-fade-in">
      <Header />

      <div className="px-4 pt-4">
        {!cat ? (
          <>
            <SectionTitle title="Categorías" />
            <BusinessCategoryGrid businesses={businesses} />
          </>
        ) : (
          <>
            <button
              onClick={() => setCat(null)}
              className="inline-flex items-center gap-1.5 mb-3 text-sm font-bold text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Categorías
            </button>

            <SectionTitle
              title={cat}
              action={
                business ? (
                  <button onClick={() => setBusiness(null)} className="text-xs font-bold text-primary">
                    Cambiar negocio
                  </button>
                ) : undefined
              }
            />
            <BusinessRail businesses={categoryBusinesses} selectedId={business} onSelect={setBusiness} />

            <section ref={resultsRef} className="pt-6 scroll-mt-4">
              {!business ? (
                <div className="rounded-3xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
                  <span className="text-4xl">👆</span>
                  <h3 className="text-base font-bold text-text-primary mt-2">Elige un negocio</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Selecciona uno de los negocios de arriba para ver sus productos de {cat.toLowerCase()}.
                  </p>
                </div>
              ) : (
                <>
                  {activeBiz?.paymentNote && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-amber-100">
                      <PaymentNote note={activeBiz.paymentNote} />
                    </div>
                  )}
                  <SectionTitle
                    title={activeBiz ? activeBiz.name : "Productos"}
                    action={
                      <span className="text-xs font-semibold text-text-secondary">
                        {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
                      </span>
                    }
                  />
                  {filtered.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-8 text-center">
                      <span className="text-4xl">🔎</span>
                      <h3 className="text-base font-bold text-text-primary mt-2">Sin resultados</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Este negocio todavía no tiene productos en esta categoría.
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
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-gradient-warm px-4 pt-4 pb-4 rounded-b-[1.75rem] border-b border-border/70">
      <div className="flex items-center gap-2">
        <Logo />
        <div className="ml-auto min-w-0">
          <AddressBar variant="pill" />
        </div>
      </div>
    </header>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="flex items-center gap-2.5 text-[1.35rem] font-extrabold text-text-primary tracking-[-0.02em]">
        <span className="w-1.5 h-6 rounded-full bg-gradient-primary" aria-hidden="true" />
        {title}
      </h2>
      {action && <div className="pb-0.5">{action}</div>}
    </div>
  );
}
