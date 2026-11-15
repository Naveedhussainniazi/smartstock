
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Folder,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearCreateCategoryState,
  clearUpdateCategoryState,
  clearDeleteCategoryState,
} from "../features/categories/categoriesSlice";

const initialFormData = {
  name: "",
  description: "",
};

function Categories() {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const {
    categories,
    loading,
    error,
    createLoading,
    createError,
    updateLoading,
    updateError,
    deleteLoading,
    deleteError,
  } = useSelector((state) => state.categories);

  const isAdmin = user?.role === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const filteredCategories = categories.filter((category) => {
    const search = searchTerm.toLowerCase();

    return (
      category.name?.toLowerCase().includes(search) ||
      category.description?.toLowerCase().includes(search)
    );
  });

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData(initialFormData);
    setFormError("");

    dispatch(clearCreateCategoryState());
    dispatch(clearUpdateCategoryState());

    setShowModal(true);
  };

  const handleOpenEditModal = (category) => {
    if (!isAdmin) return;

    setEditingCategory(category);

    setFormData({
      name: category.name || "",
      description: category.description || "",
    });

    setFormError("");

    dispatch(clearUpdateCategoryState());
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(initialFormData);
    setFormError("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
    };

    if (categoryData.name.length < 2) {
      setFormError("Category name must be at least 2 characters.");
      return;
    }

    setFormError("");

    try {
      if (editingCategory) {
        if (!isAdmin) return;

        await dispatch(
          updateCategory({
            id: editingCategory._id,
            categoryData,
          })
        ).unwrap();
      } else {
        await dispatch(createCategory(categoryData)).unwrap();
      }

      handleCloseModal();
      dispatch(fetchCategories());
    } catch (err) {
      setFormError(err || "Something went wrong.");
    }
  };

  const handleOpenDeleteModal = (category) => {
    if (!isAdmin) return;

    setCategoryToDelete(category);
    dispatch(clearDeleteCategoryState());
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!isAdmin || !categoryToDelete) return;

    try {
      await dispatch(deleteCategory(categoryToDelete._id)).unwrap();

      setShowDeleteModal(false);
      setCategoryToDelete(null);

      dispatch(fetchCategories());
    } catch (err) {
      // Redux stores the delete error.
    }
  };

  const handleRefresh = () => {
    dispatch(fetchCategories());
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your product categories.
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Category
          </button>

        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Folder size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Categories
              </p>

              <h2 className="text-2xl font-bold text-gray-800">
                {categories.length}
              </h2>
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <Folder size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Search Results
              </p>

              <h2 className="text-2xl font-bold text-gray-800">
                {filteredCategories.length}
              </h2>
            </div>

          </div>
        </div>

      </div>

      {/* SEARCH */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        </div>

      </div>

      {/* ERROR */}
      {(error || deleteError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error || deleteError}
        </div>
      )}

      {/* CATEGORY TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">#</th>
                <th className="px-6 py-4 font-semibold">Category Name</th>
                <th className="px-6 py-4 font-semibold">Description</th>

                {isAdmin && (
                  <th className="px-6 py-4 text-center font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 4 : 3}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 4 : 3}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category, index) => (
                  <tr
                    key={category._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-800">
                      {category.name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {category.description || "-"}
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() => handleOpenEditModal(category)}
                            title="Edit Category"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => handleOpenDeleteModal(category)}
                            title="Delete Category"
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b px-6 py-4">

              <h2 className="text-lg font-bold text-gray-800">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>

              <button
                onClick={handleCloseModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={19} />
              </button>

            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Enter category name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter category description"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {(formError || createError || updateError) && (
                <p className="text-sm text-red-600">
                  {formError || createError || updateError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading || updateLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createLoading || updateLoading
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-4 flex items-center gap-3">

              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <Trash2 size={22} />
              </div>

              <h2 className="text-lg font-bold text-gray-800">
                Delete Category
              </h2>

            </div>

            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete
              <strong> {categoryToDelete.name}</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <p className="mb-4 text-sm text-red-600">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-3">

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                disabled={deleteLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete Category"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Categories;
