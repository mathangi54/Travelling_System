// src/context/AppContext.jsx
import { createContext, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children, value }) {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}