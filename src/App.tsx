import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { AddressProvider } from "./context/AddressContext";
import { CartProvider } from "./context/CartContext";
import { OrdersProvider } from "./context/OrdersContext";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrdersPage } from "./pages/OrdersPage";
//import { ComingSoonModal } from "./pages/CommingSoonModal";

function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AddressProvider>
        <OrdersProvider>
          <CartProvider>{children}</CartProvider>
        </OrdersProvider>
      </AddressProvider>
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
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/producto/:id" element={<ProductDetailPage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/pedidos" element={<OrdersPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </Providers>
    </BrowserRouter>
  );
}
