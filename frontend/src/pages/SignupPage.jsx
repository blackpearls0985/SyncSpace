import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * SignupPage — /signup
 * Signup page supporting light and dark modes with bold dark/light headline and pill submit button.
 */
export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: searchParams.get('email') || '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await client.post('/api/auth/signup', form);
      const { user: fullUser } = await client.get('/api/auth/me');
      login(fullUser);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-[#090D16] transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full 
                          bg-[var(--color-accent)] mb-4 shadow-lg shadow-[var(--color-accent)]/20">
            <span className="text-white font-extrabold text-2xl">S</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
            Create your account
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Join SyncSpace and start collaborating</p>
        </div>

        <div className="card bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3">
                <p className="text-red-600 dark:text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Full name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Alex Johnson"
                value={form.name}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="alex@example.com"
                value={form.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-accent)] hover:underline font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
