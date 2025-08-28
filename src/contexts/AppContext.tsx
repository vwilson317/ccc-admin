import React, { createContext, useContext, ReactNode } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState, AppDispatch } from '../store';
import { 
  setWeatherOverride, 
  setOverrideExpiry,
  setAdminStatus,
  setBarracas,
  addBarraca as addBarracaAction,
  updateBarraca as updateBarracaAction,
  deleteBarraca as deleteBarracaAction,
  setEmailSubscriptions,
  setLoading, 
  setError, 
  clearError 
} from '../store/slices/appSlice';

// Context interface
interface AppContextType {
  // Weather and environment
  weatherOverride: boolean;
  overrideExpiry: Date | null;
  setWeatherOverride: (override: boolean) => void;
  setOverrideExpiry: (expiry: Date | null) => void;
  
  // Admin state
  isAdmin: boolean;
  isSpecialAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
  
  // Data
  barracas: any[];
  emailSubscriptions: any[];
  addBarraca: (barraca: any) => void;
  updateBarraca: (barraca: any) => void;
  deleteBarraca: (id: string) => void;
  refreshBarracas: () => Promise<void>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <AppContextInner>{children}</AppContextInner>
    </Provider>
  );
};

// Inner component that uses Redux hooks
const AppContextInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Select state from Redux store
  const weatherOverride = useSelector((state: RootState) => state.app.weatherOverride);
  const overrideExpiry = useSelector((state: RootState) => state.app.overrideExpiry);
  const isAdmin = useSelector((state: RootState) => state.app.isAdmin);
  const isSpecialAdmin = useSelector((state: RootState) => state.app.isSpecialAdmin);
  const barracas = useSelector((state: RootState) => state.app.barracas);
  const emailSubscriptions = useSelector((state: RootState) => state.app.emailSubscriptions);
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  const error = useSelector((state: RootState) => state.app.error);

  // Mock implementations for missing functionality
  const adminLogin = async (email: string, password: string) => {
    // TODO: Implement actual admin login logic
    console.log('Admin login:', email, password);
    dispatch(setAdminStatus({ isAdmin: true, isSpecialAdmin: false }));
  };

  const adminLogout = () => {
    dispatch(setAdminStatus({ isAdmin: false, isSpecialAdmin: false }));
  };

  const refreshBarracas = async () => {
    // TODO: Implement actual barraca refresh logic
    console.log('Refreshing barracas...');
  };

  const contextValue: AppContextType = {
    // Weather and environment
    weatherOverride,
    overrideExpiry,
    setWeatherOverride: (override: boolean) => dispatch(setWeatherOverride(override)),
    setOverrideExpiry: (expiry: Date | null) => dispatch(setOverrideExpiry(expiry)),
    
    // Admin state
    isAdmin,
    isSpecialAdmin,
    adminLogin,
    adminLogout,
    
    // Data
    barracas,
    emailSubscriptions,
    addBarraca: (barraca: any) => dispatch(addBarracaAction(barraca)),
    updateBarraca: (barraca: any) => dispatch(updateBarracaAction(barraca)),
    deleteBarraca: (id: string) => dispatch(deleteBarracaAction(id)),
    refreshBarracas,
    
    // UI state
    isLoading,
    error,
    setLoading: (loading: boolean) => dispatch(setLoading(loading)),
    setError: (error: string | null) => dispatch(setError(error)),
    clearError: () => dispatch(clearError()),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
