import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { OrderFormPage } from "./pages/OrderFormPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { RootLayout } from "./layouts/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "productos", Component: ProductsPage },
      { path: "productos/:id", Component: ProductDetailPage },
      { path: "carrito", Component: CartPage },
      { path: "pedido", Component: OrderFormPage },
      { path: "confirmacion", Component: ConfirmationPage },
      { path: "login", Component: LoginPage },
      { path: "perfil", Component: ProfilePage },
      { path: "admin", Component: AdminDashboardPage },
    ],
  },
]);
