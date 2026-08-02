import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrgSettingsPage from './pages/OrgSettingsPage';
import BoardsIndexPage from './pages/BoardsIndexPage';
import BoardDetailPage from './pages/BoardDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Navbar />

            <main>
              <Routes>
                {/* Public routes */}
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/org/:orgId/settings"
                  element={
                    <ProtectedRoute>
                      <OrgSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/org/:orgId/boards"
                  element={
                    <ProtectedRoute>
                      <BoardsIndexPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/org/:orgId/boards/:boardId"
                  element={
                    <ProtectedRoute>
                      <BoardDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Default redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
