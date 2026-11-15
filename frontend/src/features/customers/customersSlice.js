
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH CUSTOMERS
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/customers", { params });

      return {
        customers: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers"
      );
    }
  }
);

// CREATE CUSTOMER
export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await api.post("/customers", customerData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create customer"
      );
    }
  }
);

// UPDATE CUSTOMER
export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update customer"
      );
    }
  }
);

// DELETE CUSTOMER
export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete customer"
      );
    }
  }
);

const customersSlice = createSlice({
  name: "customers",

  initialState: {
    customers: [],
    pagination: null,

    loading: false,
    saving: false,
    deleting: false,

    error: null,
    successMessage: null,
  },

  reducers: {
    clearCustomersError: (state) => {
      state.error = null;
    },

    clearCustomersMessage: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH CUSTOMERS
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.customers;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE CUSTOMER
      .addCase(createCustomer.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.saving = false;
        state.customers.unshift(action.payload);
        state.successMessage = "Customer created successfully";
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // UPDATE CUSTOMER
      .addCase(updateCustomer.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.saving = false;

        const index = state.customers.findIndex(
          (customer) => customer._id === action.payload._id
        );

        if (index !== -1) {
          state.customers[index] = action.payload;
        }

        state.successMessage = "Customer updated successfully";
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // DELETE CUSTOMER
      .addCase(deleteCustomer.pending, (state) => {
        state.deleting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.deleting = false;

        state.customers = state.customers.filter(
          (customer) => customer._id !== action.payload
        );

        if (state.pagination) {
          state.pagination.totalCustomers = Math.max(
            0,
            state.pagination.totalCustomers - 1
          );
        }

        state.successMessage = "Customer deactivated successfully";
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCustomersError,
  clearCustomersMessage,
} = customersSlice.actions;

export default customersSlice.reducer;
