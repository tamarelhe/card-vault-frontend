'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryKeys } from '@cardvault/api';
import { changePasswordSchema, type ChangePasswordInput } from '@cardvault/validation';
import { ApiError, UnauthorizedError } from '@cardvault/api';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { profileApi, getAvatarUrl } from '@/lib/api-instance';
import {
  IconCamera, IconCheck, IconKey, IconSpinner, IconUpload,
} from '@/components/icons';

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}

// ─── Avatar circle ────────────────────────────────────────────────────────────

function AvatarCircle({
  avatarUrl,
  label,
  size = 'lg',
}: {
  avatarUrl?: string | null;
  label: string;
  size?: 'sm' | 'lg';
}) {
  const dim = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8';
  const text = size === 'lg' ? 'text-xl' : 'text-sm';
  const initial = (label[0] ?? '?').toUpperCase();

  if (avatarUrl) {
    return (
      <div className={`${dim} shrink-0 overflow-hidden rounded-full border-2 border-cv-border`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getAvatarUrl(avatarUrl)} alt={label} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${dim} shrink-0 flex items-center justify-center rounded-full bg-primary/20 ${text} font-bold text-primary`}>
      {initial}
    </div>
  );
}

// ─── Avatar picker ────────────────────────────────────────────────────────────

function AvatarPicker({
  currentAvatarUrl,
  onClose,
}: {
  currentAvatarUrl: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const presetsQuery = useQuery({
    queryKey: queryKeys.presetAvatars,
    queryFn: () => profileApi.listPresetAvatars(),
    staleTime: Infinity,
  });

  const presetMutation = useMutation({
    mutationFn: (presetId: string) => profileApi.changeAvatarPreset({ preset_id: presetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      onClose();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      onClose();
    },
    onError: (err) => {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed. Use JPEG, PNG or WebP up to 5 MB.');
    },
  });

  const isBusy = presetMutation.isPending || uploadMutation.isPending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    uploadMutation.mutate(file);
  }

  function extractPresetId(url: string): string {
    return url.split('/').pop() ?? '';
  }

  const presets = presetsQuery.data?.avatars ?? [];

  return (
    <div className="mt-5 border-t border-cv-border pt-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cv-neutral">Choose a preset</p>

      {presetsQuery.isLoading && (
        <div className="flex items-center gap-2 py-4 text-sm text-cv-neutral">
          <IconSpinner className="h-4 w-4 animate-spin" />
          Loading avatars…
        </div>
      )}

      {presets.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {presets.map((url) => {
            const id = extractPresetId(url);
            const isActive = currentAvatarUrl.endsWith(id);
            return (
              <button
                key={id}
                disabled={isBusy}
                onClick={() => presetMutation.mutate(id)}
                className={[
                  'relative overflow-hidden rounded-xl border-2 transition-all disabled:opacity-50',
                  isActive ? 'border-primary' : 'border-cv-border hover:border-primary/50',
                ].join(' ')}
                title={id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getAvatarUrl(url)}
                  alt={id}
                  className="aspect-square w-full object-cover"
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                    <IconCheck className="h-5 w-5 text-white" />
                  </div>
                )}
                {presetMutation.isPending && presetMutation.variables === id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <IconSpinner className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cv-neutral">Or upload a photo</p>
        {uploadError && (
          <p className="mb-2 text-xs text-red-400">{uploadError}</p>
        )}
        <button
          disabled={isBusy}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-cv-border px-3 py-2 text-sm text-cv-neutral transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
        >
          {uploadMutation.isPending
            ? <IconSpinner className="h-4 w-4 animate-spin" />
            : <IconUpload className="h-4 w-4" />
          }
          {uploadMutation.isPending ? 'Uploading…' : 'Upload photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <button
        onClick={onClose}
        className="mt-4 text-xs text-cv-neutral hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Change password form ─────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      profileApi.changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      }),
    onSuccess: () => {
      setSuccess(true);
      setServerError(null);
      reset();
    },
    onError: (err) => {
      setSuccess(false);
      if (err instanceof UnauthorizedError) {
        setServerError('Current password is incorrect.');
      } else if (err instanceof ApiError && err.status === 422) {
        const msg = err.message.toLowerCase();
        if (msg.includes('incorrect') || msg.includes('wrong') || msg.includes('current')) {
          setServerError('Current password is incorrect.');
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    },
  });

  const inputCls =
    'mt-1.5 block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2 text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50';

  return (
    <form
      onSubmit={handleSubmit((data) => { setSuccess(false); setServerError(null); mutation.mutate(data); })}
      noValidate
      className="space-y-4"
    >
      {serverError && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-400">
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-900/50 bg-green-950/40 px-3 py-2 text-xs text-secondary">
          Password updated successfully.
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-cv-neutral" htmlFor="currentPassword">
          Current password
        </label>
        <input
          {...register('currentPassword')}
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          className={inputCls}
        />
        {errors.currentPassword && (
          <p className="mt-1 text-xs text-red-400">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-cv-neutral" htmlFor="newPassword">
          New password
        </label>
        <input
          {...register('newPassword')}
          id="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          className={inputCls}
        />
        {errors.newPassword && (
          <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-cv-neutral" htmlFor="confirmNewPassword">
          Confirm new password
        </label>
        <input
          {...register('confirmNewPassword')}
          id="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          className={inputCls}
        />
        {errors.confirmNewPassword && (
          <p className="mt-1 text-xs text-red-400">{errors.confirmNewPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {(isSubmitting || mutation.isPending) && <IconSpinner className="h-4 w-4 animate-spin" />}
        Update password
      </button>
    </form>
  );
}

// ─── Profile content ──────────────────────────────────────────────────────────

function ProfileContent() {
  const { userEmail, username: contextUsername, logout } = useAuth();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => profileApi.getProfile(),
  });

  const profile = profileQuery.data;
  const displayName = profile?.username ?? contextUsername ?? userEmail ?? '';
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="flex-1 p-6 lg:p-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-white">Profile</h1>

      <div className="max-w-md space-y-4">

        {/* ── Identity card ── */}
        <div className="rounded-2xl border border-cv-border bg-cv-raised p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <AvatarCircle avatarUrl={avatarUrl} label={displayName} size="lg" />
              <button
                onClick={() => setShowAvatarPicker((v) => !v)}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-cv-border bg-cv-raised text-cv-neutral transition-colors hover:text-white"
                title="Change avatar"
              >
                <IconCamera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">
                @{profile?.username ?? contextUsername ?? '…'}
              </p>
              <p className="truncate text-sm text-cv-neutral">
                {profile?.email ?? userEmail}
              </p>
            </div>
            {profileQuery.isLoading && (
              <IconSpinner className="ml-auto h-4 w-4 shrink-0 animate-spin text-cv-neutral" />
            )}
          </div>

          {showAvatarPicker && avatarUrl !== null && (
            <AvatarPicker
              currentAvatarUrl={avatarUrl}
              onClose={() => setShowAvatarPicker(false)}
            />
          )}
          {showAvatarPicker && avatarUrl === null && !profileQuery.isLoading && (
            <AvatarPicker
              currentAvatarUrl=""
              onClose={() => setShowAvatarPicker(false)}
            />
          )}
        </div>

        {/* ── Change password ── */}
        <div className="rounded-2xl border border-cv-border bg-cv-raised">
          <button
            onClick={() => setShowPasswordForm((v) => !v)}
            className="flex w-full items-center gap-3 px-6 py-4 text-left text-sm font-medium text-white"
          >
            <IconKey className="h-4 w-4 text-cv-neutral" />
            Change password
            <span className="ml-auto text-xs text-cv-neutral">{showPasswordForm ? '▲' : '▼'}</span>
          </button>
          {showPasswordForm && (
            <div className="border-t border-cv-border px-6 pb-6 pt-4">
              <ChangePasswordForm />
            </div>
          )}
        </div>

        {/* ── Sign out ── */}
        <button
          onClick={() => void logout()}
          className="w-full rounded-lg border border-red-900/60 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-950/40 focus:outline-none"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
