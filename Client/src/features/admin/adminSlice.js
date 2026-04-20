import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminService from "./adminService";

const initialState = {
  pendingRequests: [],
  historyRequests: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  isActionLoading: false,
  modal: {
    isOpen: false,
    demandeId: null,
    actionType: null,
    candidatRef: ""
  },
  detailsModal: {
    isOpen: false,
    demande: null
  }
};

// Obtenir les demandes en attente
export const fetchPendingRequests = createAsyncThunk(
  "admin/fetchPendingRequests",
  async (_, thunkAPI) => {
    try {
      return await adminService.getPendingRequests();
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Obtenir l'historique
export const fetchHistoryRequests = createAsyncThunk(
  "admin/fetchHistoryRequests",
  async (_, thunkAPI) => {
    try {
      return await adminService.getHistoryRequests();
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Approuver
export const approveRequest = createAsyncThunk(
  "admin/approveRequest",
  async ({ demandeId, decisionNote }, thunkAPI) => {
    try {
      return await adminService.approveRequest(demandeId, decisionNote);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Refuser
export const rejectRequest = createAsyncThunk(
  "admin/rejectRequest",
  async ({ demandeId, decisionNote }, thunkAPI) => {
    try {
      return await adminService.rejectRequest(demandeId, decisionNote);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.isError = false;
      state.isLoading = false;
      state.isSuccess = false;
      state.message = "";
      state.isActionLoading = false;
    },
    openAdminModal: (state, action) => {
      state.modal = {
        isOpen: true,
        demandeId: action.payload.demandeId,
        actionType: action.payload.actionType,
        candidatRef: action.payload.candidatRef
      };
    },
    closeAdminModal: (state) => {
      state.modal = {
        isOpen: false,
        demandeId: null,
        actionType: null,
        candidatRef: ""
      };
    },
    openDetailsModal: (state, action) => {
      state.detailsModal = {
        isOpen: true,
        demande: action.payload
      };
    },
    closeDetailsModal: (state) => {
      state.detailsModal = {
        isOpen: false,
        demande: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pending
      .addCase(fetchPendingRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pendingRequests = action.payload?.data || action.payload || [];
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Fetch History
      .addCase(fetchHistoryRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHistoryRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.historyRequests = action.payload?.data || action.payload || [];
      })
      .addCase(fetchHistoryRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Approve Request
      .addCase(approveRequest.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isSuccess = true;
        // Supprimer de pending et ajouter à l'historique potentiellement
        const updatedApp = action.payload?.data || action.payload;
        state.pendingRequests = state.pendingRequests.filter(req => req.id !== updatedApp.id);
        // Si l'historique est déjà chargé on l'y ajoute pour le temps reel
        state.historyRequests.unshift(updatedApp);
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Reject Request
      .addCase(rejectRequest.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.isSuccess = true;
        const updatedApp = action.payload?.data || action.payload;
        state.pendingRequests = state.pendingRequests.filter(req => req.id !== updatedApp.id);
        state.historyRequests.unshift(updatedApp);
      })
      .addCase(rejectRequest.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAdminState, openAdminModal, closeAdminModal, openDetailsModal, closeDetailsModal } = adminSlice.actions;
export default adminSlice.reducer;
