import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Barraca } from '../../types';

interface AppState {
  // Weather and environment
  weatherOverride: boolean;
  overrideExpiry: Date | null;
  
  // Admin state
  isAdmin: boolean;
  isSpecialAdmin: boolean;
  
  // Data
  barracas: Barraca[];
  emailSubscriptions: any[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  // Weather and environment
  weatherOverride: false,
  overrideExpiry: null,
  
  // Admin state
  isAdmin: false,
  isSpecialAdmin: false,
  
  // Data
  barracas: [],
  emailSubscriptions: [],
  
  // UI state
  isLoading: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Weather and environment
    setWeatherOverride: (state, action: PayloadAction<boolean>) => {
      state.weatherOverride = action.payload;
    },
    setOverrideExpiry: (state, action: PayloadAction<Date | null>) => {
      state.overrideExpiry = action.payload;
    },
    
    // Admin state
    setAdminStatus: (state, action: PayloadAction<{ isAdmin: boolean; isSpecialAdmin: boolean }>) => {
      state.isAdmin = action.payload.isAdmin;
      state.isSpecialAdmin = action.payload.isSpecialAdmin;
    },
    
    // Data management
    setBarracas: (state, action: PayloadAction<Barraca[]>) => {
      state.barracas = action.payload;
    },
    addBarraca: (state, action: PayloadAction<Barraca>) => {
      state.barracas.push(action.payload);
    },
    updateBarraca: (state, action: PayloadAction<Barraca>) => {
      const index = state.barracas.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.barracas[index] = action.payload;
      }
    },
    deleteBarraca: (state, action: PayloadAction<string>) => {
      state.barracas = state.barracas.filter(b => b.id !== action.payload);
    },
    setEmailSubscriptions: (state, action: PayloadAction<any[]>) => {
      state.emailSubscriptions = action.payload;
    },
    
    // UI state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  setWeatherOverride, 
  setOverrideExpiry,
  setAdminStatus,
  setBarracas,
  addBarraca,
  updateBarraca,
  deleteBarraca,
  setEmailSubscriptions,
  setLoading, 
  setError, 
  clearError 
} = appSlice.actions;

export default appSlice.reducer;
