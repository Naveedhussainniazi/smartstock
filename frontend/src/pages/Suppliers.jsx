
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  clearSupplierMessage,
} from "../features/suppliers/suppliersSlice";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  taxNumber: "",
  notes: "",
};

function Suppliers() {
  const dispatch = useDispatch();

  const {
    suppliers,
    pagination,
    loading,
    saving,
    deleting,
    error,
    successMessage,
  } = useSelector((state) => state.suppliers);

  const { user } = useSelector((state) => state.auth);

  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [localError, setLocalError] = useState("");

  const limit = 10;

  useEffect(() => {
    dispatch(fetchSuppliers({ page, limit, search }));
  }, [dispatch, page, search]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearSupplierMessage());
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage, dispatch]);

  const totalPages = pagination?.totalPages || 1;
  const totalSuppliers = pagination?.totalSuppliers || 0;

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData(initialFormData);
    setLocalError("");
    dispatch(clearSupplierMessage());
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);

    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      company: supplier.company || "",
      address: supplier.address || "",
      city: supplier.city || "",
      taxNumber: supplier.taxNumber || "",
      notes: supplier.notes || "",
    });

    setLocalError("");
    dispatch(clearSupplierMessage());
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSupplier(null);
    setFormData(initialFormData);
    setLocalError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!formData.name.trim()) {
      setLocalError("Supplier name is required.");
      return;
    }

    const supplierData = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      taxNumber: formData.taxNumber.trim(),
      notes: formData.notes.trim(),
    };

    try {
      if (editingSupplier) {
        await dispatch(
          updateSupplier({
            id: editingSupplier._id,
            supplierData,
          })
        ).unwrap();
      } else {
        await dispatch(createSupplier(supplierData)).unwrap();
      }

      closeModal();

      dispatch(fetchSuppliers({ page, limit, search }));
    } catch (err) {
      setLocalError(
        typeof err === "string" ? err : "Unable to save supplier."
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;

    try {
      await dispatch(deleteSupplier(deletingSupplier._id)).unwrap();

      setDeletingSupplier(null);

      dispatch(fetchSuppliers({ page, limit, search }));
    } catch  {
      setDeletingSupplier(null);
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Suppliers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage supplier information and business contacts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              dispatch(fetchSuppliers({ page, limit, search }))
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Truck size={24} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Total Suppliers
            </p>

            <h2 className="text-2xl font-bold text-slate-800">
              {totalSuppliers}
            </h2>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* SUPPLIERS TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-800">
            Supplier Directory
          </h2>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Search suppliers..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <RefreshCw size={20} className="animate-spin" />
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Truck
              size={40}
              className="mx-auto mb-3 text-slate-300"
            />

            <h3 className="font-semibold text-slate-700">
              No suppliers found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or add a new supplier.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Company</th>
                  <th className="px-5 py-4">Location</th>

                  {isAdmin && (
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier._id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">
                        {supplier.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {supplier.taxNumber || "No tax number"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail size={14} className="text-slate-400" />
                          {supplier.email}
                        </div>
                      )}

                      {supplier.phone && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={13} />
                          {supplier.phone}
                        </div>
                      )}

                      {!supplier.email && !supplier.phone && "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2
                          size={15}
                          className="text-slate-400"
                        />
                        {supplier.company || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={15}
                          className="text-slate-400"
                        />

                        {[supplier.city, supplier.address]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(supplier)}
                            title="Edit supplier"
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingSupplier(supplier)}
                            title="Delete supplier"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {totalSuppliers} suppliers
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPage((previous) => Math.max(1, previous - 1))
              }
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((previous) => Math.min(totalPages, previous + 1))
              }
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">
          <div className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter supplier details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">

                {[
                  {
                    name: "name",
                    label: "Supplier Name",
                    required: true,
                    placeholder: "Enter supplier name",
                  },
                  {
                    name: "company",
                    label: "Company",
                    placeholder: "Company name",
                  },
                  {
                    name: "email",
                    label: "Email Address",
                    type: "email",
                    placeholder: "example@email.com",
                  },
                  {
                    name: "phone",
                    label: "Phone Number",
                    placeholder: "Enter phone number",
                  },
                  {
                    name: "city",
                    label: "City",
                    placeholder: "City",
                  },
                  {
                    name: "address",
                    label: "Address",
                    placeholder: "Street address",
                  },
                  {
                    name: "taxNumber",
                    label: "Tax Number",
                    placeholder: "Enter tax number",
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {field.label}

                      {field.required && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>

                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional supplier information..."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {localError && (
                <div className="mx-5 mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {localError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSupplier
                      ? "Update Supplier"
                      : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-50 p-3 text-red-600">
                <Trash2 size={22} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-800">
                  Delete Supplier
                </h2>

                <p className="text-sm text-slate-500">
                  Please confirm this action.
                </p>
              </div>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Are you sure you want to deactivate{" "}
              <strong>{deletingSupplier.name}</strong>?
              <span className="mt-2 block text-xs text-slate-500">
                Suppliers linked to draft or received purchases cannot be deleted.
              </span>
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
