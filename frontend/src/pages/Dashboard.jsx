
import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/overview");

      setDashboard(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-700">{error}</p>

        <button
          onClick={fetchDashboard}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const stats = [
    {
      title: "Total Products",
      value: dashboard.inventory.totalProducts,
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Sales",
      value: dashboard.sales.totalSales,
      icon: ShoppingCart,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Customers",
      value: dashboard.business.totalCustomers,
      icon: Users,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Low Stock Items",
      value: dashboard.inventory.lowStockProducts,
      icon: AlertTriangle,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Total Revenue",
      value: `Rs. ${Number(
        dashboard.sales.totalRevenue
      ).toLocaleString("en-PK")}`,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Total Purchases",
      value: dashboard.purchases.totalPurchases,
      icon: ShoppingBag,
      color: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* Page Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome to SmartStock Inventory Management System.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">

        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-500">
                    {item.title}
                  </p>

                  <h2 className="mt-3 break-words text-xl font-bold text-slate-800 sm:text-2xl">
                    {item.value}
                  </h2>
                </div>

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                >
                  <Icon size={24} />
                </div>

              </div>
            </div>
          );
        })}

      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Activity size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Inventory Items
              </p>

              <h3 className="text-xl font-bold text-slate-800">
                {Number(
                  dashboard.inventory.totalProducts || 0
                ).toLocaleString("en-PK")}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
              <AlertTriangle size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Products Requiring Attention
              </p>

              <h3 className="text-xl font-bold text-slate-800">
                {dashboard.inventory.lowStockProducts}
              </h3>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Recent Sales */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
            <div>
              <h2 className="font-semibold text-slate-800">
                Recent Sales
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest sales transactions
              </p>
            </div>

            <ShoppingCart className="text-blue-600" size={21} />
          </div>

          <div className="p-4 sm:p-5">

            {dashboard.recentSales.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No recent sales found.
              </p>
            ) : (
              dashboard.recentSales.map((sale) => (
                <div
                  key={sale._id}
                  className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 py-4 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-green-100 p-2 text-green-600">
                      <ArrowUpRight size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {sale.invoiceNumber}
                      </p>

                      <p className="text-xs text-slate-500">
                        Sales Invoice
                      </p>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-bold text-green-600">
                    Rs. {Number(sale.grandTotal).toLocaleString("en-PK")}
                  </p>
                </div>
              ))
            )}

          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
            <div>
              <h2 className="font-semibold text-slate-800">
                Recent Stock Movements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest inventory activities
              </p>
            </div>

            <Package className="text-purple-600" size={21} />
          </div>

          <div className="p-4 sm:p-5">

            {dashboard.recentMovements.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No recent stock movements found.
              </p>
            ) : (
              dashboard.recentMovements.map((movement) => (
                <div
                  key={movement._id}
                  className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 py-4 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-lg bg-purple-100 p-2 text-purple-600">
                      {movement.type === "in" ? (
                        <ArrowUpRight size={19} />
                      ) : (
                        <ArrowDownRight size={19} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {movement.product?.name || "Unknown Product"}
                      </p>

                      <p className="text-xs text-slate-500">
                        Stock Activity
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                    {movement.type}
                  </span>
                </div>
              ))
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
