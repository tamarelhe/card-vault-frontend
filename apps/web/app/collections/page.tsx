'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryKeys } from '@cardvault/api';
import { createCollectionSchema, type CreateCollectionInput } from '@cardvault/validation';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import { IconFolder, IconSpinner } from '@/components/icons';

export default function CollectionsPage() {
  return (
    <AppShell>
      <CollectionsContent />
    </AppShell>
  );
}

function CollectionsContent() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.collections,
    queryFn: () => collectionsApi.list({ page: 1, page_size: 100 }),
  });

  const { mutateAsync: createCollection, isPending } = useMutation({
    mutationFn: (body: CreateCollectionInput) =>
      collectionsApi.create({
        name: body.name,
        ...(body.description ? { description: body.description } : {}),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collections }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCollectionInput>({ resolver: zodResolver(createCollectionSchema) });

  async function onSubmit(data: CreateCollectionInput) {
    await createCollection(data);
    reset();
    setShowCreate(false);
  }

  const inputCls =
    'mt-1.5 block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2.5 text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50';

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Collections</h1>
          <p className="mt-1 text-sm text-cv-neutral">
            {data?.meta.total ?? 0} collection{data?.meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          New collection
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-2xl border border-cv-border bg-cv-raised p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">New collection</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300" htmlFor="name">
                Name
              </label>
              <input
                {...register('name')}
                id="name"
                placeholder="My collection"
                disabled={isPending}
                className={inputCls}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300" htmlFor="description">
                Description{' '}
                <span className="font-normal text-cv-neutral">(optional)</span>
              </label>
              <input
                {...register('description')}
                id="description"
                placeholder="A short description…"
                disabled={isPending}
                className={inputCls}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); reset(); }}
                className="rounded-lg border border-cv-border px-4 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load collections.
        </div>
      )}

      {!isLoading && !isError && !data?.items.length && (
        <div className="py-20 text-center">
          <IconFolder className="mx-auto mb-3 h-12 w-12 text-cv-border" />
          <p className="text-sm font-medium text-white">No collections yet</p>
          <p className="mt-1 text-xs text-cv-neutral">Click &ldquo;New collection&rdquo; to create one.</p>
        </div>
      )}

      {!isLoading && !isError && !!data?.items.length && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="group flex flex-col rounded-2xl border border-cv-border bg-cv-raised p-5 transition hover:border-primary/40 hover:bg-cv-overlay"
            >
              <div className="mb-3 flex items-center gap-2">
                <IconFolder className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="truncate text-sm font-semibold text-white group-hover:text-primary-light">
                  {col.name}
                </span>
              </div>
              {col.description ? (
                <p className="line-clamp-2 text-xs text-cv-neutral">{col.description}</p>
              ) : (
                <p className="text-xs italic text-cv-border">No description</p>
              )}
              <p className="mt-3 text-[11px] text-cv-neutral">
                Updated {new Date(col.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
