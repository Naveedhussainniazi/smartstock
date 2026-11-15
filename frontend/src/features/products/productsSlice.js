
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH PRODUCTS
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/products", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products"
      );
    }
  }
);

// CREATE PRODUCT
export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await api.post("/products", productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create product"
      );
    }
  }
);

// UPDATE PRODUCT
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update product"
      );
    }
  }
);

// DELETE PRODUCT
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete product"
      );
    }
  }
);

const initialState = {
  products: [],
  totalProducts: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,

  loading: false,
  error: null,

  createLoading: false,
  createError: null,
  createSuccess: false,

  updateLoading: false,
  updateError: null,
  updateSuccess: false,

  deleteLoading: false,
  deleteError: null,
  deleteSuccess: false,
};

const productsSlice = createSlice({
  name: "products",
  initialState,

  reducers: {
    clearProductsError: (state) => {
      state.error = null;
    },

    clearCreateProductState: (state) => {
      state.createError = null;
      state.createSuccess = false;
    },

    clearUpdateProductState: (state) => {
      state.updateError = null;
      state.updateSuccess = false;
    },

    clearDeleteProductState: (state) => {
      state.deleteError = null;
      state.deleteSuccess = false;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH PRODUCTS
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data || [];
        state.totalProducts = action.payload.totalProducts || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.pageSize = action.payload.pageSize || 10;
        state.totalPages = action.payload.totalPages || 0;
      })

      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      })

      // CREATE PRODUCT
      .addCase(createProduct.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })

      .addCase(createProduct.fulfilled, (state) => {
        state.createLoading = false;
        state.createSuccess = true;
      })

      .addCase(createProduct.rejected, (state, action) => {
        state.createLoading = false;
        state.createError =
          action.payload || "Failed to create product";
      })

      // UPDATE PRODUCT
      .addCase(updateProduct.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })

      .addCase(updateProduct.fulfilled, (state) => {
        state.updateLoading = false;
        state.updateSuccess = true;
      })

      .addCase(updateProduct.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError =
          action.payload || "Failed to update product";
      })

      // DELETE PRODUCT
      .addCase(deleteProduct.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })

      .addCase(deleteProduct.fulfilled, (state) => {
        state.deleteLoading = false;
        state.deleteSuccess = true;
      })

      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError =
          action.payload || "Failed to delete product";
      });
  },
});

export const {
  clearProductsError,
  clearCreateProductState,
  clearUpdateProductState,
  clearDeleteProductState,
} = productsSlice.actions;

export default productsSlice.reducer;
