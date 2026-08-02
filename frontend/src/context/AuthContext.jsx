import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

/**
 * AuthContext
 *
 * Provides global auth state (currentUser, currentOrg) and helpers
 * (login, logout, setCurrentOrg) to the entire app.
 *
 * On mount, calls /api/auth/me to restore session from the httpOnly cookie.
 * This means the user stays logged in across page refreshes.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { user } = await client.get('/api/auth/me');
        setCurrentUser(user);

        // Auto-select the first org if the user has one
        if (user.orgs && user.orgs.length > 0) {
          const saved = localStorage.getItem('currentOrgId');
          const savedOrg = saved
            ? user.orgs.find((o) => o.organization.id === saved)
            : null;
          setCurrentOrg(savedOrg ?? user.orgs[0]);
        }
      } catch {
        // No valid session — user stays null (not logged in)
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback((user) => {
    setCurrentUser(user);
    if (user.orgs && user.orgs.length > 0) {
      setCurrentOrg(user.orgs[0]);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.post('/api/auth/logout');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setCurrentOrg(null);
    localStorage.removeItem('currentOrgId');
  }, []);

  const switchOrg = useCallback((orgMembership) => {
    setCurrentOrg(orgMembership);
    localStorage.setItem('currentOrgId', orgMembership.organization.id);
  }, []);

  // Refresh user data (e.g., after creating/joining an org)
  const refreshUser = useCallback(async () => {
    try {
      const { user } = await client.get('/api/auth/me');
      setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  }, []);

  const value = {
    currentUser,
    currentOrg,
    loading,
    login,
    logout,
    switchOrg,
    refreshUser,
    isAdmin: currentOrg?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for consuming auth context
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
