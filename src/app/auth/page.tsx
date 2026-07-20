'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter';
  if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must include a number';
  if (!/[^a-zA-Z0-9]/.test(pw)) return 'Password must include a special character (!@#$%...)';
  return null;
}

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      // Client-side password strength check
      const pwError = validatePassword(password);
      if (pwError) { setError(pwError); setLoading(false); return; }

      const { error } = await signUp(email, password, displayName || email.split('@')[0]);
      if (error) { setError(error); setLoading(false); return; }
    }

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      // Friendly message for rate limit
      if (signInError.toLowerCase().includes('rate') || signInError.toLowerCase().includes('limit')) {
        setError('Too many attempts. Please wait a minute and try again.');
      } else {
        setError(signInError);
      }
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  // Live password strength indicator for signup
  const pwStrength = mode === 'signup' && password.length > 0
    ? {
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password),
      }
    : null;

  const pwScore = pwStrength
    ? [pwStrength.length, pwStrength.lower, pwStrength.upper, pwStrength.number, pwStrength.special].filter(Boolean).length
    : 0;

  const pwLabel = pwScore <= 2 ? 'Weak' : pwScore <= 3 ? 'Fair' : pwScore <= 4 ? 'Good' : 'Strong';
  const pwColor = pwScore <= 2 ? 'var(--danger)' : pwScore <= 3 ? 'var(--orange, var(--warning))' : pwScore <= 4 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Cohort PM
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div
          className="rounded-xl p-6 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {error && (
            <div className="mb-4 text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {/* Demo accounts hint */}
          {mode === 'signin' && (
            <div className="mb-4 text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              Demo: <strong>sofia.martinez@demo.cohort</strong> / <strong>demo1234</strong>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="••••••••"
              />

              {/* Password strength meter */}
              {pwStrength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{ background: i <= pwScore ? pwColor : 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: pwColor }}>{pwLabel}</span>
                    <div className="space-x-2" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: pwStrength.length ? 'var(--success)' : undefined }}>8+ chars</span>
                      <span style={{ color: pwStrength.upper ? 'var(--success)' : undefined }}>A-Z</span>
                      <span style={{ color: pwStrength.lower ? 'var(--success)' : undefined }}>a-z</span>
                      <span style={{ color: pwStrength.number ? 'var(--success)' : undefined }}>0-9</span>
                      <span style={{ color: pwStrength.special ? 'var(--success)' : undefined }}>!@#</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-sm hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
