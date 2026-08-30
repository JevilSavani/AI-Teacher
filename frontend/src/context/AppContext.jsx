/**
 * AppContext — kept for backward compatibility.
 * The real auth context is AuthContext.jsx.
 * Re-export everything from AuthContext so any old imports still work.
 */
export { AuthProvider as AppProvider, useAuth as useApp } from './AuthContext';
