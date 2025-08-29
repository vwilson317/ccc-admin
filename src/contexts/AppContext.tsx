import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  setWeatherOverride, 
  setOverrideExpiry,
  setAdminStatus,
  login,
  logout,
  updateSession,
  setBarracas,
  addBarraca as addBarracaAction,
  updateBarraca as updateBarracaAction,
  deleteBarraca as deleteBarracaAction,
  setEmailSubscriptions,
  setLoading, 
  setError, 
  clearError 
} from '../store/slices/appSlice';
import { BarracaService } from '../services/barracaService';
import { environmentInfo } from '../lib/supabase';
import { isSessionValid } from '../utils/sessionUtils';

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
  return <AppContextInner>{children}</AppContextInner>;
};

// Inner component that uses Redux hooks
const AppContextInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Select state from Redux store
  const weatherOverride = useSelector((state: RootState) => state.app.weatherOverride);
  const overrideExpiry = useSelector((state: RootState) => state.app.overrideExpiry);
  const isAdmin = useSelector((state: RootState) => state.app.isAdmin);
  const isSpecialAdmin = useSelector((state: RootState) => state.app.isSpecialAdmin);
  const session = useSelector((state: RootState) => state.app.session);
  const barracas = useSelector((state: RootState) => state.app.barracas);
  const emailSubscriptions = useSelector((state: RootState) => state.app.emailSubscriptions);
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  const error = useSelector((state: RootState) => state.app.error);

  // Load sample data for testing when in mock mode
  const loadSampleData = () => {
    if (!environmentInfo.hasValidConfig) {
      console.log('Loading sample data for testing...');
      
      const sampleBarracas = [
        {
          id: 'sample-1',
          name: 'Barraca do João',
          barracaNumber: '15',
          location: 'Copacabana Beach',
          coordinates: { lat: -22.9707, lng: -43.1824 },
          isOpen: true,
          typicalHours: { open: '08:00', close: '18:00' },
          description: 'Traditional Brazilian beach food',
          photos: { horizontal: ['/api/placeholder/600/400'], vertical: [] },
          menuPreview: ['Coconut water', 'Grilled cheese', 'Fresh fruit'],
          contact: { phone: '+55 21 99999-9999' },
          amenities: ['Umbrella', 'Chairs', 'WiFi'],
          weatherDependent: true,
          partnered: true,
          weekendHoursEnabled: true,
          weekendHours: { friday: { open: '08:00', close: '20:00' } },
          manualStatus: 'undefined' as const,
          specialAdminOverride: false,
          specialAdminOverrideExpires: null,
          rating: 3 as const,
          ctaButtons: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 'sample-2',
          name: 'Barraca da Maria',
          barracaNumber: '22',
          location: 'Ipanema Beach',
          coordinates: { lat: -22.9871, lng: -43.2014 },
          isOpen: false,
          typicalHours: { open: '09:00', close: '17:00' },
          description: 'Fresh seafood and drinks',
          photos: { horizontal: ['/api/placeholder/600/400'], vertical: [] },
          menuPreview: ['Fresh fish', 'Caipirinha', 'Beer'],
          contact: { phone: '+55 21 98888-8888' },
          amenities: ['Umbrella', 'Chairs'],
          weatherDependent: false,
          partnered: false,
          weekendHoursEnabled: false,
          weekendHours: {},
          manualStatus: 'undefined' as const,
          specialAdminOverride: false,
          specialAdminOverrideExpires: null,
          rating: 2 as const,
          ctaButtons: [],
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-10')
        },
        {
          id: 'sample-3',
          name: 'Barraca do Pedro',
          barracaNumber: '8',
          location: 'Leblon Beach',
          coordinates: { lat: -22.9871, lng: -43.2014 },
          isOpen: true,
          typicalHours: { open: '07:00', close: '19:00' },
          description: 'Best acai bowls in town',
          photos: { horizontal: ['/api/placeholder/600/400'], vertical: [] },
          menuPreview: ['Acai bowl', 'Smoothies', 'Fresh juices'],
          contact: { phone: '+55 21 97777-7777' },
          amenities: ['Umbrella', 'Chairs', 'WiFi', 'Credit card'],
          weatherDependent: true,
          partnered: true,
          weekendHoursEnabled: true,
          weekendHours: { saturday: { open: '08:00', close: '20:00' } },
          manualStatus: 'undefined' as const,
          specialAdminOverride: false,
          specialAdminOverrideExpires: null,
          rating: 3 as const,
          ctaButtons: [],
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-20')
        }
      ];

      const sampleEmails = [
        {
          email: 'john@example.com',
          subscribedAt: new Date('2024-01-01'),
          preferences: { newBarracas: true, specialOffers: true }
        },
        {
          email: 'maria@example.com',
          subscribedAt: new Date('2024-01-05'),
          preferences: { newBarracas: false, specialOffers: true }
        },
        {
          email: 'pedro@example.com',
          subscribedAt: new Date('2024-01-10'),
          preferences: { newBarracas: true, specialOffers: false }
        }
      ];

      dispatch(setBarracas(sampleBarracas));
      dispatch(setEmailSubscriptions(sampleEmails));
      
      console.log('Sample data loaded successfully');
    }
  };

  // Check session expiration and load data when admin status changes
  useEffect(() => {
    // Check if session has expired
    if (session.isAuthenticated && !isSessionValid(session.expiresAt)) {
      console.log('Session expired, logging out');
      dispatch(logout());
      return;
    }
    
    if (isAdmin || isSpecialAdmin) {
      if (environmentInfo.hasValidConfig) {
        refreshBarracas();
      } else {
        loadSampleData();
      }
    }
  }, [isAdmin, isSpecialAdmin, session.isAuthenticated, session.expiresAt]);

  // Mock implementations for missing functionality
  const adminLogin = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      // TODO: Implement actual admin login logic
      console.log('Admin login:', email, password);
      
      // For now, create a mock session
      const mockToken = 'mock-jwt-token-' + Date.now();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Determine role based on email (you can customize this logic)
      const role = email.includes('special') ? 'special_admin' : 'admin';
      
      dispatch(login({
        email,
        role,
        token: mockToken,
        expiresAt,
      }));
      
    } catch (error) {
      console.error('Login failed:', error);
      dispatch(setError('Login failed. Please check your credentials.'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const adminLogout = () => {
    dispatch(logout());
  };

  const refreshBarracas = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      console.log('Refreshing barracas...');
      const result = await BarracaService.getAllUnpaginated();
      dispatch(setBarracas(result));
      
      console.log(`Loaded ${result.length} barracas`);
      
    } catch (error) {
      console.error('Failed to refresh barracas:', error);
      dispatch(setError('Failed to load barracas. Please try again.'));
    } finally {
      dispatch(setLoading(false));
    }
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
    
    // Session state
    session,
    
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
