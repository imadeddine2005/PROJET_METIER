import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import candidatureHrService from "./candidatureHrService";

const initialState = {
  applicants: [],
  accessRequests: [],
  isLoadingRequests: false,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  isUpdatingStatus: false,
  isRequestingAccess: false,
  isGeneratingEmail: false,
  isSendingEmail: false,
};

// Obtenir l'historique des décisions pour l'offre sélectionnée
export const fetchHistoriqueForOffer = createAsyncThunk(
  "candidatureHr/fetchHistoriqueForOffer",
  async (offreId, thunkAPI) => {
    try {
      return await candidatureHrService.getHistoriqueDecisionsForOffer(offreId);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

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

// Fetch my access requests
export const fetchMyAccessRequests = createAsyncThunk(
  "candidatureHr/fetchMyAccessRequests",
  async (_, thunkAPI) => {
    try {
      return await candidatureHrService.getMyAccessRequests();
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Générer l'e-mail via IA
export const generateEmailThunk = createAsyncThunk(
  "candidatureHr/generateEmail",
  async ({ candidatureId, language }, thunkAPI) => {
    try {
      return await candidatureHrService.generateEmail(candidatureId, language);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Envoyer l'e-mail
export const sendEmailThunk = createAsyncThunk(
  "candidatureHr/sendEmail",
  async ({ candidatureId, subject, body }, thunkAPI) => {
    try {
      return await candidatureHrService.sendEmail(candidatureId, subject, body);
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
      state.isGeneratingEmail = false;
      state.isSendingEmail = false;
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
      // Fetch Historique
      .addCase(fetchHistoriqueForOffer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHistoriqueForOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.applicants = action.payload?.data || action.payload;
      })
      .addCase(fetchHistoriqueForOffer.rejected, (state, action) => {
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
        // Géré localement via .unwrap().catch() dans le composant pour éviter le double toast
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
        // Géré localement via .unwrap().catch() dans le composant
      })
      // Fetch My Access Requests
      .addCase(fetchMyAccessRequests.pending, (state) => {
        state.isLoadingRequests = true;
      })
      .addCase(fetchMyAccessRequests.fulfilled, (state, action) => {
        state.isLoadingRequests = false;
        state.isSuccess = true;
        state.accessRequests = action.payload?.data || action.payload || [];
      })
      .addCase(fetchMyAccessRequests.rejected, (state, action) => {
        state.isLoadingRequests = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Generate Email
      .addCase(generateEmailThunk.pending, (state) => {
        state.isGeneratingEmail = true;
      })
      .addCase(generateEmailThunk.fulfilled, (state) => {
        state.isGeneratingEmail = false;
      })
      .addCase(generateEmailThunk.rejected, (state, action) => {
        state.isGeneratingEmail = false;
        // Laissé à la gestion locale
      })
      // Send Email
      .addCase(sendEmailThunk.pending, (state) => {
        state.isSendingEmail = true;
      })
      .addCase(sendEmailThunk.fulfilled, (state) => {
        state.isSendingEmail = false;
      })
      .addCase(sendEmailThunk.rejected, (state, action) => {
        state.isSendingEmail = false;
        // Laissé à la gestion locale
      });
  },
});

export const { resetCandidatureHrState, clearApplicants } = candidatureHrSlice.actions;
export default candidatureHrSlice.reducer;
