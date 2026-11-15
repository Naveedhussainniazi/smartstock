
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH SALES
export const fetchSales = createAsyncThunk(
  "sales/fetchSales",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/sales", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sales"
      );
    }
  }
);

// CREATE SALE
export const createSale = createAsyncThunk(
  "sales/createSale",
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await api.post("/sales", saleData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create sale"
      );
    }
  }
);

// COMPLETE SALE
export const completeSale = createAsyncThunk(
  "sales/completeSale",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/sales/${id}/complete`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete sale"
      );
    }
  }
);

// SEARCH SALE BY INVOICE
export const searchSalesByInvoice = createAsyncThunk(
  "sales/searchSalesByInvoice",
  async (invoiceNumber, { rejectWithValue }) => {
    try {
      const response = await api.get("/sales/search", {
        params: { invoiceNumber },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search sales"
      );
    }
  }
);

// FETCH SINGLE SALE DETAILS
export const fetchSaleById = createAsyncThunk(
  "sales/fetchSaleById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sale details"
      );
    }
  }
);

// INITIAL STATE
const initialState = {
  sales: [],
  totalSales: 0,
  currentPage: 1,
  totalPages: 0,

  loading: false,
  error: null,

  createLoading: false,
  createError: null,
  createSuccess: false,

  completeLoading: false,
  completeError: null,
  completeSuccess: false,

  searchResults: [],
  searchLoading: false,
  searchError: null,

  saleDetails: null,
  fetchSaleLoading: false,
  fetchSaleError: null,
};

// SALES SLICE
const salesSlice = createSlice({
  name: "sales",
  initialState,

  reducers: {
    clearSalesError: (state) => {
      state.error = null;
    },

    clearCreateSaleState: (state) => {
      state.createError = null;
      state.createSuccess = false;
    },

    clearCompleteSaleState: (state) => {
      state.completeError = null;
      state.completeSuccess = false;
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },

    clearSaleDetails: (state) => {
      state.saleDetails = null;
      state.fetchSaleError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH SALES
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload.data || [];
        state.totalSales = action.payload.pagination?.totalSales || 0;
        state.currentPage = action.payload.pagination?.currentPage || 1;
        state.totalPages = action.payload.pagination?.totalPages || 0;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE SALE
      .addCase(createSale.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        state.sales.unshift(action.payload);
        state.totalSales += 1;
      })
      .addCase(createSale.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })

      // COMPLETE SALE
      .addCase(completeSale.pending, (state) => {
        state.completeLoading = true;
        state.completeError = null;
        state.completeSuccess = false;
      })
      .addCase(completeSale.fulfilled, (state, action) => {
        state.completeLoading = false;
        state.completeSuccess = true;

        const index = state.sales.findIndex(
          (sale) => sale._id === action.payload._id
        );

        if (index !== -1) {
          state.sales[index] = action.payload;
        }

        if (state.saleDetails?._id === action.payload._id) {
          state.saleDetails = action.payload;
        }
      })
      .addCase(completeSale.rejected, (state, action) => {
        state.completeLoading = false;
        state.completeError = action.payload;
      })

      // SEARCH SALES
      .addCase(searchSalesByInvoice.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchSalesByInvoice.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload || [];
      })
      .addCase(searchSalesByInvoice.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })

      // FETCH SINGLE SALE DETAILS
      .addCase(fetchSaleById.pending, (state) => {
        state.fetchSaleLoading = true;
        state.fetchSaleError = null;
        state.saleDetails = null;
      })
      .addCase(fetchSaleById.fulfilled, (state, action) => {
        state.fetchSaleLoading = false;
        state.saleDetails = action.payload;
      })
      .addCase(fetchSaleById.rejected, (state, action) => {
        state.fetchSaleLoading = false;
        state.fetchSaleError = action.payload;
      });
  },
});

// EXPORT ACTIONS
export const {
  clearSalesError,
  clearCreateSaleState,
  clearCompleteSaleState,
  clearSearchResults,
  clearSaleDetails,
} = salesSlice.actions;

export default salesSlice.reducer;
