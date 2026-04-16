import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import candidatureHrService from "./candidatureHrService";

const initialState = {
  applicants: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  isUpdatingStatus: false,
  isRequestingAccess: false,
};

// Obtenir toutes les candidatures pour l'offre sélectionnée
export const fetchCandidaturesForOffer = createAsyncThunk(
  "candidatureHr/fetchCandidaturesForOffer",
  async (offreId, thunkAPI) => {
    try {
      return await candidatureHrService.getCandidaturesForOffer(offreId);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Mettre à jour le statut
export const updateCandidatureStatus = createAsyncThunk(
  "candidatureHr/updateStatus",
  async ({ candidatureId, newStatus }, thunkAPI) => {
    try {
      return await candidatureHrService.updateCandidatureStatus(candidatureId, newStatus);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Demander l'accès au CV
export const requestCvAccess = createAsyncThunk(
  "candidatureHr/requestCvAccess",
  async ({ candidatureId, motif }, thunkAPI) => {
    try {
      return await candidatureHrService.requestCvAccess(candidatureId, motif);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


export const candidatureHrSlice = createSlice({
  name: "candidatureHr",
  initialState,
  reducers: {
    resetCandidatureHrState: (state) => {
      state.isError = false;
      state.isLoading = false;
      state.isSuccess = false;
      state.message = "";
      state.isUpdatingStatus = false;
      state.isRequestingAccess = false;
    },
    clearApplicants: (state) => {
      state.applicants = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Applicants
      .addCase(fetchCandidaturesForOffer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCandidaturesForOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.applicants = action.payload?.data || action.payload; // Ajuster selon la structure de l'API ApiResponse
      })
      .addCase(fetchCandidaturesForOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Status
      .addCase(updateCandidatureStatus.pending, (state) => {
        state.isUpdatingStatus = true;
      })
      .addCase(updateCandidatureStatus.fulfilled, (state, action) => {
        state.isUpdatingStatus = false;
        const updatedApp = action.payload?.data || action.payload;
        // Mettre à jour l'élément dans la liste
        state.applicants = state.applicants.map(app => 
            app.id === updatedApp.id ? updatedApp : app
        );
      })
      .addCase(updateCandidatureStatus.rejected, (state, action) => {
        state.isUpdatingStatus = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Request Access
      .addCase(requestCvAccess.pending, (state) => {
        state.isRequestingAccess = true;
      })
      .addCase(requestCvAccess.fulfilled, (state, action) => {
        state.isRequestingAccess = false;
        state.isSuccess = true;
      })
      .addCase(requestCvAccess.rejected, (state, action) => {
        state.isRequestingAccess = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetCandidatureHrState, clearApplicants } = candidatureHrSlice.actions;
export default candidatureHrSlice.reducer;
