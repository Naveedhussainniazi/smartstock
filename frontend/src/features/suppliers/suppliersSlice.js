
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH SUPPLIERS
export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchSuppliers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/suppliers", { params });

      return {
        suppliers: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch suppliers"
      );
    }
  }
);

// FETCH SINGLE SUPPLIER
export const fetchSupplierById = createAsyncThunk(
  "suppliers/fetchSupplierById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch supplier details"
      );
    }
  }
);

// CREATE SUPPLIER
export const createSupplier = createAsyncThunk(
  "suppliers/createSupplier",
  async (supplierData, { rejectWithValue }) => {
    try {
      const response = await api.post("/suppliers", supplierData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create supplier"
      );
    }
  }
);

// UPDATE SUPPLIER
export const updateSupplier = createAsyncThunk(
  "suppliers/updateSupplier",
  async ({ id, supplierData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/suppliers/${id}`, supplierData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update supplier"
      );
    }
  }
);

// DELETE SUPPLIER
export const deleteSupplier = createAsyncThunk(
  "suppliers/deleteSupplier",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/suppliers/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete supplier"
      );
    }
  }
);

const initialState = {
  suppliers: [],
  currentSupplier: null,

  pagination: {
    totalSuppliers: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },

  loading: false,
  detailsLoading: false,
  saving: false,
  deleting: false,

  error: null,
  detailsError: null,
  successMessage: null,
};

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState,

  reducers: {
    clearSuppliersError: (state) => {
      state.error = null;
      state.detailsError = null;
    },

    clearCurrentSupplier: (state) => {
      state.currentSupplier = null;
      state.detailsError = null;
    },

    clearSupplierMessage: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH SUPPLIERS
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload.suppliers;
        state.pagination =
          action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH SINGLE SUPPLIER
      .addCase(fetchSupplierById.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentSupplier = action.payload;
      })
      .addCase(fetchSupplierById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload;
      })

      // CREATE SUPPLIER
      .addCase(createSupplier.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.saving = false;
        state.suppliers.unshift(action.payload);

        if (state.pagination) {
          state.pagination.totalSuppliers += 1;
        }

        state.successMessage = "Supplier created successfully";
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // UPDATE SUPPLIER
      .addCase(updateSupplier.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.saving = false;

        const index = state.suppliers.findIndex(
          (supplier) => supplier._id === action.payload._id
        );

        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }

        if (
          state.currentSupplier?._id === action.payload._id
        ) {
          state.currentSupplier = action.payload;
        }

        state.successMessage = "Supplier updated successfully";
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // DELETE SUPPLIER
      .addCase(deleteSupplier.pending, (state) => {
        state.deleting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.deleting = false;

        state.suppliers = state.suppliers.filter(
          (supplier) => supplier._id !== action.payload
        );

        if (state.currentSupplier?._id === action.payload) {
          state.currentSupplier = null;
        }

        if (state.pagination) {
          state.pagination.totalSuppliers = Math.max(
            0,
            state.pagination.totalSuppliers - 1
          );
        }

        state.successMessage = "Supplier deactivated successfully";
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearSuppliersError,
  clearCurrentSupplier,
  clearSupplierMessage,
} = suppliersSlice.actions;

export default suppliersSlice.reducer;
