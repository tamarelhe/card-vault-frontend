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
import { collectionsApi, getAvatarUrl, importsApi } from '@/lib/api-instance';
import {
  IconFolder, IconGlobe, IconLock, IconLogOut, IconPlus,
  IconSpinner, IconUpload, IconUsers, IconX,
} from '@/components/icons';
import type { Collection } from '@cardvault/core';

// ─── Import formats ───────────────────────────────────────────────────────────

const IMPORT_FORMATS = [
  { label: 'Manabox',   value: 'manabox',   enabled: true },
  { label: 'Moxfield',  value: 'moxfield',  enabled: false },
  { label: 'Archidekt', value: 'archidekt', enabled: false },
] as const;

type ImportPlatform = 'manabox' | 'moxfield' | 'archidekt';

const IMPORT_TIMEOUT_MS = 90_000;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  return (
    <AppShell>
      <CollectionsContent />
    </AppShell>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

type ConfirmLeave = { id: string; name: string };

function CollectionsContent() {
  const { userEmail, username } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState<ConfirmLeave | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.collections,
    queryFn: () => collectionsApi.list({ page: 1, page_size: 100 }),
    staleTime: 0,
  });

  const { mutateAsync: createCollection, isPending: isCreating } = useMutation({
    mutationFn: (body: CreateCollectionInput) =>
      collectionsApi.create({
        name: body.name,
        ...(body.description ? { description: body.description } : {}),
        visibility: body.visibility ?? 'private',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
      queryClient.invalidateQueries({ queryKey: queryKeys.topMoversBase });
      setShowCreate(false);
    },
  });

  const { mutateAsync: leaveCollection, isPending: isLeaving } = useMutation({
    mutationFn: (id: string) => collectionsApi.leaveCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
      queryClient.invalidateQueries({ queryKey: queryKeys.topMoversBase });
      setConfirmLeave(null);
    },
  });

  const owned = data?.items.filter(c => (c.ownership ?? 'owned') === 'owned') ?? [];
  const shared = data?.items.filter(c => c.ownership === 'shared') ?? [];

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
            {!owned.length ? (
              <EmptyState
                icon={<IconFolder className="h-8 w-8 text-cv-border" />}
                title="No collections yet"
                subtitle='Click "New collection" to create one.'
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {owned.map(col => (
                  <CollectionItem
                    key={col.id}
                    col={col}
                    ownerLabel={username ? `@${username}` : (userEmail ?? '')}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Shared with me ── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-cv-neutral">Shared with me</h2>
            {!shared.length ? (
              <EmptyState
                icon={<IconUsers className="h-8 w-8 text-cv-border" />}
                title="No shared collections"
                subtitle="Collections shared by other users will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {shared.map(col => (
                  <CollectionItem
                    key={col.id}
                    col={col}
                    ownerLabel={col.owner?.username ? `@${col.owner.username}` : (col.owner?.email ?? '')}
                    ownerAvatarUrl={col.owner?.avatar_url}
                    onLeave={() => setConfirmLeave({ id: col.id, name: col.name })}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showCreate && (
        <NewCollectionModal
          onClose={() => setShowCreate(false)}
          onCreate={createCollection}
          isPending={isCreating}
        />
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} ownedCollections={owned} />}

      {confirmLeave && (
        <ConfirmModal
          title="Leave collection"
          message={`Are you sure you want to leave "${confirmLeave.name}"? You will lose access to it.`}
          confirmLabel="Leave"
          isPending={isLeaving}
          onConfirm={() => leaveCollection(confirmLeave.id)}
          onClose={() => setConfirmLeave(null)}
        />
      )}
    </div>
  );
}

// ─── Owner avatar (small) ─────────────────────────────────────────────────────

function OwnerAvatar({ label, avatarUrl }: { label: string; avatarUrl?: string | undefined }) {
  const initial = (label.replace('@', '')[0] ?? '?').toUpperCase();
  if (avatarUrl) {
    return (
      <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-cv-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getAvatarUrl(avatarUrl)} alt={label} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
      {initial}
    </div>
  );
}

// ─── Collection item ──────────────────────────────────────────────────────────

function CollectionItem({
  col,
  ownerLabel,
  ownerAvatarUrl,
  onLeave,
}: {
  col: Collection;
  ownerLabel: string;
  ownerAvatarUrl?: string | undefined;
  onLeave?: () => void;
}) {
  const isPublic = col.visibility === 'public';
  const isShared = col.ownership === 'shared';

  return (
    <div className="group flex flex-col gap-1.5 rounded-xl border border-cv-border bg-cv-raised px-4 py-3 transition hover:border-primary/40 hover:bg-cv-overlay">
      {/* Row 1: name (flex-1) | [badge · avatar · owner · leave] (shrink-0, right) */}
      <div className="flex items-center gap-2">
        <Link
          href={`/collections/${col.id}`}
          className="min-w-0 flex-1 truncate text-sm font-medium text-white hover:text-primary-light"
        >
          {col.name}
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {isShared && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary-light">
              Shared
            </span>
          )}
          {ownerLabel && (
            <>
              <OwnerAvatar label={ownerLabel} avatarUrl={ownerAvatarUrl} />
              <span className="text-[11px] text-cv-neutral">{ownerLabel}</span>
            </>
          )}
          {isShared && (
            <button
              onClick={onLeave}
              title="Leave collection"
              className="rounded p-1 text-cv-neutral opacity-0 transition group-hover:opacity-100 hover:bg-cv-overlay hover:text-red-400"
            >
              <IconLogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2+3: navigate on click */}
      <Link href={`/collections/${col.id}`} className="flex flex-col gap-1.5">
        <p className="truncate text-xs text-cv-neutral">
          {col.description || <span className="italic text-cv-border">No description</span>}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-cv-neutral">
          <span>{col.total_cards} cards</span>
          <span>·</span>
          <span>€{col.total_value_eur.toFixed(2)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            {isPublic
              ? <><IconGlobe className="h-3 w-3" /> Public</>
              : <><IconLock className="h-3 w-3" /> Private</>
            }
          </span>
        </div>
      </Link>
    </div>
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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCollectionInput>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: { visibility: 'private' },
  });

  const visibility = watch('visibility');

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

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel, isPending, onConfirm, onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={!isPending ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-2 text-base font-semibold text-white">{title}</h2>
        <p className="mb-5 text-sm text-cv-neutral">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-cv-border px-4 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────

type ImportPhase = 'form' | 'uploading' | 'polling' | 'done' | 'failed' | 'timeout';

function ImportModal({ onClose, ownedCollections }: { onClose: () => void; ownedCollections: Collection[] }) {
  const queryClient = useQueryClient();
  const [collectionId, setCollectionId] = useState('');
  const [platform, setPlatform] = useState<ImportPlatform>('manabox');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<ImportPhase>('form');
  const [summary, setSummary] = useState<import('@cardvault/core').ImportJobSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  async function handleSubmit() {
    if (!file || !collectionId) return;
    setPhase('uploading');
    try {
      const job = await importsApi.submit({ file, platform, collection_id: collectionId });
      setPhase('polling');

      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setPhase('timeout');
      }, IMPORT_TIMEOUT_MS);

      pollRef.current = setInterval(async () => {
        try {
          const status = await importsApi.getStatus(job.id);
          if (status.status === 'done') {
            stopPolling();
            setSummary(status.summary);
            queryClient.invalidateQueries({ queryKey: queryKeys.collections });
            setPhase('done');
          } else if (status.status === 'failed') {
            stopPolling();
            setErrorMsg('Import failed on the server.');
            setPhase('failed');
          }
        } catch {
          stopPolling();
          setErrorMsg('Failed to check import status.');
          setPhase('failed');
        }
      }, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
      setPhase('failed');
    }
  }

  const inputCls =
    'block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2 text-sm text-white focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30';

  const canClose = phase === 'form' || phase === 'done' || phase === 'failed' || phase === 'timeout';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={canClose ? onClose : undefined}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Import collection</h2>
          {canClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Form ── */}
        {phase === 'form' && (
          <div className="flex flex-col gap-4">
            {/* Collection */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                Collection
              </label>
              <select value={collectionId} onChange={e => setCollectionId(e.target.value)} className={inputCls}>
                <option value="">Select a collection…</option>
                {ownedCollections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                Format
              </label>
              <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
                {IMPORT_FORMATS.map(({ label, value, enabled }) => (
                  <button
                    key={value}
                    disabled={!enabled}
                    onClick={() => setPlatform(value)}
                    title={!enabled ? 'Coming soon' : undefined}
                    className={[
                      'relative flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors',
                      !enabled
                        ? 'cursor-not-allowed text-cv-border'
                        : platform === value
                          ? 'bg-primary text-white'
                          : 'text-cv-neutral hover:text-white',
                    ].join(' ')}
                  >
                    {label}
                    {!enabled && (
                      <span className="absolute -right-0.5 -top-1.5 rounded text-[9px] leading-none text-cv-neutral">
                        soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* File drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={[
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
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
                disabled={!file || !collectionId}
                onClick={handleSubmit}
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
        )}

        {/* ── Uploading / Polling ── */}
        {(phase === 'uploading' || phase === 'polling') && (
          <div className="flex flex-col items-center gap-4 py-8">
            <IconSpinner className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-cv-neutral">
              {phase === 'uploading' ? 'Uploading file…' : 'Processing import…'}
            </p>
          </div>
        )}

        {/* ── Done ── */}
        {phase === 'done' && summary && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-cv-border bg-cv-surface px-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: 'Total rows', value: summary.total },
                  { label: 'Imported', value: summary.imported },
                  { label: 'Merged', value: summary.merged },
                  { label: 'Skipped', value: summary.skipped },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-cv-neutral">{label}</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
              {(summary.errors?.length ?? 0) > 0 && (
                <div className="mt-3 border-t border-cv-border/50 pt-3">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-cv-neutral">
                    Errors ({summary.errors.length})
                  </p>
                  <ul className="max-h-28 overflow-y-auto text-xs text-red-400 space-y-1">
                    {summary.errors.map((e, i) => (
                      <li key={i}>Row {e.row} — {e.name}: {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Done
            </button>
          </div>
        )}

        {/* ── Failed / Timeout ── */}
        {(phase === 'failed' || phase === 'timeout') && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {phase === 'timeout'
                ? 'Import timed out after 30 seconds. Please try again.'
                : errorMsg || 'Import failed.'}
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-cv-border px-4 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
