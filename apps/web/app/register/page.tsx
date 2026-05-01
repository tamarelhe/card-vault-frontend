'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@cardvault/api';
import { registerSchema, type RegisterInput } from '@cardvault/validation';
import { useAuth } from '@/context/AuthContext';
import { IconSpinner } from '@/components/icons';

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    try {
      await registerUser(data.email, data.password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError('An account with this email already exists.');
      } else {
        setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <IconSpinner className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">CardVault</h1>
          <p className="mt-1.5 text-sm text-slate-500">Create your account</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          {serverError && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-16 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-3 text-xs font-medium text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isSubmitting && <IconSpinner className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
