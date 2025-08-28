# Redux Store Setup

This project uses Redux Toolkit with React Context for state management.

## Structure

```
src/store/
├── index.ts          # Main store configuration
├── hooks.ts          # Typed Redux hooks
├── slices/
│   └── appSlice.ts   # App state slice
└── README.md         # This file
```

## Usage

### 1. Using the Context Hook (Recommended)

The easiest way to access Redux state is through the `useApp` hook:

```tsx
import { useApp } from '../contexts/AppContext';

const MyComponent = () => {
  const { 
    weatherOverride, 
    setWeatherOverride, 
    isLoading, 
    error 
  } = useApp();

  return (
    <div>
      <p>Weather Override: {weatherOverride ? 'On' : 'Off'}</p>
      <button onClick={() => setWeatherOverride(!weatherOverride)}>
        Toggle Weather Override
      </button>
    </div>
  );
};
```

### 2. Using Redux Hooks Directly

For more advanced usage, you can use the typed Redux hooks:

```tsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setWeatherOverride } from '../store/slices/appSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const weatherOverride = useAppSelector(state => state.app.weatherOverride);

  const handleToggle = () => {
    dispatch(setWeatherOverride(!weatherOverride));
  };

  return (
    <button onClick={handleToggle}>
      Toggle Weather Override
    </button>
  );
};
```

## Available State

### App State (`appSlice.ts`)

- `weatherOverride: boolean` - Controls weather override mode
- `isLoading: boolean` - Global loading state
- `error: string | null` - Global error state

### Actions

- `setWeatherOverride(override: boolean)` - Set weather override
- `setLoading(loading: boolean)` - Set loading state
- `setError(error: string | null)` - Set error message
- `clearError()` - Clear error message

## Provider Setup

The Redux store is wrapped with the `AppProvider` in `main.tsx`:

```tsx
import { AppProvider } from './contexts/AppContext';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <Router>
        <App />
      </Router>
    </AppProvider>
  </React.StrictMode>
);
```

## Adding New State

To add new state to the Redux store:

1. Add new properties to the `AppState` interface in `appSlice.ts`
2. Add new reducers to handle state changes
3. Export the new actions
4. Update the `AppContextType` interface in `AppContext.tsx`
5. Add the new state and actions to the context value

Example:

```tsx
// In appSlice.ts
interface AppState {
  weatherOverride: boolean;
  isLoading: boolean;
  error: string | null;
  newProperty: string; // Add new property
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // ... existing reducers
    setNewProperty: (state, action: PayloadAction<string>) => {
      state.newProperty = action.payload;
    },
  },
});
```
