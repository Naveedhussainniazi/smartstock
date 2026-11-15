
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  ClipboardList,
  Search,
  RefreshCw,
  Eye,
  PackageCheck,
  XCircle,
  Plus,
  Trash2,
  ShoppingBag,
} from "lucide-react";

import {
  fetchPurchases,
  createPurchase,
  receivePurchase,
  cancelPurchase,
  clearPurchaseActionState,
  clearCreatePurchaseState,
} from "../features/purchases/purchasesSlice";

import { fetchSuppliers } from "../features/suppliers/suppliersSlice";
import { fetchProducts } from "../features/products/productsSlice";

function Purchases() {
  const dispatch = useDispatch();

  const {
    purchases,
    pagination,
    loading,
    error,
    actionLoading,
    actionError,
  } = useSelector((state) => state.purchases);

  const suppliers = useSelector(
    (state) => state.suppliers.suppliers || []
  );

  const products = useSelector(
    (state) => state.products.products || []
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // CREATE PURCHASE STATES
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState("");
  const [taxRate, setTaxRate] = useState(0);

  const [purchaseItems, setPurchaseItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadPurchases = () => {
    dispatch(
      fetchPurchases({
        page,
        limit: 10,
        search,
        ...(status && { status }),
      })
    );
  };

  useEffect(() => {
    loadPurchases();
  }, [dispatch, page, search, status]);

  // LOAD SUPPLIERS AND PRODUCTS WHEN MODAL OPENS
  useEffect(() => {
    if (showCreateModal) {
      dispatch(fetchSuppliers({ limit: 100 }));
      dispatch(fetchProducts({ limit: 100 }));
    }
  }, [showCreateModal, dispatch]);

  // CURRENCY FORMAT
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (purchaseStatus) => {
    const styles = {
      draft: "bg-yellow-100 text-yellow-700",
      received: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };

    return styles[purchaseStatus] || "bg-gray-100 text-gray-700";
  };

  // CALCULATE TOTALS
  const subtotal = purchaseItems.reduce(
    (total, item) => total + item.quantity * item.unitCost,
    0
  );

  const taxAmount = subtotal * (Number(taxRate) / 100);

  const grandTotal = subtotal + taxAmount;

  // HANDLE PRODUCT SELECTION
  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);

    const product = products.find(
      (item) => item._id === productId
    );

    if (product) {
      setUnitCost(product.purchasePrice ?? "");
    }
  };

  // ADD PRODUCT TO PURCHASE
  const handleAddItem = () => {
    setFormError("");

    if (!selectedProduct) {
      setFormError("Please select a product.");
      return;
    }

    const selected = products.find(
      (item) => item._id === selectedProduct
    );

    if (!selected) {
      setFormError("Selected product was not found.");
      return;
    }

    const parsedQuantity = Number(quantity);
    const parsedUnitCost = Number(unitCost);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      setFormError("Quantity must be at least 1.");
      return;
    }

    if (
      unitCost === "" ||
      !Number.isFinite(parsedUnitCost) ||
      parsedUnitCost < 0
    ) {
      setFormError("Please enter a valid unit cost.");
      return;
    }

    const alreadyAdded = purchaseItems.some(
      (item) => item.product === selectedProduct
    );

    if (alreadyAdded) {
      setFormError(
        "This product is already added. Remove it first if you want to change its quantity."
      );
      return;
    }

    setPurchaseItems((prev) => [
      ...prev,
      {
        product: selected._id,
        name: selected.name,
        sku: selected.sku,
        quantity: parsedQuantity,
        unitCost: parsedUnitCost,
      },
    ]);

    setSelectedProduct("");
    setQuantity(1);
    setUnitCost("");
  };

  // REMOVE PRODUCT
  const handleRemoveItem = (productId) => {
    setPurchaseItems((prev) =>
      prev.filter((item) => item.product !== productId)
    );
  };

  // RESET FORM
  const resetPurchaseForm = () => {
    setSelectedSupplier("");
    setSelectedProduct("");
    setQuantity(1);
    setUnitCost("");
    setTaxRate(0);
    setPurchaseItems([]);
    setFormError("");
  };

  // CREATE PURCHASE
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedSupplier) {
      setFormError("Please select a supplier.");
      return;
    }

    if (purchaseItems.length === 0) {
      setFormError("Please add at least one product.");
      return;
    }

    if (
      !Number.isFinite(Number(taxRate)) ||
      Number(taxRate) < 0 ||
      Number(taxRate) > 100
    ) {
      setFormError("Tax rate must be between 0 and 100.");
      return;
    }

    const purchaseData = {
      supplier: selectedSupplier,
      items: purchaseItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      taxRate: Number(taxRate),
    };

    try {
      setSubmitting(true);

      await dispatch(createPurchase(purchaseData)).unwrap();

      resetPurchaseForm();
      setShowCreateModal(false);
      dispatch(clearCreatePurchaseState());

      loadPurchases();
    } catch (err) {
      setFormError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to create purchase."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // RECEIVE PURCHASE
  const handleReceive = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to receive this purchase? Stock quantities will be updated."
    );

    if (!confirmed) return;

    try {
      await dispatch(receivePurchase(id)).unwrap();

      dispatch(clearPurchaseActionState());
      loadPurchases();
    } catch {
      // Error is displayed from Redux state.
    }
  };

  // CANCEL PURCHASE
  const handleCancel = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this draft purchase?"
    );

    if (!confirmed) return;

    try {
      await dispatch(cancelPurchase(id)).unwrap();

      dispatch(clearPurchaseActionState());
      loadPurchases();
    } catch {
      // Error is displayed from Redux state.
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Purchases
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage supplier purchases and stock receiving.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadPurchases}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={() => {
              resetPurchaseForm();
              dispatch(clearCreatePurchaseState());
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Create Purchase
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice number..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ACTION ERROR */}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* FETCH ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PURCHASE TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-200 p-4">
          <ClipboardList size={20} className="text-blue-600" />

          <h2 className="font-semibold text-gray-800">
            Purchase Records
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading purchases...
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList
              size={40}
              className="mx-auto mb-3 text-gray-300"
            />

            <p className="font-medium text-gray-700">
              No purchases found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Purchase records will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Supplier</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Grand Total</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {purchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {purchase.invoiceNumber}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {purchase.supplier?.name || "-"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {purchase.items?.length || 0}
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-800">
                        {formatCurrency(purchase.grandTotal)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(purchase.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            purchase.status
                          )}`}
                        >
                          {purchase.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setSelectedPurchase(purchase)
                            }
                            title="View details"
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye size={17} />
                          </button>

                          {purchase.status === "draft" && (
                            <>
                              <button
                                onClick={() =>
                                  handleReceive(purchase._id)
                                }
                                disabled={actionLoading}
                                title="Receive purchase"
                                className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                              >
                                <PackageCheck size={17} />
                              </button>

                              <button
                                onClick={() =>
                                  handleCancel(purchase._id)
                                }
                                disabled={actionLoading}
                                title="Cancel purchase"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <XCircle size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Total purchases: {pagination.totalPurchases}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of{" "}
                  {pagination.totalPages || 1}
                </span>

                <button
                  disabled={
                    page >= pagination.totalPages || loading
                  }
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE PURCHASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Create Purchase
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select supplier and add products.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetPurchaseForm();
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase}>
              <div className="space-y-6 p-5">
                {/* SUPPLIER */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Supplier *
                  </label>

                  <select
                    value={selectedSupplier}
                    onChange={(e) =>
                      setSelectedSupplier(e.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a supplier</option>

                    {suppliers.map((supplier) => (
                      <option
                        key={supplier._id}
                        value={supplier._id}
                      >
                        {supplier.name}
                        {supplier.company
                          ? ` - ${supplier.company}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {suppliers.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      No suppliers found. Please add a supplier first.
                    </p>
                  )}
                </div>

                {/* ADD PRODUCTS */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
                    <ShoppingBag size={18} className="text-blue-600" />
                    Add Products
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Select Product *
                      </label>

                      <select
                        value={selectedProduct}
                        onChange={(e) =>
                          handleProductSelect(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Choose a product</option>

                        {products.map((product) => (
                          <option
                            key={product._id}
                            value={product._id}
                          >
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Quantity *
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Unit Cost (PKR) *
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitCost}
                        onChange={(e) =>
                          setUnitCost(e.target.value)
                        }
                        placeholder="Enter unit cost"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    Add Product
                  </button>
                </div>

                {/* PURCHASE ITEMS */}
                <div>
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Purchase Items ({purchaseItems.length})
                  </h3>

                  {purchaseItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      No products added yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full min-w-[600px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Quantity</th>
                            <th className="px-4 py-3">Unit Cost</th>
                            <th className="px-4 py-3">Line Total</th>
                            <th className="px-4 py-3">Remove</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y">
                          {purchaseItems.map((item) => (
                            <tr key={item.product}>
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {item.name}
                                <p className="text-xs text-gray-400">
                                  {item.sku}
                                </p>
                              </td>

                              <td className="px-4 py-3">
                                {item.quantity}
                              </td>

                              <td className="px-4 py-3">
                                {formatCurrency(item.unitCost)}
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {formatCurrency(
                                  item.quantity * item.unitCost
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveItem(item.product)
                                  }
                                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                  title="Remove product"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* TAX AND TOTALS */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tax Rate (%)
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) =>
                        setTaxRate(e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Subtotal
                      </span>

                      <span className="font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-gray-500">
                        Tax ({taxRate || 0}%)
                      </span>

                      <span className="font-medium">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between border-t pt-3 font-bold text-gray-800">
                      <span>Grand Total</span>

                      <span className="text-blue-600">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FORM ERROR */}
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetPurchaseForm();
                  }}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    purchaseItems.length === 0 ||
                    !selectedSupplier
                  }
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create Purchase
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PURCHASE DETAILS MODAL */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Purchase Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedPurchase.invoiceNumber}
                </p>
              </div>

              <button
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <XCircle size={21} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedPurchase.supplier?.name || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="mt-1 font-medium capitalize text-gray-800">
                    {selectedPurchase.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Purchase Date</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {formatDate(selectedPurchase.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Received By</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedPurchase.receivedBy?.name || "-"}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[500px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Unit Cost</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {selectedPurchase.items?.map((item, index) => (
                      <tr key={item._id || index}>
                        <td className="px-4 py-3">
                          {item.name || item.product?.name || "-"}
                          <p className="text-xs text-gray-400">
                            {item.sku || item.product?.sku || ""}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          {item.quantity}
                        </td>

                        <td className="px-4 py-3">
                          {formatCurrency(item.unitCost)}
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>
                    {formatCurrency(selectedPurchase.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Tax ({selectedPurchase.taxRate || 0}%)
                  </span>

                  <span>
                    {formatCurrency(selectedPurchase.taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between border-t pt-3 font-bold text-gray-800">
                  <span>Grand Total</span>

                  <span>
                    {formatCurrency(selectedPurchase.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t p-5">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg bg-gray-800 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;
