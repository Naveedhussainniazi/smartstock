
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH ALL STOCK MOVEMENTS
export const fetchStockMovements = createAsyncThunk(
  "stockMovements/fetchStockMovements",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/stock-movements", {
        params,
      });

      return {
        movements: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch stock movements"
      );
    }
  }
);

// FETCH STOCK HISTORY FOR ONE PRODUCT
export const fetchProductStockHistory = createAsyncThunk(
  "stockMovements/fetchProductStockHistory",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/stock-movements/product/${productId}`
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch product stock history"
      );
    }
  }
);

const initialState = {
  movements: [],
  pagination: {
    totalMovements: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  currentProductHistory: null,

  loading: false,
  historyLoading: false,

  error: null,
  historyError: null,
};

const stockMovementsSlice = createSlice({
  name: "stockMovements",
  initialState,

  reducers: {
    clearStockMovementsError: (state) => {
      state.error = null;
    },

    clearStockHistory: (state) => {
      state.currentProductHistory = null;
      state.historyError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH ALL MOVEMENTS
      .addCase(fetchStockMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockMovements.fulfilled, (state, action) => {
        state.loading = false;
        state.movements = action.payload.movements;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchStockMovements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH PRODUCT HISTORY
      .addCase(fetchProductStockHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchProductStockHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.currentProductHistory = action.payload;
      })
      .addCase(fetchProductStockHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });
  },
});

export const {
  clearStockMovementsError,
  clearStockHistory,
} = stockMovementsSlice.actions;

export default stockMovementsSlice.reducer;
