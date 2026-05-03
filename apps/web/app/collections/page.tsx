'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryKeys } from '@cardvault/api';
import { createCollectionSchema, type CreateCollectionInput } from '@cardvault/validation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import {
  IconFolder, IconGlobe, IconLock, IconPlus,
  IconSpinner, IconUpload, IconUsers, IconX,
} from '@/components/icons';
import type { Collection } from '@cardvault/core';

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
  const { userEmail } = useAuth();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
      setShowCreate(false);
    },
  });

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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:px-4"
            aria-label="New collection"
          >
            <IconPlus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">New collection</span>
          </button>
        </div>
      </div>

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ── Mine ── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-cv-neutral">Mine</h2>
            {!data?.items.length ? (
              <EmptyState
                icon={<IconFolder className="h-8 w-8 text-cv-border" />}
                title="No collections yet"
                subtitle='Click "New collection" to create one.'
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {data.items.map(col => (
                  <CollectionItem
                    key={col.id}
                    col={col}
                    owner={userEmail ?? ''}
                    isPublic={false}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Shared with me ── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-cv-neutral">Shared with me</h2>
            <EmptyState
              icon={<IconUsers className="h-8 w-8 text-cv-border" />}
              title="No shared collections"
              subtitle="Collections shared by other users will appear here."
            />
          </section>
        </div>
      )}

      {showCreate && (
        <NewCollectionModal
          onClose={() => setShowCreate(false)}
          onCreate={createCollection}
          isPending={isPending}
        />
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ─── Collection item ──────────────────────────────────────────────────────────

function CollectionItem({
  col, owner, isPublic,
}: {
  col: Collection;
  owner: string;
  isPublic: boolean;
}) {
  return (
    <Link
      href={`/collections/${col.id}`}
      className="group flex flex-col gap-1.5 rounded-xl border border-cv-border bg-cv-raised px-4 py-3 transition hover:border-primary/40 hover:bg-cv-overlay"
    >
      {/* Row 1: visibility icon + name | owner */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {isPublic
            ? <IconGlobe className="h-3.5 w-3.5 shrink-0 text-cv-neutral" />
            : <IconLock className="h-3.5 w-3.5 shrink-0 text-cv-neutral" />
          }
          <span className="truncate text-sm font-medium text-white group-hover:text-primary-light">
            {col.name}
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-cv-neutral">{owner}</span>
      </div>

      {/* Row 2: description */}
      <p className="truncate text-xs text-cv-neutral">
        {col.description || <span className="italic text-cv-border">No description</span>}
      </p>

      {/* Row 3: card count + total value */}
      <div className="flex items-center gap-3 text-[11px] text-cv-neutral">
        <span>{col.card_count ?? '—'} cards</span>
        <span>·</span>
        <span>{col.total_value != null ? `€${parseFloat(col.total_value).toFixed(2)}` : '—'}</span>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-cv-border bg-cv-raised px-6 py-12 text-center">
      {icon}
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-cv-neutral">{subtitle}</p>
    </div>
  );
}

// ─── New collection modal ─────────────────────────────────────────────────────

function NewCollectionModal({
  onClose, onCreate, isPending,
}: {
  onClose: () => void;
  onCreate: (data: CreateCollectionInput) => Promise<unknown>;
  isPending: boolean;
}) {
  const [isPublic, setIsPublic] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCollectionInput>({ resolver: zodResolver(createCollectionSchema) });

  async function onSubmit(data: CreateCollectionInput) {
    await onCreate(data);
  }

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
          <h2 className="text-base font-semibold text-white">New collection</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
              Name
            </label>
            <input
              {...register('name')}
              placeholder="My collection"
              disabled={isPending}
              className={inputCls}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
              Description <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              {...register('description')}
              placeholder="A short description…"
              disabled={isPending}
              className={inputCls}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
              Visibility
            </label>
            <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
              {[
                { value: false, label: 'Private', Icon: IconLock },
                { value: true, label: 'Public', Icon: IconGlobe },
              ].map(({ value, label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsPublic(value)}
                  className={[
                    'flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
                    isPublic === value ? 'bg-primary text-white' : 'text-cv-neutral hover:text-white',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Import collection</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

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
