
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH PURCHASES
export const fetchPurchases = createAsyncThunk(
  "purchases/fetchPurchases",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/purchases", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch purchases"
      );
    }
  }
);

// FETCH SINGLE PURCHASE
export const fetchPurchaseById = createAsyncThunk(
  "purchases/fetchPurchaseById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/purchases/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch purchase details"
      );
    }
  }
);

// CREATE PURCHASE
export const createPurchase = createAsyncThunk(
  "purchases/createPurchase",
  async (purchaseData, { rejectWithValue }) => {
    try {
      const response = await api.post("/purchases", purchaseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create purchase"
      );
    }
  }
);

// RECEIVE PURCHASE
export const receivePurchase = createAsyncThunk(
  "purchases/receivePurchase",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/purchases/${id}/receive`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to receive purchase"
      );
    }
  }
);

// CANCEL PURCHASE
export const cancelPurchase = createAsyncThunk(
  "purchases/cancelPurchase",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/purchases/${id}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel purchase"
      );
    }
  }
);

const initialState = {
  purchases: [],
  currentPurchase: null,
  pagination: {
    totalPurchases: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  },

  loading: false,
  error: null,

  detailsLoading: false,
  detailsError: null,

  createLoading: false,
  createError: null,
  createSuccess: false,

  actionLoading: false,
  actionError: null,
  actionSuccess: false,
};

const purchasesSlice = createSlice({
  name: "purchases",
  initialState,

  reducers: {
    clearPurchaseErrors: (state) => {
      state.error = null;
      state.detailsError = null;
      state.createError = null;
      state.actionError = null;
    },

    clearCreatePurchaseState: (state) => {
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
    },

    clearPurchaseActionState: (state) => {
      state.actionLoading = false;
      state.actionError = null;
      state.actionSuccess = false;
    },

    clearCurrentPurchase: (state) => {
      state.currentPurchase = null;
      state.detailsError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH PURCHASES
      .addCase(fetchPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.purchases = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch purchases";
      })

      // FETCH SINGLE PURCHASE
      .addCase(fetchPurchaseById.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(fetchPurchaseById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentPurchase = action.payload.data || null;
      })
      .addCase(fetchPurchaseById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError =
          action.payload || "Failed to fetch purchase details";
      })

      // CREATE PURCHASE
      .addCase(createPurchase.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createPurchase.fulfilled, (state) => {
        state.createLoading = false;
        state.createSuccess = true;
      })
      .addCase(createPurchase.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Failed to create purchase";
      })

      // RECEIVE PURCHASE
      .addCase(receivePurchase.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(receivePurchase.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionSuccess = true;
      })
      .addCase(receivePurchase.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to receive purchase";
      })

      // CANCEL PURCHASE
      .addCase(cancelPurchase.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(cancelPurchase.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionSuccess = true;
      })
      .addCase(cancelPurchase.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to cancel purchase";
      });
  },
});

export const {
  clearPurchaseErrors,
  clearCreatePurchaseState,
  clearPurchaseActionState,
  clearCurrentPurchase,
} = purchasesSlice.actions;

export default purchasesSlice.reducer;
