
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH STOCK ADJUSTMENTS
export const fetchStockAdjustments = createAsyncThunk(
  "stockAdjustments/fetchStockAdjustments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/stock-adjustments", {
        params,
      });

      return {
        adjustments: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch stock adjustments"
      );
    }
  }
);

// FETCH SINGLE STOCK ADJUSTMENT
export const fetchStockAdjustmentById = createAsyncThunk(
  "stockAdjustments/fetchStockAdjustmentById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/stock-adjustments/${id}`);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch stock adjustment details"
      );
    }
  }
);

// CREATE STOCK ADJUSTMENT
export const createStockAdjustment = createAsyncThunk(
  "stockAdjustments/createStockAdjustment",
  async (adjustmentData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/stock-adjustments",
        adjustmentData
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create stock adjustment"
      );
    }
  }
);

const initialState = {
  adjustments: [],
  currentAdjustment: null,

  pagination: {
    totalAdjustments: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  loading: false,
  detailsLoading: false,
  saving: false,

  error: null,
  detailsError: null,
  successMessage: null,
};

const stockAdjustmentsSlice = createSlice({
  name: "stockAdjustments",
  initialState,

  reducers: {
    clearStockAdjustmentsError: (state) => {
      state.error = null;
    },

    clearStockAdjustmentDetails: (state) => {
      state.currentAdjustment = null;
      state.detailsError = null;
    },

    clearStockAdjustmentMessage: (state) => {
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH ALL ADJUSTMENTS
      .addCase(fetchStockAdjustments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchStockAdjustments.fulfilled, (state, action) => {
        state.loading = false;
        state.adjustments = action.payload.adjustments;
        state.pagination = action.payload.pagination;
      })

      .addCase(fetchStockAdjustments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH SINGLE ADJUSTMENT
      .addCase(fetchStockAdjustmentById.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })

      .addCase(fetchStockAdjustmentById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentAdjustment = action.payload;
      })

      .addCase(fetchStockAdjustmentById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload;
      })

      // CREATE ADJUSTMENT
      .addCase(createStockAdjustment.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(createStockAdjustment.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = "Stock adjusted successfully";
        state.adjustments.unshift(action.payload);
      })

      .addCase(createStockAdjustment.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearStockAdjustmentsError,
  clearStockAdjustmentDetails,
  clearStockAdjustmentMessage,
} = stockAdjustmentsSlice.actions;

export default stockAdjustmentsSlice.reducer;
