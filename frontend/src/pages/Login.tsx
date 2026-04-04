import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Sparkles, ShieldCheck, BarChart3 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-7xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-lifted sm:rounded-[2rem] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_28%)]" />
          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/70">TeachEase</p>
                <h2 className="text-3xl font-bold">Academic Administration, refined</h2>
              </div>
            </div>
            <p className="max-w-xl text-lg leading-8 text-white/85">
              A premium school operations workspace for attendance, grades, analytics, and intelligent student support.
            </p>
          </div>

          <div className="relative z-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <Sparkles className="mb-3 h-5 w-5 text-white/90" />
              <p className="text-sm font-semibold">Elegant UI</p>
              <p className="mt-1 text-sm text-white/75">White-first design with premium indigo accents.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <ShieldCheck className="mb-3 h-5 w-5 text-white/90" />
              <p className="text-sm font-semibold">Reliable Workflow</p>
              <p className="mt-1 text-sm text-white/75">Built for clean, stable academic operations.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <BarChart3 className="mb-3 h-5 w-5 text-white/90" />
              <p className="text-sm font-semibold">Actionable Analytics</p>
              <p className="mt-1 text-sm text-white/75">Spot trends and intervene earlier.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-soft sm:rounded-[2rem] sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 shadow-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Welcome to TeachEase</h2>
              <p className="mt-2 text-sm text-slate-600">Sign in to access your academic workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="teacher@school.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full bg-gradient-to-r from-brand-600 to-indigo-700"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Demo Credentials</p>
              <p className="mt-1">Teacher: teacher@demo.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
