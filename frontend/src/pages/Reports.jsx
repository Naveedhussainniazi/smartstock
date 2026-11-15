
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  BarChart3,
  ShoppingCart,
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  Layers,
  RefreshCw,
  Calendar,
  DollarSign,
  Printer,
  Download,
} from "lucide-react";

import {
  fetchSalesReport,
  fetchPurchaseReport,
  fetchInventoryReport,
  fetchLowStockReport,
  fetchTopSellingProducts,
  fetchCategorySalesReport,
} from "../features/reports/reportsSlice";

import { exportToCSV } from "../utils/exportCsv";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const reportTabs = [
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "purchases", label: "Purchases", icon: ShoppingBag },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "low-stock", label: "Low Stock", icon: AlertTriangle },
  { id: "top-selling", label: "Top Selling", icon: TrendingUp },
  { id: "category-sales", label: "Category Sales", icon: Layers },
];

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#9333ea",
  "#ef4444",
  "#0891b2",
];

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

function SummaryCard({ title, value, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 print:break-inside-avoid">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 break-words text-lg font-bold text-slate-800 sm:text-xl">
            {value}
          </h3>
        </div>

        <div className={`shrink-0 rounded-lg p-3 ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ReportTable({ columns, data = [], emptyMessage = "No records found." }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white print:break-inside-avoid">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key || column.label} className="whitespace-nowrap px-5 py-4">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item._id || item.productId || item.categoryId || index}>
                {columns.map((column) => (
                  <td
                    key={column.key || column.label}
                    className="whitespace-nowrap px-5 py-4 text-slate-700"
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 print:break-inside-avoid">
      <h3 className="mb-5 font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function Reports() {
  const dispatch = useDispatch();

  const {
    salesReport,
    purchaseReport,
    inventoryReport,
    lowStockReport,
    topSellingProducts,
    categorySalesReport,
    loading,
    error,
  } = useSelector((state) => state.reports);

  const [activeTab, setActiveTab] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReport = (tab = activeTab, dates = {}) => {
    switch (tab) {
      case "sales":
        dispatch(fetchSalesReport(dates));
        break;

      case "purchases":
        dispatch(fetchPurchaseReport(dates));
        break;

      case "inventory":
        dispatch(fetchInventoryReport());
        break;

      case "low-stock":
        dispatch(fetchLowStockReport());
        break;

      case "top-selling":
        dispatch(fetchTopSellingProducts(10));
        break;

      case "category-sales":
        dispatch(fetchCategorySalesReport());
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    dispatch(fetchSalesReport({}));
  }, [dispatch]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStartDate("");
    setEndDate("");
    loadReport(tab, {});
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      return;
    }

    loadReport(activeTab, {
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
  };

  const handleRefresh = () => {
    loadReport(activeTab, {
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const sales = salesReport?.summary || {};
  const purchases = purchaseReport?.summary || {};
  const inventory = inventoryReport || {};

  const dailySales = salesReport?.dailySales || [];
  const paymentMethods = salesReport?.paymentMethods || [];
  const dailyPurchases = purchaseReport?.dailyPurchases || [];

  const showDateFilters =
    activeTab === "sales" || activeTab === "purchases";

  // CSV EXPORT
  const handleExportCSV = () => {
    let rows = [];
    let columns = [];

    switch (activeTab) {
      case "sales":
        rows = dailySales;
        columns = [
          { key: "_id", label: "Date" },
          { key: "totalSales", label: "Total Sales" },
          { key: "revenue", label: "Revenue (PKR)" },
        ];
        break;

      case "purchases":
        rows = dailyPurchases;
        columns = [
          { key: "_id", label: "Date" },
          { key: "totalPurchases", label: "Total Purchases" },
          { key: "amount", label: "Purchase Amount (PKR)" },
        ];
        break;

      case "inventory":
        rows = inventoryReport ? [inventory] : [];
        columns = [
          { key: "totalProducts", label: "Total Products" },
          { key: "totalStockQuantity", label: "Stock Quantity" },
          { key: "lowStockProducts", label: "Low Stock Products" },
          { key: "outOfStockProducts", label: "Out of Stock" },
          { key: "totalPurchaseValue", label: "Purchase Value (PKR)" },
          { key: "totalSellingValue", label: "Selling Value (PKR)" },
        ];
        break;

      case "low-stock":
        rows = lowStockReport?.products || [];
        columns = [
          { key: "name", label: "Product" },
          { key: "sku", label: "SKU" },
          {
            label: "Category",
            value: (row) => row.category?.name || "Uncategorized",
          },
          { key: "quantity", label: "Current Stock" },
          { key: "minStockLevel", label: "Minimum Stock" },
          { key: "unit", label: "Unit" },
        ];
        break;

      case "top-selling":
        rows = topSellingProducts?.products || [];
        columns = [
          { key: "productName", label: "Product" },
          { key: "sku", label: "SKU" },
          { key: "totalQuantitySold", label: "Quantity Sold" },
          { key: "totalRevenue", label: "Revenue (PKR)" },
          { key: "totalOrders", label: "Orders" },
          { key: "currentStock", label: "Current Stock" },
        ];
        break;

      case "category-sales":
        rows = categorySalesReport?.categories || [];
        columns = [
          { key: "categoryName", label: "Category" },
          { key: "totalProducts", label: "Products Sold" },
          { key: "totalQuantitySold", label: "Quantity Sold" },
          { key: "totalRevenue", label: "Revenue (PKR)" },
          { key: "totalOrders", label: "Orders" },
        ];
        break;

      default:
        return;
    }

    const dateSuffix = showDateFilters
      ? `-${startDate || "all"}-to-${endDate || "present"}`
      : "";

    exportToCSV(
      `smartstock-${activeTab}-report${dateSuffix}`,
      rows,
      columns
    );
  };

  const activeReportLabel =
    reportTabs.find((tab) => tab.id === activeTab)?.label || "Report";

  const renderReportContent = () => {
    switch (activeTab) {
      case "sales":
        return (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard title="Total Sales" value={sales.totalSales || 0} icon={ShoppingCart} color="blue" />
              <SummaryCard title="Total Revenue" value={formatCurrency(sales.totalRevenue)} icon={DollarSign} color="green" />
              <SummaryCard title="Total Discount" value={formatCurrency(sales.totalDiscount)} icon={DollarSign} color="orange" />
              <SummaryCard title="Average Sale" value={formatCurrency(sales.averageSale)} icon={BarChart3} color="purple" />
            </div>

            <ChartCard title="Sales Revenue Trend">
              {dailySales.length > 0 ? (
                <div className="h-[260px] w-full sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">No sales data available for chart.</p>
              )}
            </ChartCard>

            <ChartCard title="Daily Sales">
              {dailySales.length > 0 ? (
                <div className="h-[260px] w-full sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalSales" name="Total Sales" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">No sales data available for chart.</p>
              )}
            </ChartCard>

            <ChartCard title="Payment Methods Distribution">
              {paymentMethods.length > 0 ? (
                <div className="h-[280px] w-full sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        dataKey="totalSales"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius="65%"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethods.map((item, index) => (
                          <Cell key={item._id || index} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">No payment data available for chart.</p>
              )}
            </ChartCard>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Daily Sales Details</h3>
              <ReportTable
                columns={[
                  { key: "_id", label: "Date" },
                  { key: "totalSales", label: "Total Sales" },
                  { key: "revenue", label: "Revenue", render: (value) => formatCurrency(value) },
                ]}
                data={dailySales}
                emptyMessage="No sales found for this period."
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Payment Methods Details</h3>
              <ReportTable
                columns={[
                  { key: "_id", label: "Payment Method" },
                  { key: "totalSales", label: "Total Transactions" },
                  { key: "revenue", label: "Revenue", render: (value) => formatCurrency(value) },
                ]}
                data={paymentMethods}
              />
            </div>
          </>
        );

      case "purchases":
        return (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard title="Total Purchases" value={purchases.totalPurchases || 0} icon={ShoppingBag} color="blue" />
              <SummaryCard title="Purchase Amount" value={formatCurrency(purchases.totalPurchaseAmount)} icon={DollarSign} color="green" />
              <SummaryCard title="Total Tax" value={formatCurrency(purchases.totalTax)} icon={DollarSign} color="orange" />
              <SummaryCard title="Average Purchase" value={formatCurrency(purchases.averagePurchase)} icon={BarChart3} color="purple" />
            </div>

            <ChartCard title="Daily Purchase Trend">
              {dailyPurchases.length > 0 ? (
                <div className="h-[260px] w-full sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyPurchases}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" name="Purchase Amount" fill="#9333ea" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">No purchase data available for chart.</p>
              )}
            </ChartCard>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Daily Purchase Details</h3>
              <ReportTable
                columns={[
                  { key: "_id", label: "Date" },
                  { key: "totalPurchases", label: "Total Purchases" },
                  { key: "amount", label: "Amount", render: (value) => formatCurrency(value) },
                ]}
                data={dailyPurchases}
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Supplier-wise Purchases</h3>
              <ReportTable
                columns={[
                  { key: "supplierName", label: "Supplier" },
                  { key: "totalPurchases", label: "Purchases" },
                  { key: "amount", label: "Amount", render: (value) => formatCurrency(value) },
                ]}
                data={purchaseReport?.supplierWise || []}
              />
            </div>
          </>
        );

      case "inventory":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard title="Total Products" value={inventory.totalProducts || 0} icon={Package} />
            <SummaryCard title="Stock Quantity" value={inventory.totalStockQuantity || 0} icon={Layers} color="green" />
            <SummaryCard title="Low Stock Products" value={inventory.lowStockProducts || 0} icon={AlertTriangle} color="orange" />
            <SummaryCard title="Out of Stock" value={inventory.outOfStockProducts || 0} icon={AlertTriangle} color="red" />
            <SummaryCard title="Purchase Value" value={formatCurrency(inventory.totalPurchaseValue)} icon={DollarSign} color="purple" />
            <SummaryCard title="Selling Value" value={formatCurrency(inventory.totalSellingValue)} icon={DollarSign} color="green" />
          </div>
        );

      case "low-stock":
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800">Low Stock Products</h3>
            <ReportTable
              columns={[
                { key: "name", label: "Product" },
                { key: "sku", label: "SKU" },
                { key: "category", label: "Category", render: (value) => value?.name || "Uncategorized" },
                { key: "quantity", label: "Current Stock" },
                { key: "minStockLevel", label: "Minimum Stock" },
                { key: "unit", label: "Unit" },
              ]}
              data={lowStockReport?.products || []}
              emptyMessage="No low stock products found."
            />
          </div>
        );

      case "top-selling":
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800">Top Selling Products</h3>
            <ReportTable
              columns={[
                { key: "productName", label: "Product" },
                { key: "sku", label: "SKU" },
                { key: "totalQuantitySold", label: "Quantity Sold" },
                { key: "totalRevenue", label: "Revenue", render: (value) => formatCurrency(value) },
                { key: "totalOrders", label: "Orders" },
                { key: "currentStock", label: "Current Stock" },
              ]}
              data={topSellingProducts?.products || []}
              emptyMessage="No sales data available yet."
            />
          </div>
        );

      case "category-sales":
        return (
          <>
            <ChartCard title="Category-wise Revenue">
              {categorySalesReport?.categories?.length > 0 ? (
                <div className="h-[280px] w-full sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySalesReport.categories}
                        dataKey="totalRevenue"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius="65%"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categorySalesReport.categories.map((item, index) => (
                          <Cell key={item.categoryId || index} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">No category sales data available.</p>
              )}
            </ChartCard>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Category Sales Details</h3>
              <ReportTable
                columns={[
                  { key: "categoryName", label: "Category" },
                  { key: "totalProducts", label: "Products Sold" },
                  { key: "totalQuantitySold", label: "Quantity Sold" },
                  { key: "totalRevenue", label: "Revenue", render: (value) => formatCurrency(value) },
                  { key: "totalOrders", label: "Orders" },
                ]}
                data={categorySalesReport?.categories || []}
                emptyMessage="No category sales data available yet."
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .no-print {
              display: none !important;
            }

            #report-print-area {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            #report-print-area .recharts-responsive-container {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              page-break-inside: avoid;
            }

            #report-print-area .recharts-wrapper {
              max-width: 100% !important;
            }

            #report-print-area table {
              width: 100% !important;
              min-width: 0 !important;
              border-collapse: collapse !important;
            }

            #report-print-area th,
            #report-print-area td {
              border: 1px solid #cbd5e1 !important;
              padding: 6px !important;
              white-space: normal !important;
              font-size: 9px !important;
            }

            #report-print-area .shadow-sm {
              box-shadow: none !important;
            }

            #report-print-area > * {
              break-inside: avoid;
            }
          }
        `}
      </style>

      {/* PAGE HEADER */}
      <div className="no-print flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze your business performance and inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:px-4"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:px-4"
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:px-4"
          >
            <Printer size={17} />
            Print Report
          </button>
        </div>
      </div>

      {/* REPORT TABS */}
      <div className="no-print flex min-w-0 gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* DATE FILTERS */}
      {showDateFilters && (
        <form
          onSubmit={handleApplyFilters}
          className="no-print flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-600">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Calendar size={16} />
            Apply Filters
          </button>
        </form>
      )}

      {/* ERROR */}
      {error && (
        <div className="no-print rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* REPORT CONTENT */}
      {loading ? (
        <div className="no-print flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <RefreshCw className="animate-spin text-blue-600" size={28} />
          <span className="ml-3 text-slate-600">Loading report...</span>
        </div>
      ) : (
        <div id="report-print-area" className="min-w-0 space-y-6">
          {/* PRINT HEADING */}
          <div className="hidden border-b border-slate-300 pb-4 print:block">
            <h1 className="text-2xl font-bold text-slate-900">SmartStock</h1>

            <p className="mt-1 text-lg font-semibold text-slate-700">
              {activeReportLabel} Report
            </p>

            {showDateFilters && (
              <p className="mt-1 text-sm text-slate-600">
                Period: {startDate || "All dates"} to {endDate || "Present"}
              </p>
            )}

            <p className="mt-1 text-xs text-slate-500">
              Generated: {new Date().toLocaleString("en-PK")}
            </p>
          </div>

          {renderReportContent()}
        </div>
      )}
    </div>
  );
}

export default Reports;
