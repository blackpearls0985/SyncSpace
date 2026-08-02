import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrgSwitcher from './OrgSwitcher';
import ThemeToggle from './ThemeToggle';
import { LogOutIcon, SettingsIcon, LayoutDashboardIcon } from './Icons';

/**
 * Navbar
 * Restyled header with ThemeToggle, pill CTA button, and coral red brand logo.
 */
export default function Navbar() {
  const { currentUser, currentOrg, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center
                            group-hover:bg-[var(--color-accent-hover)] transition-colors duration-200 shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Sync<span className="text-[var(--color-accent)]">Space</span>
            </span>
          </Link>

          {/* Center — Org switcher */}
          {currentUser && <OrgSwitcher />}

          {/* Right — Nav actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {currentUser && (
              <>
                {currentOrg && (
                  <Link
                    to={`/org/${currentOrg.organization.id}/boards`}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold 
                               text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] 
                               transition-all shadow-xs hover:shadow-sm"
                    title="View Boards"
                  >
                    <LayoutDashboardIcon className="w-3.5 h-3.5" />
                    Boards
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 
                             hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 text-xs font-medium"
                  title="Dashboard"
                >
                  Orgs Overview
                </Link>

                {currentOrg && (
                  <Link
                    to={`/org/${currentOrg.organization.id}/settings`}
                    className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 
                               hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
                    title="Org Settings"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </Link>
                )}

                <div className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent-light)] border border-[var(--color-accent-border)]
                                  flex items-center justify-center text-[var(--color-accent)] font-bold text-xs">
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 
                               transition-colors duration-150"
                    title="Log out"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {!currentUser && (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-xs py-1.5 px-4">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary text-xs py-1.5 px-4">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
