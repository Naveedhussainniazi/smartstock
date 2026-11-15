
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// FETCH ALL CATEGORIES
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/categories");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

// CREATE CATEGORY
export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await api.post("/categories", categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category"
      );
    }
  }
);

// UPDATE CATEGORY
export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category"
      );
    }
  }
);

// DELETE CATEGORY
export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

const initialState = {
  categories: [],
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

const categoriesSlice = createSlice({
  name: "categories",
  initialState,

  reducers: {
    clearCategoriesError: (state) => {
      state.error = null;
    },

    clearCreateCategoryState: (state) => {
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
    },

    clearUpdateCategoryState: (state) => {
      state.updateLoading = false;
      state.updateError = null;
      state.updateSuccess = false;
    },

    clearDeleteCategoryState: (state) => {
      state.deleteLoading = false;
      state.deleteError = null;
      state.deleteSuccess = false;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      })

      // CREATE
      .addCase(createCategory.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createCategory.fulfilled, (state) => {
        state.createLoading = false;
        state.createSuccess = true;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Failed to create category";
      })

      // UPDATE
      .addCase(updateCategory.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateCategory.fulfilled, (state) => {
        state.updateLoading = false;
        state.updateSuccess = true;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || "Failed to update category";
      })

      // DELETE
      .addCase(deleteCategory.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteCategory.fulfilled, (state) => {
        state.deleteLoading = false;
        state.deleteSuccess = true;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || "Failed to delete category";
      });
  },
});

export const {
  clearCategoriesError,
  clearCreateCategoryState,
  clearUpdateCategoryState,
  clearDeleteCategoryState,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
