import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import offreService from "./offreService";

const initialState = {
  offres: [],
  selectedOffre: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// Get all offers (public listing for candidates)
export const fetchOffres = createAsyncThunk(
  "offre/fetchOffres",
  async (_, thunkAPI) => {
    try {
      return await offreService.getOffres();
    } catch (error) {
      let message;
      if (error.response && error.response.data) {
        if (error.response.data.fieldErrors) {
          message = Object.values(error.response.data.fieldErrors).join(", ");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = error.message;
        }
      } else {
        message = error.toString();
      }
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single offer by ID
export const fetchOffreById = createAsyncThunk(
  "offre/fetchOffreById",
  async (offreId, thunkAPI) => {
    try {
      return await offreService.getOffreById(offreId);
    } catch (error) {
      let message;
      if (error.response && error.response.data) {
        if (error.response.data.fieldErrors) {
          message = Object.values(error.response.data.fieldErrors).join(", ");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = error.message;
        }
      } else {
        message = error.toString();
      }
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get HR's offers
export const fetchMyOffres = createAsyncThunk(
  "offre/fetchMyOffres",
  async (_, thunkAPI) => {
    try {
      return await offreService.getMyOffres();
    } catch (error) {
      let message;
      if (error.response && error.response.data) {
        if (error.response.data.fieldErrors) {
          message = Object.values(error.response.data.fieldErrors).join(", ");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = error.message;
        }
      } else {
        message = error.toString();
      }
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create offer
export const createOffre = createAsyncThunk(
  "offre/createOffre",
  async (offreData, thunkAPI) => {
    try {
      return await offreService.createOffre(offreData);
    } catch (error) {
      let message;
      if (error.response && error.response.data) {
        if (error.response.data.fieldErrors) {
          message = Object.values(error.response.data.fieldErrors).join(", ");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = error.message;
        }
      } else {
        message = error.toString();
      }
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update offer
export const updateOffre = createAsyncThunk(
  "offre/updateOffre",
  async ({ offreId, offreData }, thunkAPI) => {
    try {
      return await offreService.updateOffre(offreId, offreData);
    } catch (error) {
      let message;
      if (error.response && error.response.data) {
        if (error.response.data.fieldErrors) {
          message = Object.values(error.response.data.fieldErrors).join(", ");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = error.message;
        }
      } else {
        message = error.toString();
      }
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete offer
export const deleteOffre = createAsyncThunk(
  "offre/deleteOffre",
  async (offreId, thunkAPI) => {
    try {
      return await offreService.deleteOffre(offreId);
    } catch (error) {
      let message;
      if (error.response && error.response.data) {
        if (error.response.data.fieldErrors) {
          message = Object.values(error.response.data.fieldErrors).join(", ");
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else {
          message = error.message;
        }
      } else {
        message = error.toString();
      }
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const offreSlice = createSlice({
  name: "offre",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearSelectedOffre: (state) => {
      state.selectedOffre = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all offres
      .addCase(fetchOffres.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOffres.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.offres = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOffres.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.offres = [];
      })
      // Fetch single offre
      .addCase(fetchOffreById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOffreById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.selectedOffre = action.payload;
      })
      .addCase(fetchOffreById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.selectedOffre = null;
      })
      // Fetch HR's offres
      .addCase(fetchMyOffres.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyOffres.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.offres = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyOffres.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.offres = [];
      })
      // Create offre
      .addCase(createOffre.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createOffre.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.offres.push(action.payload);
      })
      .addCase(createOffre.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update offre
      .addCase(updateOffre.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateOffre.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.offres = state.offres.map((offre) =>
          offre.id === action.payload.id ? action.payload : offre
        );
      })
      .addCase(updateOffre.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete offre
      .addCase(deleteOffre.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteOffre.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Remove deleted offre from list
        state.offres = state.offres.filter((offre) => offre.id !== action.meta.arg);
      })
      .addCase(deleteOffre.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearSelectedOffre } = offreSlice.actions;
export default offreSlice.reducer;
