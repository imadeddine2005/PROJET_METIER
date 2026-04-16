import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import candidatureService from "./candidatureService";

const initialState = {
  candidatures: [],
  applicationResult: null,
  isError: false,
  isSuccess: false,
  isLoading: false,   // For fetching candidatures
  isApplying: false,  // For uploading CV and AI analysis
  message: "",
};

// Obtenir ses propres candidatures
export const fetchMyApplications = createAsyncThunk(
  "candidature/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await candidatureService.getMyApplications();
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Soumettre le CV pour postuler
export const applyToOffer = createAsyncThunk(
  "candidature/apply",
  async ({ offreId, cvFile }, thunkAPI) => {
    try {
      return await candidatureService.applyToOffer(offreId, cvFile);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const candidatureSlice = createSlice({
  name: "candidature",
  initialState,
  reducers: {
    resetCandidatureState: (state) => {
      state.isError = false;
      state.isLoading = false;
      state.isApplying = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearApplicationResult: (state) => {
      state.applicationResult = null;
    },
    setApplicationResult: (state, action) => {
      state.applicationResult = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // On suppose que la liste est dans payload.data
        state.candidatures = action.payload?.data || action.payload;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Apply to offer
      .addCase(applyToOffer.pending, (state) => {
        state.isApplying = true;
        state.applicationResult = null;
      })
      .addCase(applyToOffer.fulfilled, (state, action) => {
        state.isApplying = false;
        state.isSuccess = true;
        // La vue Candidate de la candidature
        state.applicationResult = action.payload?.data || action.payload;
      })
      .addCase(applyToOffer.rejected, (state, action) => {
        state.isApplying = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetCandidatureState, clearApplicationResult, setApplicationResult } = candidatureSlice.actions;
export default candidatureSlice.reducer;
