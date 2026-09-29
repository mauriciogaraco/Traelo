import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { RefreshModal } from "./components/ui/RefreshModal";
import { useCatalogBootstrap } from "./hooks/useCatalogBootstrap";
import { useNotificationsBootstrap } from "./hooks/useNotificationsBootstrap";
import { usePointsBootstrap } from "./hooks/usePointsBootstrap";
import { useSessionBootstrap } from "./hooks/useSessionBootstrap";
import { ProductRoute } from "./pages/ProductRoute";

// Home carga con el bundle inicial; el resto de pantallas se baja al abrirlas (conexión limitada).
const CategoriesPage = lazy(() => import("./pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((m) => ({ default: m.SearchPage })));
const BusinessPage = lazy(() => import("./pages/BusinessPage").then((m) => ({ default: m.BusinessPage })));
const CartPage = lazy(() => import("./pages/CartPage").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const OrderPage = lazy(() => import("./pages/OrderPage").then((m) => ({ default: m.OrderPage })));
const OrdersPage = lazy(() => import("./pages/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const HelpPage = lazy(() => import("./pages/HelpPage").then((m) => ({ default: m.HelpPage })));
const AccountPage = lazy(() => import("./pages/AccountPage").then((m) => ({ default: m.AccountPage })));
const AddressesPage = lazy(() => import("./pages/AddressesPage").then((m) => ({ default: m.AddressesPage })));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage").then((m) => ({ default: m.DeleteAccountPage })));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const PointsPage = lazy(() => import("./pages/PointsPage").then((m) => ({ default: m.PointsPage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));

/** Arranque del catálogo (caché local + sincronización con el backend), una sola vez. */
function CatalogBootstrap() {
  useCatalogBootstrap();
  return null;
}

/**
 * Pantallas de una sola columna (formularios, pedidos, textos): en escritorio se centran en una
 * columna cómoda de leer en vez de estirarse a todo el ancho.
 */
function Narrow({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-content">{children}</div>;
}

function PageFallback() {
  return (
    <div role="status" aria-label="Cargando" className="flex justify-center py-16">
      <span className="w-7 h-7 rounded-full border-[2.5px] border-primary border-t-transparent motion-safe:animate-spin" />
    </div>
  );
}

/** Lee la sesión guardada al abrir (sin pedir login jamás: sin sesión la web queda como invitado). */
function SessionBootstrap() {
  useSessionBootstrap();
  return null;
}

/** Mantiene al día el saldo de puntos y las recompensas (ver `usePointsBootstrap`). */
function PointsBootstrap() {
  usePointsBootstrap();
  return null;
}

/** Alimenta el buzón local con los Web Push que recibe este navegador (ver `useNotificationsBootstrap`). */
function NotificationsBootstrap() {
  useNotificationsBootstrap();
  return null;
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CatalogBootstrap />
      <SessionBootstrap />
      <PointsBootstrap />
      <NotificationsBootstrap />
      {children}
    </ToastProvider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <span className="text-6xl mb-4">🧭</span>
      <h2 className="text-lg font-bold text-text-primary mb-2">
        Página no encontrada
      </h2>
      <Link to="/" className="text-primary font-bold underline">
        Volver al inicio
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <ScrollToTop />
        <RefreshModal />
        <AppShell>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/negocio/:id" element={<BusinessPage />} />
              <Route path="/producto/:id" element={<ProductRoute />} />
              <Route path="/carrito" element={<CartPage />} />
              <Route path="/checkout" element={<Narrow><CheckoutPage /></Narrow>} />
              <Route path="/cuenta" element={<AccountPage />} />
              <Route path="/direcciones" element={<AddressesPage />} />
              <Route path="/favoritos" element={<FavoritesPage />} />
              <Route path="/valoraciones" element={<Narrow><ReviewsPage /></Narrow>} />
              <Route path="/puntos" element={<Narrow><PointsPage /></Narrow>} />
              <Route path="/notificaciones" element={<Narrow><NotificationsPage /></Narrow>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar" element={<ForgotPasswordPage />} />
              <Route path="/pedidos" element={<Narrow><OrdersPage /></Narrow>} />
              <Route path="/pedido/:id" element={<Narrow><OrderPage /></Narrow>} />
              <Route path="/privacidad" element={<Narrow><PrivacyPage /></Narrow>} />
              <Route path="/ayuda" element={<Narrow><HelpPage /></Narrow>} />
              <Route path="/borrarusuario" element={<Narrow><DeleteAccountPage /></Narrow>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppShell>
      </Providers>
    </BrowserRouter>
  );
}
