
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  X,
  Trash2,
  CheckCircle,
  Printer,
} from "lucide-react";

import { fetchProducts } from "../features/products/productsSlice";
import { fetchCustomers } from "../features/customers/customersSlice";

import {
  fetchSales,
  createSale,
  completeSale,
  searchSalesByInvoice,
  clearSearchResults,
  clearCreateSaleState,
} from "../features/sales/salesSlice";

const emptyItem = { product: "", quantity: 1 };

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

function Sales() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, loading: productsLoading } = useSelector(
    (state) => state.products
  );

  const { customers, loading: customersLoading } = useSelector(
    (state) => state.customers
  );

  const {
    sales,
    totalSales,
    loading: salesLoading,
    error: salesError,
    createLoading,
    createError,
    completeLoading,
    completeError,
    searchResults,
    searchLoading,
  } = useSelector((state) => state.sales);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    customer: "",
    items: [{ ...emptyItem }],
    discount: 0,
    taxRate: 0,
    paymentMethod: "cash",
    paymentStatus: "paid",
  });

  useEffect(() => {
    dispatch(fetchProducts({ limit: 100 }));
    dispatch(fetchCustomers({ limit: 100 }));
    dispatch(fetchSales({ limit: 20 }));
  }, [dispatch]);

  const activeProducts = products.filter(
    (product) => product.isActive !== false
  );

  const subtotal = useMemo(() => {
    return formData.items.reduce((total, item) => {
      const product = activeProducts.find(
        (product) => product._id === item.product
      );

      return total + (product?.sellingPrice || 0) * Number(item.quantity || 0);
    }, 0);
  }, [formData.items, activeProducts]);

  const discount = Math.max(0, Number(formData.discount) || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount =
    (taxableAmount * (Number(formData.taxRate) || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const displayedSales = searchTerm.trim() ? searchResults : sales;

  const handleItemChange = (index, field, value) => {
    setFormData((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return { ...previous, items: updatedItems };
    });
  };

  const addItem = () => {
    setFormData((previous) => ({
      ...previous,
      items: [...previous.items, { ...emptyItem }],
    }));
  };

  const removeItem = (index) => {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      customer: "",
      items: [{ ...emptyItem }],
      discount: 0,
      taxRate: 0,
      paymentMethod: "cash",
      paymentStatus: "paid",
    });
  };

  const handleCreateSale = async (event) => {
    event.preventDefault();

    const validItems = formData.items.filter(
      (item) => item.product && Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      alert("Please select at least one product.");
      return;
    }

    const hasDuplicateProducts =
      new Set(validItems.map((item) => item.product)).size !==
      validItems.length;

    if (hasDuplicateProducts) {
      alert("Duplicate products are not allowed. Please update the quantities.");
      return;
    }

    if (discount > subtotal) {
      alert("Discount cannot be greater than subtotal.");
      return;
    }

    const payload = {
      customer: formData.customer || null,
      items: validItems.map((item) => ({
        product: item.product,
        quantity: Number(item.quantity),
      })),
      discount,
      taxRate: Number(formData.taxRate) || 0,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
    };

    try {
      await dispatch(createSale(payload)).unwrap();

      setShowModal(false);
      resetForm();

      dispatch(fetchSales({ limit: 20 }));
      dispatch(clearCreateSaleState());
    } catch (error) {
      console.error("Create sale error:", error);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      dispatch(clearSearchResults());
      return;
    }

    dispatch(searchSalesByInvoice(searchTerm.trim()));
  };

  const handleRefresh = () => {
    setSearchTerm("");
    dispatch(clearSearchResults());
    dispatch(fetchSales({ limit: 20 }));
    dispatch(fetchProducts({ limit: 100 }));
    dispatch(fetchCustomers({ limit: 100 }));
  };

  const handleCompleteSale = async (saleId) => {
    const confirmed = window.confirm(
      "Complete this sale? Product stock will be deducted."
    );

    if (!confirmed) return;

    try {
      await dispatch(completeSale(saleId)).unwrap();

      dispatch(fetchSales({ limit: 20 }));
      dispatch(fetchProducts({ limit: 100 }));
    } catch (error) {
      console.error("Complete sale error:", error);
    }
  };

  // OPEN INVOICE FOR PRINT PREVIEW
  const handlePrintInvoice = (saleId) => {
    navigate(`/sales/${saleId}?print=true`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Sales Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage sales, invoices and customer transactions.
          </p>
        </div>

        <button
          onClick={() => {
            dispatch(clearCreateSaleState());
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create New Sale
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <ShoppingCart size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Sales</p>
              <h2 className="text-2xl font-bold text-slate-800">
                {totalSales}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Products Available</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {products.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Customers</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {customers.length}
          </h2>
        </div>
      </div>

      {/* Sales Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-800">Recent Sales</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your sales transactions.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search invoice..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56"
              />
            </div>

            <button
              onClick={handleSearch}
              className="rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
              title="Search"
            >
              <Search size={18} />
            </button>

            <button
              onClick={handleRefresh}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {salesError && (
          <p className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {salesError}
          </p>
        )}

        {completeError && (
          <p className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {completeError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {salesLoading || searchLoading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                    Loading sales...
                  </td>
                </tr>
              ) : displayedSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                    No sales found.
                  </td>
                </tr>
              ) : (
                displayedSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {sale.invoiceNumber}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {sale.customerName || "Walk-in Customer"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {formatCurrency(sale.grandTotal)}
                    </td>

                    <td className="px-5 py-4 capitalize text-slate-600">
                      {sale.paymentStatus}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          sale.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : sale.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintInvoice(sale._id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          <Printer size={14} />
                          Print Invoice
                        </button>

                        {sale.status === "draft" && (
                          <button
                            disabled={completeLoading}
                            onClick={() => handleCompleteSale(sale._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Create New Sale
                </h2>
                <p className="text-sm text-slate-500">
                  Add customer and products to create an invoice.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-5 p-5">
              {createError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {createError}
                </p>
              )}

              {/* Customer */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer
                </label>

                <select
                  value={formData.customer}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      customer: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Products
                  </label>

                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>

                {formData.items.map((item, index) => {
                  const selectedProduct = activeProducts.find(
                    (product) => product._id === item.product
                  );

                  return (
                    <div
                      key={index}
                      className="mb-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-6">
                        <label className="mb-1 block text-xs text-slate-500">
                          Product
                        </label>

                        <select
                          required
                          value={item.product}
                          onChange={(event) =>
                            handleItemChange(index, "product", event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">Select Product</option>
                          {activeProducts.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-slate-500">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(event) =>
                            handleItemChange(index, "quantity", event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs text-slate-500">
                          Unit Price
                        </label>

                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {formatCurrency(selectedProduct?.sellingPrice || 0)}
                        </p>
                      </div>

                      <div className="flex items-end justify-end sm:col-span-1">
                        <button
                          type="button"
                          disabled={formData.items.length === 1}
                          onClick={() => removeItem(index)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                          title="Remove product"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {selectedProduct && (
                        <p className="text-xs text-slate-500 sm:col-span-12">
                          Available stock: {selectedProduct.quantity}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Discount and Tax */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Discount (PKR)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        discount: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tax Rate (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        taxRate: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={formData.paymentMethod}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        paymentMethod: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment Status
                  </label>

                  <select
                    value={formData.paymentStatus}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        paymentStatus: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="space-y-2 rounded-lg bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount</span>
                  <span>{formatCurrency(discount)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax ({formData.taxRate || 0}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-800">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading || productsLoading || customersLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;
