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

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collections</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data?.meta.total ?? 0} collection{data?.meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New collection
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">New collection</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="name">
                Name
              </label>
              <input
                {...register('name')}
                id="name"
                placeholder="My collection"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="description">
                Description{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                {...register('description')}
                id="description"
                placeholder="A short description…"
                disabled={isPending}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
                Create
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); reset(); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-slate-400">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700 ring-1 ring-red-200">
          Failed to load collections.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && !data?.items.length && (
        <div className="py-20 text-center">
          <IconFolder className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">No collections yet</p>
          <p className="mt-1 text-xs text-slate-400">Click &ldquo;New collection&rdquo; to create one.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && !!data?.items.length && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:ring-blue-400"
            >
              <div className="mb-3 flex items-center gap-2">
                <IconFolder className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                  {col.name}
                </span>
              </div>
              {col.description ? (
                <p className="line-clamp-2 text-xs text-slate-500">{col.description}</p>
              ) : (
                <p className="text-xs text-slate-300 italic">No description</p>
              )}
              <p className="mt-3 text-[11px] text-slate-400">
                Updated {new Date(col.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
