'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

type Step = 'email' | 'code';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.replace('/admin');
          return;
        }
      } catch {
        // Not authenticated, continue showing login
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send magic code');
      }

      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      // Use full page reload to ensure server-side layout renders properly
      window.location.href = '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Enter Code</h1>
            <p className="text-gray-600 mt-2">
              We&apos;ve sent a verification code to <br />
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleCodeSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8))}
                placeholder="ABCD1234"
                required
                autoComplete="one-time-code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-center text-2xl tracking-widest uppercase"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              disabled={loading || code.length !== 8}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              className="text-sm text-gray-500 hover:text-green-600"
            >
              ← Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in with your @taskclearers.com email</p>
        </div>

        <form onSubmit={handleEmailSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@taskclearers.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Magic Code'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-green-600">
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
