'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryKeys } from '@cardvault/api';
import { createWishlistSchema, type CreateWishlistInput } from '@cardvault/validation';
import { AppShell } from '@/components/AppShell';
import { wishlistsApi } from '@/lib/api-instance';
import {
  IconGlobe, IconLock, IconPlus, IconSpinner, IconStar, IconX,
} from '@/components/icons';
import type { Wishlist } from '@cardvault/core';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WishlistPage() {
  return (
    <AppShell>
      <WishlistsContent />
    </AppShell>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function WishlistsContent() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.wishlists,
    queryFn: () => wishlistsApi.list({ page: 1, page_size: 100 }),
    staleTime: 0,
  });

  const { mutateAsync: createWishlist, isPending: isCreating } = useMutation({
    mutationFn: (body: CreateWishlistInput) =>
      wishlistsApi.create({
        name: body.name,
        ...(body.description ? { description: body.description } : {}),
        visibility: body.visibility ?? 'private',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlists });
      queryClient.invalidateQueries({ queryKey: queryKeys.topMoversBase });
      setShowCreate(false);
    },
  });

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Wishlists</h1>
          <p className="mt-1 text-sm text-cv-neutral">
            {data?.meta.total ?? 0} wishlist{data?.meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:px-4"
          aria-label="New wishlist"
        >
          <IconPlus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">New wishlist</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load wishlists.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {!data?.items.length ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-cv-border bg-cv-raised px-6 py-16 text-center">
              <IconStar className="h-10 w-10 text-cv-border" />
              <p className="text-sm font-medium text-white">No wishlists yet</p>
              <p className="text-xs text-cv-neutral">Create a wishlist to track cards you want to acquire.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map(wl => (
                <WishlistItem key={wl.id} wl={wl} />
              ))}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <NewWishlistModal
          onClose={() => setShowCreate(false)}
          onCreate={createWishlist}
          isPending={isCreating}
        />
      )}
    </div>
  );
}

// ─── Wishlist item card ───────────────────────────────────────────────────────

function WishlistItem({ wl }: { wl: Wishlist }) {
  const isPublic = wl.visibility === 'public';

  return (
    <Link
      href={`/watchlist/${wl.id}`}
      className="group flex flex-col gap-1.5 rounded-xl border border-cv-border bg-cv-raised px-4 py-3 transition hover:border-primary/40 hover:bg-cv-overlay"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white group-hover:text-primary-light">
          {wl.name}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-cv-neutral">
          {isPublic
            ? <><IconGlobe className="h-3 w-3" /> Public</>
            : <><IconLock className="h-3 w-3" /> Private</>
          }
        </span>
      </div>
      <p className="truncate text-xs text-cv-neutral">
        {wl.description || <span className="italic text-cv-border">No description</span>}
      </p>
      <div className="flex items-center gap-1 text-[11px] text-cv-neutral">
        <IconStar className="h-3 w-3" />
        <span>{wl.total_items} item{wl.total_items !== 1 ? 's' : ''}</span>
      </div>
    </Link>
  );
}

// ─── New wishlist modal ───────────────────────────────────────────────────────

function NewWishlistModal({
  onClose, onCreate, isPending,
}: {
  onClose: () => void;
  onCreate: (data: CreateWishlistInput) => Promise<unknown>;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateWishlistInput>({
    resolver: zodResolver(createWishlistSchema),
    defaultValues: { visibility: 'private' },
  });

  const visibility = watch('visibility');

  const inputCls =
    'block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2 text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">New wishlist</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(data => onCreate(data))} noValidate className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
              Name
            </label>
            <input
              {...register('name')}
              placeholder="Sultai Deck"
              disabled={isPending}
              className={inputCls}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
              Description <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              {...register('description')}
              placeholder="Cards I need for my Sultai commander build…"
              disabled={isPending}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
              Visibility
            </label>
            <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
              {[
                { value: 'private' as const, label: 'Private', Icon: IconLock },
                { value: 'public' as const, label: 'Public', Icon: IconGlobe },
              ].map(({ value, label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setValue('visibility', value)}
                  className={[
                    'flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
                    visibility === value ? 'bg-primary text-white' : 'text-cv-neutral hover:text-white',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-cv-border px-4 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
