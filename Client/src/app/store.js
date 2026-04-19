import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import candidatureReducer from '../features/candidature/candidatureSlice'
import offreReducer from '../features/offre/offreSlice.js'
import candidatureHrReducer from '../features/candidatureHr/candidatureHrSlice.js'
import adminReducer from '../features/admin/adminSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    candidature: candidatureReducer,
    candidatureHr: candidatureHrReducer,
    offre: offreReducer,
    admin: adminReducer,
  },
});