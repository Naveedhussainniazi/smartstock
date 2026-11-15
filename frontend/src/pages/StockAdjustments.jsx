
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  X,
  Eye,
  Package,
  AlertCircle,
} from "lucide-react";

import { fetchProducts } from "../features/products/productsSlice";

import {
  fetchStockAdjustments,
  fetchStockAdjustmentById,
  createStockAdjustment,
  clearStockAdjustmentDetails,
} from "../features/stockAdjustments/stockAdjustmentsSlice";

function StockAdjustments() {
  const dispatch = useDispatch();

  const { products, loading: productsLoading } = useSelector(
    (state) => state.products
  );

  const {
    adjustments,
    pagination,
    loading,
    detailsLoading,
    currentAdjustment,
    error,
    saving,
  } = useSelector((state) => state.stockAdjustments);

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({
    product: "",
    type: "increase",
    quantity: "",
    reason: "",
    note: "",
  });

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // FETCH PRODUCTS
  useEffect(() => {
    dispatch(fetchProducts({ limit: 100 }));
  }, [dispatch]);

  // FETCH STOCK ADJUSTMENTS
  useEffect(() => {
    dispatch(
      fetchStockAdjustments({
        page,
        limit: 10,
        search: appliedSearch,
        type: filterType,
      })
    );
  }, [dispatch, page, appliedSearch, filterType]);

  const selectedProduct = products.find(
    (product) => product._id === formData.product
  );

  // INPUT HANDLER
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormError("");
  };

  // SEARCH HANDLER
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  // RESET FORM
  const resetForm = () => {
    setFormData({
      product: "",
      type: "increase",
      quantity: "",
      reason: "",
      note: "",
    });

    setFormError("");
  };

  // CREATE STOCK ADJUSTMENT
  const handleCreateAdjustment = async (e) => {
    e.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const quantity = Number(formData.quantity);

    if (!formData.product) {
      setFormError("Please select a product.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setFormError("Quantity must be a whole number greater than zero.");
      return;
    }

    if (!formData.reason.trim()) {
      setFormError("Please enter an adjustment reason.");
      return;
    }

    if (
      formData.type === "decrease" &&
      selectedProduct &&
      quantity > selectedProduct.quantity
    ) {
      setFormError(
        `Insufficient stock. Available quantity is ${selectedProduct.quantity}.`
      );
      return;
    }

    try {
      await dispatch(
        createStockAdjustment({
          product: formData.product,
          type: formData.type,
          quantity,
          reason: formData.reason.trim(),
          note: formData.note.trim(),
        })
      ).unwrap();

      setSuccessMessage("Stock adjustment created successfully.");

      resetForm();
      setShowForm(false);

      // Refresh products and adjustment history
      dispatch(fetchProducts({ limit: 100 }));

      dispatch(
        fetchStockAdjustments({
          page,
          limit: 10,
          search: appliedSearch,
          type: filterType,
        })
      );
    } catch (err) {
      setFormError(err || "Failed to create stock adjustment.");
    }
  };

  // VIEW ADJUSTMENT DETAILS
  const handleViewDetails = async (id) => {
    setShowDetails(true);
    dispatch(clearStockAdjustmentDetails());

    await dispatch(fetchStockAdjustmentById(id));
  };

  // REFRESH
  const handleRefresh = () => {
    dispatch(fetchProducts({ limit: 100 }));

    dispatch(
      fetchStockAdjustments({
        page,
        limit: 10,
        search: appliedSearch,
        type: filterType,
      })
    );
  };

  // CLOSE DETAILS
  const closeDetails = () => {
    setShowDetails(false);
    dispatch(clearStockAdjustmentDetails());
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Stock Adjustments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage manual stock increases and decreases.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          New Adjustment
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{successMessage}</span>

          <button onClick={() => setSuccessMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Adjustments
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {pagination.totalAdjustments || 0}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <ClipboardList size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Current Page
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {pagination.currentPage || 1} / {pagination.totalPages || 1}
              </h2>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <Package size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">

          <form
            onSubmit={handleSearch}
            className="flex flex-1 gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search adjustment number..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>

          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ADJUSTMENTS TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Adjustment No.</th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Previous Stock</th>
                <th className="px-5 py-4">New Stock</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-gray-500">
                    Loading stock adjustments...
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-gray-500">
                    No stock adjustments found.
                  </td>
                </tr>
              ) : (
                adjustments.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">

                    <td className="px-5 py-4 font-medium text-blue-600">
                      {item.adjustmentNumber}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {item.product?.name || "Unknown Product"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        SKU: {item.product?.sku || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.type === "increase"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.type === "increase" ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}

                        {item.type === "increase" ? "Increase" : "Decrease"}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.previousQuantity}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800">
                      {item.newQuantity}
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleViewDetails(item._id)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-gray-500">
            Total: {pagination.totalAdjustments || 0} adjustments
          </p>

          <div className="flex items-center gap-3">

            <button
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {pagination.currentPage || 1} of {pagination.totalPages || 1}
            </span>

            <button
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>
        </div>
      </div>

      {/* CREATE ADJUSTMENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  New Stock Adjustment
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Increase or decrease product stock.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-4 p-6">

              {formError && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="shrink-0" />
                  {formError}
                </div>
              )}

              {/* PRODUCT */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Select Product *
                </label>

                <select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  required
                  disabled={productsLoading}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    {productsLoading ? "Loading products..." : "Choose Product"}
                  </option>

                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* CURRENT STOCK */}
              {selectedProduct && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs text-blue-600">
                    Current Available Stock
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-800">
                    {selectedProduct.quantity} {selectedProduct.unit || "units"}
                  </p>
                </div>
              )}

              {/* ADJUSTMENT TYPE */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Adjustment Type *
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        type: "increase",
                      }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                      formData.type === "increase"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    <TrendingUp size={18} />
                    Increase
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        type: "decrease",
                      }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                      formData.type === "decrease"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    <TrendingDown size={18} />
                    Decrease
                  </button>

                </div>
              </div>

              {/* QUANTITY */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Quantity *
                </label>

                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  required
                  placeholder="Enter adjustment quantity"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* REASON */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Reason *
                </label>

                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  maxLength="500"
                  placeholder="e.g. Damaged items, physical stock count"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* NOTES */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>

                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  maxLength="1000"
                  rows="3"
                  placeholder="Optional notes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Adjustment"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUSTMENT DETAILS MODAL */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                Adjustment Details
              </h2>

              <button
                onClick={closeDetails}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">

              {detailsLoading ? (
                <p className="py-8 text-center text-gray-500">
                  Loading details...
                </p>
              ) : currentAdjustment?.adjustment ? (

                <div className="space-y-4">

                  <div>
                    <p className="text-xs text-gray-500">
                      Adjustment Number
                    </p>

                    <p className="mt-1 font-semibold text-blue-600">
                      {currentAdjustment.adjustment.adjustmentNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Product</p>

                    <p className="mt-1 font-medium text-gray-800">
                      {currentAdjustment.adjustment.product?.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      SKU: {currentAdjustment.adjustment.product?.sku}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="mt-1 font-medium capitalize">
                        {currentAdjustment.adjustment.type}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="mt-1 font-medium">
                        {currentAdjustment.adjustment.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Previous Stock</p>
                      <p className="mt-1 font-medium">
                        {currentAdjustment.adjustment.previousQuantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">New Stock</p>
                      <p className="mt-1 font-medium">
                        {currentAdjustment.adjustment.newQuantity}
                      </p>
                    </div>

                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="mt-1 text-sm text-gray-800">
                      {currentAdjustment.adjustment.reason}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="mt-1 text-sm text-gray-800">
                      {currentAdjustment.adjustment.note || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Created By</p>
                    <p className="mt-1 text-sm text-gray-800">
                      {currentAdjustment.adjustment.createdBy?.name || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="mt-1 text-sm text-gray-800">
                      {formatDate(currentAdjustment.adjustment.createdAt)}
                    </p>
                  </div>

                  {currentAdjustment.stockMovement && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-800">
                        Stock Movement Reference
                      </h3>

                      <p className="text-xs text-gray-600">
                        Movement Type: {currentAdjustment.stockMovement.type}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        Reference: {currentAdjustment.stockMovement.referenceModel}
                      </p>
                    </div>
                  )}

                </div>

              ) : (
                <p className="py-8 text-center text-gray-500">
                  Unable to load adjustment details.
                </p>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default StockAdjustments;
