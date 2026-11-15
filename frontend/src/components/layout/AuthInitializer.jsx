
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import api from "../../services/api";

import {
  updateUser,
  logout,
  setAuthInitialized,
} from "../../features/auth/authSlice";

function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  const { token, authInitialized } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    const verifyAuthentication = async () => {
      if (!token) {
        dispatch(setAuthInitialized(true));
        return;
      }

      try {
        const response = await api.get("/auth/profile");

        dispatch(updateUser(response.data.data));
      } catch (error) {
        console.error(
          "Authentication verification failed:",
          error.response?.data?.message || error.message
        );

        dispatch(logout());
      } finally {
        dispatch(setAuthInitialized(true));
      }
    };

    verifyAuthentication();
  }, [dispatch, token]);

  if (!authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-slate-600">
          Verifying authentication...
        </p>
      </div>
    );
  }

  return children;
}

export default AuthInitializer;
