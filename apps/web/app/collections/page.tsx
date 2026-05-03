'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryKeys } from '@cardvault/api';
import { createCollectionSchema, type CreateCollectionInput } from '@cardvault/validation';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import { IconFolder, IconPlus, IconSpinner, IconUpload, IconUsers, IconX } from '@/components/icons';

// ─── Import formats ───────────────────────────────────────────────────────────

const IMPORT_FORMATS = ['Archidekt', 'Moxfield', 'Manabox'] as const;
type ImportFormat = typeof IMPORT_FORMATS[number];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  return (
    <AppShell>
      <CollectionsContent />
    </AppShell>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function CollectionsContent() {
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
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

  async function onSubmit(input: CreateCollectionInput) {
    await createCollection(input);
    reset();
    setShowCreate(false);
  }

  const inputCls =
    'mt-1.5 block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2.5 text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50';

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Collections</h1>
          <p className="mt-1 text-sm text-cv-neutral">
            {data?.meta.total ?? 0} collection{data?.meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg border border-cv-border px-3 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white sm:px-4"
            aria-label="Import"
          >
            <IconUpload className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:px-4"
            aria-label="New collection"
          >
            <IconPlus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">New collection</span>
          </button>
        </div>
      </div>

      {/* New collection form */}
      {showCreate && (
        <div className="mb-6 rounded-2xl border border-cv-border bg-cv-raised p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">New collection</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300" htmlFor="name">Name</label>
              <input {...register('name')} id="name" placeholder="My collection" disabled={isPending} className={inputCls} />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300" htmlFor="description">
                Description <span className="font-normal text-cv-neutral">(optional)</span>
              </label>
              <input {...register('description')} id="description" placeholder="A short description…" disabled={isPending} className={inputCls} />
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

      {!isLoading && !isError && (
        <div className="flex flex-col gap-10">
          {/* ── My collections ── */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-cv-neutral">
              Mine
            </h2>
            {!data?.items.length ? (
              <div className="py-16 text-center">
                <IconFolder className="mx-auto mb-3 h-10 w-10 text-cv-border" />
                <p className="text-sm font-medium text-white">No collections yet</p>
                <p className="mt-1 text-xs text-cv-neutral">Click &ldquo;New collection&rdquo; to create one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map(col => (
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
                    {col.description
                      ? <p className="line-clamp-2 text-xs text-cv-neutral">{col.description}</p>
                      : <p className="text-xs italic text-cv-border">No description</p>
                    }
                    <p className="mt-3 text-[11px] text-cv-neutral">
                      Updated {new Date(col.updated_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ── Shared with me ── */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-cv-neutral">
              Shared with me
            </h2>
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-cv-border bg-cv-raised px-6 py-12 text-center">
              <IconUsers className="h-10 w-10 text-cv-border" />
              <p className="text-sm font-medium text-white">No shared collections</p>
              <p className="mt-0.5 text-xs text-cv-neutral">Collections shared by other users will appear here.</p>
            </div>
          </section>
        </div>
      )}

      {/* Import modal */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<ImportFormat>('Archidekt');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-md rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Import collection</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Format toggle */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cv-neutral">Format</p>
          <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
            {IMPORT_FORMATS.map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={[
                  'flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors',
                  format === f ? 'bg-primary text-white' : 'text-cv-neutral hover:text-white',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={[
            'mb-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
            dragging
              ? 'border-primary bg-primary/10'
              : 'border-cv-border bg-cv-surface hover:border-primary/40 hover:bg-cv-overlay',
          ].join(' ')}
        >
          <IconUpload className={['h-8 w-8', dragging ? 'text-primary' : 'text-cv-neutral'].join(' ')} />
          {file ? (
            <p className="text-center text-sm font-medium text-white">{file.name}</p>
          ) : (
            <p className="text-center text-sm text-cv-neutral">
              Drag file here or{' '}
              <span className="font-medium text-primary-light">click to upload</span>
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,.json"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            disabled={!file}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
          >
            Import
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-cv-border px-4 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
