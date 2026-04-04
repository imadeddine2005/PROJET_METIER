import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice"
import offreReducer from "../features/offre/offreSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    offre: offreReducer,
  },
});