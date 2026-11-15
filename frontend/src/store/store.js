
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import productsReducer from "../features/products/productsSlice";
import categoriesReducer from "../features/categories/categoriesSlice";
import purchasesReducer from "../features/purchases/purchasesSlice";
import suppliersReducer from "../features/suppliers/suppliersSlice";
import customersReducer from "../features/customers/customersSlice";
import salesReducer from "../features/sales/salesSlice";
import reportsReducer from "../features/reports/reportsSlice";
import stockMovementsReducer from "../features/stockMovements/stockMovementsSlice";
import stockAdjustmentsReducer from "../features/stockAdjustments/stockAdjustmentsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    categories: categoriesReducer,
    purchases: purchasesReducer,
    suppliers: suppliersReducer,
    customers: customersReducer,
    sales: salesReducer,
    reports: reportsReducer,
    stockMovements: stockMovementsReducer,
    stockAdjustments: stockAdjustmentsReducer,
  },
});

export default store;
