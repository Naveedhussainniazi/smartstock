
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// SALES REPORT
export const fetchSalesReport = createAsyncThunk(
  "reports/fetchSalesReport",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/sales", { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sales report"
      );
    }
  }
);

// PURCHASE REPORT
export const fetchPurchaseReport = createAsyncThunk(
  "reports/fetchPurchaseReport",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/purchases", { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch purchase report"
      );
    }
  }
);

// INVENTORY REPORT
export const fetchInventoryReport = createAsyncThunk(
  "reports/fetchInventoryReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/inventory");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch inventory report"
      );
    }
  }
);

// LOW STOCK REPORT
export const fetchLowStockReport = createAsyncThunk(
  "reports/fetchLowStockReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/low-stock");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch low stock report"
      );
    }
  }
);

// TOP SELLING PRODUCTS
export const fetchTopSellingProducts = createAsyncThunk(
  "reports/fetchTopSellingProducts",
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/top-selling-products", {
        params: { limit },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch top selling products"
      );
    }
  }
);

// CATEGORY SALES REPORT
export const fetchCategorySalesReport = createAsyncThunk(
  "reports/fetchCategorySalesReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/category-sales");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch category sales report"
      );
    }
  }
);

const initialState = {
  salesReport: null,
  purchaseReport: null,
  inventoryReport: null,
  lowStockReport: null,
  topSellingProducts: null,
  categorySalesReport: null,

  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearReportsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // SALES
      .addCase(fetchSalesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.salesReport = action.payload;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // PURCHASES
      .addCase(fetchPurchaseReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseReport.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseReport = action.payload;
      })
      .addCase(fetchPurchaseReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // INVENTORY
      .addCase(fetchInventoryReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryReport.fulfilled, (state, action) => {
        state.loading = false;
        state.inventoryReport = action.payload;
      })
      .addCase(fetchInventoryReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOW STOCK
      .addCase(fetchLowStockReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLowStockReport.fulfilled, (state, action) => {
        state.loading = false;
        state.lowStockReport = action.payload;
      })
      .addCase(fetchLowStockReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // TOP SELLING
      .addCase(fetchTopSellingProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopSellingProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.topSellingProducts = action.payload;
      })
      .addCase(fetchTopSellingProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CATEGORY SALES
      .addCase(fetchCategorySalesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategorySalesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.categorySalesReport = action.payload;
      })
      .addCase(fetchCategorySalesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReportsError } = reportsSlice.actions;

export default reportsSlice.reducer;
