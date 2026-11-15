import { createSlice } from "@reduxjs/toolkit";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  token: localStorage.getItem("token") || null,
  isAuthenticated: false,
  authInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    updateUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    setAuthInitialized: (state, action) => {
      state.authInitialized = action.payload;
    },
  },
});

export const { setCredentials, logout, updateUser, setAuthInitialized } =
  authSlice.actions;

export default authSlice.reducer;
