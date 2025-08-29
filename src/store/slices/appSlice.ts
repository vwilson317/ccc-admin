import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Barraca } from '../../types';

interface AppState {
  // Weather and environment
  weatherOverride: boolean;
  overrideExpiry: Date | null;
  
  // Admin state
  isAdmin: boolean;
  isSpecialAdmin: boolean;
  
  // Session state
  session: {
    isAuthenticated: boolean;
    user: {
      email: string;
      role: 'admin' | 'special_admin';
      lastLogin: string | null;
    } | null;
    token: string | null;
    expiresAt: string | null;
  };
  
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
  
  // Session state
  session: {
    isAuthenticated: false,
    user: null,
    token: null,
    expiresAt: null,
  },
  
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
    
    // Session management
    login: (state, action: PayloadAction<{
      email: string;
      role: 'admin' | 'special_admin';
      token: string;
      expiresAt: Date;
    }>) => {
      state.session.isAuthenticated = true;
      state.session.user = {
        email: action.payload.email,
        role: action.payload.role,
        lastLogin: new Date().toISOString(),
      };
      state.session.token = action.payload.token;
      state.session.expiresAt = action.payload.expiresAt.toISOString();
      
      // Set admin status based on role
      state.isAdmin = action.payload.role === 'admin' || action.payload.role === 'special_admin';
      state.isSpecialAdmin = action.payload.role === 'special_admin';
    },
    
    logout: (state) => {
      state.session.isAuthenticated = false;
      state.session.user = null;
      state.session.token = null;
      state.session.expiresAt = null;
      state.isAdmin = false;
      state.isSpecialAdmin = false;
      
      // Clear data on logout
      state.barracas = [];
      state.emailSubscriptions = [];
    },
    
    updateSession: (state, action: PayloadAction<{
      token?: string;
      expiresAt?: Date;
      lastLogin?: Date;
    }>) => {
      if (action.payload.token) state.session.token = action.payload.token;
      if (action.payload.expiresAt) state.session.expiresAt = action.payload.expiresAt.toISOString();
      if (action.payload.lastLogin && state.session.user) {
        state.session.user.lastLogin = action.payload.lastLogin.toISOString();
      }
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
  login,
  logout,
  updateSession,
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
