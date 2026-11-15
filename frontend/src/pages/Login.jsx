
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { setCredentials } from "../features/auth/authSlice";
import api from "../services/api";

import { Package, Lock, Mail } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Login
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);

      const token =
        response.data.token ||
        response.data.data?.token ||
        response.data.accessToken ||
        response.data.data?.accessToken;

      const user = response.data.data;

      if (!token) {
        throw new Error(
          "Login successful, but authentication token was not found."
        );
      }

      if (!user) {
        throw new Error(
          "User information was not found in the login response."
        );
      }

      // Save User and Token through Redux
      dispatch(
        setCredentials({
          user,
          token,
        })
      );

      // Redirect to Dashboard
      navigate("/", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        {/* Logo and Heading */}
        <div className="mb-6 text-center">

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Package size={30} />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            SmartStock
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your Inventory Management System
          </p>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email Field */}
          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 transition focus-within:border-blue-500">

              <Mail size={18} className="text-slate-400" />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                className="w-full p-3 outline-none"
              />

            </div>

          </div>

          {/* Password Field */}
          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <div className="flex items-center rounded-lg border border-slate-300 px-3 transition focus-within:border-blue-500">

              <Lock size={18} className="text-slate-400" />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full p-3 outline-none"
              />

            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          NHTECH | All rights reserved.
        </p>

      </div>

    </div>
  );
}

export default Login;
