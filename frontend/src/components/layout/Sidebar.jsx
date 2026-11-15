
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  BarChart3,
  Boxes,
  ClipboardList,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "Categories", path: "/categories", icon: Tags },

  {
    name: "Purchases",
    path: "/purchases",
    icon: ShoppingBag,
    adminOnly: true,
  },

  { name: "Sales", path: "/sales", icon: ShoppingCart },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Suppliers", path: "/suppliers", icon: Truck },

  {
    name: "Stock Movements",
    path: "/stock-movements",
    icon: Boxes,
  },

  {
    name: "Stock Adjustments",
    path: "/stock-adjustments",
    icon: ClipboardList,
    adminOnly: true,
  },

  {
    name: "Reports",
    path: "/reports",
    icon: BarChart3,
    adminOnly: true,
  },
];

function Sidebar({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);

  // Admin-only menu filtering
  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  return (
    <aside
      className={`
        fixed left-0 top-0 z-50 flex h-screen w-64 flex-col
        bg-slate-900 text-white shadow-xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold">
            Smart<span className="text-blue-400">Stock</span>
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Inventory Management System
          </p>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 px-6 py-4">
        <p className="text-xs text-slate-400">
          SmartStock v1.0<br />
          NHTECH | All rights reserved.
          
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
