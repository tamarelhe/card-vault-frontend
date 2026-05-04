'use client';

import Image from 'next/image';
import Link from 'next/link';
import logoSrc from '../../assets/images/logo.png';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@cardvault/api';
import { loginSchema, type LoginInput } from '@cardvault/validation';
import { useAuth } from '@/context/AuthContext';
import { IconSpinner } from '@/components/icons';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-cv-deep">
        <IconSpinner className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(next ?? '/dashboard');
  }, [isAuthenticated, isLoading, router, next]);

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    try {
      await login(data.email, data.password, next);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cv-deep">
        <IconSpinner className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (

    <div className="flex min-h-screen items-center justify-center bg-cv-deep px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src={logoSrc} alt="CardVault" className="w-32 h-auto" />
          <p className="mt-3 text-sm text-cv-neutral">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-cv-border bg-cv-raised p-8">
          {serverError && (
            <div className="mb-5 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="mt-1.5 block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2.5 text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2.5 pr-16 text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-3 text-xs font-medium text-cv-neutral hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-cv-raised disabled:opacity-60"
            >
              {isSubmitting && <IconSpinner className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-cv-neutral">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:text-primary-light">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
