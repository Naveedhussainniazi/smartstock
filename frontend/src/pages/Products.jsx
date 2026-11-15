
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  clearCreateProductState,
  clearUpdateProductState,
  clearDeleteProductState,
} from "../features/products/productsSlice";

import { fetchCategories } from "../features/categories/categoriesSlice";

const initialFormData = {
  name: "",
  sku: "",
  description: "",
  category: "",
  purchasePrice: "",
  sellingPrice: "",
  quantity: "0",
  minStockLevel: "5",
  unit: "piece",
};

function Products() {
  const dispatch = useDispatch();

  // Authentication State
  const { user } = useSelector((state) => state.auth);

  // Only Admin Can Edit and Delete
  const isAdmin = user?.role === "admin";

  // Products Redux State
  const {
    products,
    totalProducts,
    currentPage,
    totalPages,
    loading,
    error,
    createLoading,
    createError,
    updateLoading,
    updateError,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.products);

  // Categories Redux State
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useSelector((state) => state.categories);

  // Search and Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;

  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState(null);

  // Fetch Categories
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch Products with Search, Filters and Pagination
  useEffect(() => {
    const params = { page, limit };

    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    if (stockStatus) params.stockStatus = stockStatus;

    dispatch(fetchProducts(params));
  }, [dispatch, page, search, category, stockStatus]);

  // Stock Status
  const getStockStatus = (product) => {
    if (product.quantity === 0) return "Out of Stock";

    if (product.quantity <= product.minStockLevel) {
      return "Low Stock";
    }

    return "In Stock";
  };

  // Stock Badge Styling
  const getStockStyle = (status) => {
    if (status === "Out of Stock") {
      return "bg-red-100 text-red-700";
    }

    if (status === "Low Stock") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  };

  // Format Price
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 2,
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setCategory("");
    setStockStatus("");
    setPage(1);
  };

  // Refresh Products
  const handleRefresh = () => {
    const params = { page, limit };

    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    if (stockStatus) params.stockStatus = stockStatus;

    dispatch(fetchProducts(params));
    dispatch(fetchCategories());
  };

  // Retry Products Fetch
  const handleRetry = () => {
    const params = { page, limit };

    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    if (stockStatus) params.stockStatus = stockStatus;

    dispatch(fetchProducts(params));
  };

  // Previous Page
  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  // Next Page
  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);

    dispatch(clearCreateProductState());
    dispatch(clearUpdateProductState());

    setIsModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
    if (!isAdmin) return;

    setEditingProduct(product);

    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      category: product.category?._id || product.category || "",
      purchasePrice: String(product.purchasePrice ?? ""),
      sellingPrice: String(product.sellingPrice ?? ""),
      quantity: String(product.quantity ?? 0),
      minStockLevel: String(product.minStockLevel ?? 5),
      unit: product.unit || "piece",
    });

    dispatch(clearUpdateProductState());

    setIsModalOpen(true);
  };

  // Close Product Modal
  const handleCloseModal = () => {
    if (createLoading || updateLoading) return;

    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);

    dispatch(clearCreateProductState());
    dispatch(clearUpdateProductState());
  };

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Prepare Product Data
  const prepareProductData = () => ({
    name: formData.name.trim(),
    sku: formData.sku.trim().toUpperCase(),
    description: formData.description.trim(),
    category: formData.category || null,
    purchasePrice: Number(formData.purchasePrice),
    sellingPrice: Number(formData.sellingPrice),
    quantity: Number(formData.quantity),
    minStockLevel: Number(formData.minStockLevel),
    unit: formData.unit.trim(),
  });

  // Submit Product: Create or Update
  const handleSubmitProduct = async (e) => {
    e.preventDefault();

    const productData = prepareProductData();

    try {
      if (editingProduct) {
        if (!isAdmin) return;

        await dispatch(
          updateProduct({
            id: editingProduct._id,
            productData,
          })
        ).unwrap();

      } else {
        await dispatch(createProduct(productData)).unwrap();
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData(initialFormData);

      // Refresh Products
      setPage(1);

      const params = { page: 1, limit };

      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (stockStatus) params.stockStatus = stockStatus;

      dispatch(fetchProducts(params));

      dispatch(clearCreateProductState());
      dispatch(clearUpdateProductState());

    } catch (error) {
      console.error("Product save failed:", error);
    }
  };

  // Open Delete Confirmation
  const handleOpenDeleteModal = (product) => {
    if (!isAdmin) return;

    dispatch(clearDeleteProductState());
    setProductToDelete(product);
  };

  // Close Delete Confirmation
  const handleCloseDeleteModal = () => {
    if (deleteLoading) return;

    setProductToDelete(null);
    dispatch(clearDeleteProductState());
  };

  // Confirm Delete Product
  const handleConfirmDelete = async () => {
    if (!isAdmin || !productToDelete) return;

    try {
      await dispatch(deleteProduct(productToDelete._id)).unwrap();

      setProductToDelete(null);
      dispatch(clearDeleteProductState());

      // If the deleted product was the only item on this page,
      // move to the previous page.
      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        const params = { page, limit };

        if (search.trim()) params.search = search.trim();
        if (category) params.category = category;
        if (stockStatus) params.stockStatus = stockStatus;

        dispatch(fetchProducts(params));
      }

    } catch (error) {
      console.error("Product deletion failed:", error);
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your inventory products
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Product Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <Package size={25} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Total Active Products
            </p>

            <h2 className="text-2xl font-bold text-slate-800">
              {totalProducts}
            </h2>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">

        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Search Products
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or SKU..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Category
          </label>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            disabled={categoriesLoading}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {categoriesLoading ? "Loading categories..." : "All Categories"}
            </option>

            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>

          {categoriesError && (
            <p className="mt-1 text-xs text-red-600">
              {categoriesError}
            </p>
          )}
        </div>

        {/* Stock Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Stock Status
          </label>

          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Reset Filters */}
        {(search || category || stockStatus) && (
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">
              Product List
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {totalProducts} products found
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Loading / Error / Empty / Products */}
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading products...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Purchase Price</th>
                  <th className="px-5 py-4">Selling Price</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Stock Status</th>

                  {isAdmin && (
                    <th className="px-5 py-4 text-center">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const status = getStockStatus(product);

                  return (
                    <tr
                      key={product._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {product.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.sku}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.category?.name || "Uncategorized"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatPrice(product.purchasePrice)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formatPrice(product.sellingPrice)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.quantity} {product.unit}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStockStyle(status)}`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* ADMIN ONLY ACTIONS */}
                      {isAdmin && (
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(product)}
                              title="Edit Product"
                              className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(product)}
                              title="Delete Product"
                              className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            >
                              <Trash2 size={17} />
                            </button>

                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && products.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-slate-500">
              Showing {products.length} of {totalProducts} products
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= totalPages || loading || totalPages === 0}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingProduct
                    ? "Update product information below"
                    : "Enter product information below"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={createLoading || updateLoading}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Product Form */}
            <form onSubmit={handleSubmitProduct}>
              <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

                {/* Product Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Product Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Wireless Mouse"
                    minLength={2}
                    maxLength={120}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SKU *
                  </label>

                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="e.g. WM-001"
                    minLength={2}
                    maxLength={40}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={categoriesLoading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">Uncategorized</option>

                    {categories.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Unit *
                  </label>

                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (KG)</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="dozen">Dozen</option>
                    <option value="meter">Meter</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Purchase Price (PKR) *
                  </label>

                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Selling Price (PKR) *
                  </label>

                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Quantity *
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Minimum Stock Level */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Minimum Stock Level *
                  </label>

                  <input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* API Error */}
              {(editingProduct ? updateError : createError) && (
                <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editingProduct ? updateError : createError}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={createLoading || updateLoading}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading || updateLoading || categoriesLoading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createLoading || updateLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingProduct ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={17} />
                      )}

                      {editingProduct ? "Update Product" : "Save Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <Trash2 size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Delete Product
                </h2>

                <p className="text-sm text-slate-500">
                  Confirm your action
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                {productToDelete.name}
              </span>
              ?
            </p>

            <p className="mt-2 text-xs text-slate-500">
              This product will be marked inactive and removed from the active product list.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteLoading}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Product
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Products;
