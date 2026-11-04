'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { siteConfig } from '@/lib/site-config';
import { toast } from 'sonner';
import { Newspaper, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/admin';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setErrorMessage('Access restricted. Your account does not have Admin or Editor permissions.');
    } else if (errorParam === 'missing_env') {
      setErrorMessage('Supabase is not configured yet. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
    }
  }, [errorParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Double check profile role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
          await supabase.auth.signOut();
          setErrorMessage('Access denied. Only registered Admins and Editors may access the desk.');
          toast.error('Unauthorized user role');
          setLoading(false);
          return;
        }

        toast.success('Welcome back to the Editorial Desk!');
        router.push(nextUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      toast.error('Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-500/30 mb-4">
          <Newspaper className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white">
          Editorial Desk
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {siteConfig.name} Staff Access
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@puneprimetimes.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-red-600 hover:bg-red-700 active:scale-[0.99] transition-all shadow-md shadow-red-600/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying credentials...
            </>
          ) : (
            <>
              Sign In to Newsroom
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center">
        <Link
          href="/"
          className="text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          &larr; Back to {siteConfig.name} public site
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <Suspense fallback={<div className="text-sm text-neutral-500">Loading editorial access...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
