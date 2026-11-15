
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import PublicRoute from "./components/layout/PublicRoute";

import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import SaleDetails from "./pages/SaleDetails";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import StockMovements from "./pages/StockMovements";
import StockAdjustments from "./pages/StockAdjustments";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Admin + Staff Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/:id" element={<SaleDetails />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/stock-movements" element={<StockMovements />} />
          </Route>
        </Route>

        {/* Admin Only Routes */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<MainLayout />}>
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/stock-adjustments" element={<StockAdjustments />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
