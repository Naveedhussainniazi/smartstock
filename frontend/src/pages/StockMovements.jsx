
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Search,
  RefreshCw,
  Package,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  fetchStockMovements,
  fetchProductStockHistory,
  clearStockHistory,
} from "../features/stockMovements/stockMovementsSlice";

function StockMovements() {
  const dispatch = useDispatch();

  const {
    movements,
    pagination,
    currentProductHistory,
    loading,
    historyLoading,
    error,
    historyError,
  } = useSelector((state) => state.stockMovements);

  const [page, setPage] = useState(1);
  const [productNameFilter, setProductNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);

  const limit = 10;

  // FETCH STOCK MOVEMENTS
  useEffect(() => {
    const params = {
      page,
      limit,
    };

    if (productNameFilter.trim()) {
      params.productName = productNameFilter.trim();
    }

    if (typeFilter) {
      params.type = typeFilter;
    }

    dispatch(fetchStockMovements(params));
  }, [dispatch, page, productNameFilter, typeFilter]);

  // FILTER HANDLER
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  // OPEN PRODUCT HISTORY
  const openProductHistory = (productId) => {
    setSelectedProductId(productId);
    dispatch(fetchProductStockHistory(productId));
  };

  // CLOSE PRODUCT HISTORY
  const closeHistory = () => {
    setSelectedProductId(null);
    dispatch(clearStockHistory());
  };

  // MOVEMENT BADGE
  const getMovementBadge = (type) => {
    const styles = {
      purchase: "bg-green-100 text-green-700",
      sale: "bg-red-100 text-red-700",
      adjustment: "bg-blue-100 text-blue-700",
      return: "bg-purple-100 text-purple-700",
    };

    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
          styles[type] || "bg-slate-100 text-slate-700"
        }`}
      >
        {type}
      </span>
    );
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString();
  };

  // REFERENCE NUMBER
  const getReferenceNumber = (reference) => {
    if (!reference) return "N/A";

    return (
      reference.invoiceNumber ||
      reference.purchaseNumber ||
      reference.adjustmentNumber ||
      reference._id ||
      "N/A"
    );
  };

  // REFRESH MOVEMENTS
  const handleRefresh = () => {
    const params = {
      page,
      limit,
    };

    if (productNameFilter.trim()) {
      params.productName = productNameFilter.trim();
    }

    if (typeFilter) {
      params.type = typeFilter;
    }

    dispatch(fetchStockMovements(params));
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Stock Movements
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Track all inventory stock transactions and product history.
        </p>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        {/* PRODUCT NAME FILTER */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Search Product Name
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={productNameFilter}
              onChange={(e) =>
                handleFilterChange(setProductNameFilter, e.target.value)
              }
              placeholder="Enter product name..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* MOVEMENT TYPE FILTER */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Movement Type
          </label>

          <select
            value={typeFilter}
            onChange={(e) =>
              handleFilterChange(setTypeFilter, e.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Movements</option>
            <option value="purchase">Purchase / Stock In</option>
            <option value="sale">Sale / Stock Out</option>
            <option value="adjustment">Adjustment</option>
            <option value="return">Return</option>
          </select>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* MOVEMENT TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <History size={20} className="text-blue-600" />

            <h2 className="font-semibold text-slate-800">
              Movement History
            </h2>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading stock movements...
          </div>
        ) : movements.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-10 text-center">
            <Package
              size={36}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-600">
              No stock movements found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Try another product name or movement type.
            </p>
          </div>
        ) : (
          <>
            {/* RESPONSIVE TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Previous Stock</th>
                    <th className="px-4 py-3">New Stock</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {movements.map((movement) => (
                    <tr
                      key={movement._id}
                      className="hover:bg-slate-50"
                    >
                      {/* DATE */}
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(movement.createdAt)}
                      </td>

                      {/* PRODUCT */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {movement.product?.name || "Deleted Product"}
                        </p>

                        <p className="text-xs text-slate-400">
                          {movement.product?.sku || "N/A"}
                        </p>
                      </td>

                      {/* TYPE */}
                      <td className="px-4 py-3">
                        {getMovementBadge(movement.type)}
                      </td>

                      {/* QUANTITY WITH UNIT */}
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {movement.quantity ?? "N/A"}{" "}
                        {movement.product?.unit || ""}
                      </td>

                      {/* PREVIOUS STOCK */}
                      <td className="px-4 py-3 text-slate-600">
                        {movement.previousQuantity ?? "N/A"}{" "}
                        {movement.product?.unit || ""}
                      </td>

                      {/* NEW STOCK */}
                      <td className="px-4 py-3 text-slate-600">
                        {movement.newQuantity ?? "N/A"}{" "}
                        {movement.product?.unit || ""}
                      </td>

                      {/* REFERENCE */}
                      <td className="px-4 py-3 text-slate-600">
                        {getReferenceNumber(movement.referenceId)}
                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3">
                        {movement.product?._id && (
                          <button
                            type="button"
                            onClick={() =>
                              openProductHistory(movement.product._id)
                            }
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            View History
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Total Movements: {pagination.totalMovements}
              </p>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page {pagination.currentPage} of{" "}
                  {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* PRODUCT HISTORY MODAL */}
      {selectedProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-800">
                Product Stock History
              </h2>

              <button
                type="button"
                onClick={closeHistory}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {/* HISTORY LOADING */}
            {historyLoading ? (
              <div className="p-10 text-center text-slate-500">
                Loading product history...
              </div>
            ) : historyError ? (
              <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {historyError}
              </div>
            ) : currentProductHistory ? (
              <div className="space-y-4 p-4">
                {/* PRODUCT INFORMATION */}
                <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Product
                    </p>

                    <p className="font-semibold text-slate-800">
                      {currentProductHistory.product?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      SKU
                    </p>

                    <p className="font-semibold text-slate-800">
                      {currentProductHistory.product?.sku}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Current Stock
                    </p>

                    <p className="font-semibold text-slate-800">
                      {currentProductHistory.product?.quantity}{" "}
                      {currentProductHistory.product?.unit}
                    </p>
                  </div>
                </div>

                {/* PRODUCT HISTORY TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[550px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Quantity</th>
                        <th className="px-3 py-3">Created By</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {currentProductHistory.movements?.map((movement) => (
                        <tr key={movement._id}>
                          <td className="whitespace-nowrap px-3 py-3">
                            {formatDate(movement.createdAt)}
                          </td>

                          <td className="px-3 py-3">
                            {getMovementBadge(movement.type)}
                          </td>

                          {/* QUANTITY WITH PRODUCT UNIT */}
                          <td className="px-3 py-3">
                            {movement.quantity ?? "N/A"}{" "}
                            {currentProductHistory.product?.unit || ""}
                          </td>

                          <td className="px-3 py-3">
                            {movement.createdBy?.name || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TOTAL MOVEMENTS */}
                <p className="text-sm text-slate-500">
                  Total movements: {currentProductHistory.totalMovements}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default StockMovements;
