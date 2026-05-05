'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import type { ListCollectionCardsParams, UpdateCollectionCardBody } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import {
  IconArrowPath, IconCheck, IconChevronLeft, IconChevronRight,
  IconClipboard, IconFolder, IconGlobe, IconLink, IconLock, IconLogOut, IconSpinner, IconTrash, IconX,
} from '@/components/icons';
import { CONDITIONS, CONDITION_LIST } from '@cardvault/core';
import type { CollectionCard, SharedUser } from '@cardvault/core';
import {
  CardFilterPanel,
  EMPTY_COLOR_FILTER,
  EMPTY_PANEL,
  type ColorFilterState,
  type PanelFilters,
} from '@/components/CardFilterPanel';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_FIELDS = [
  { value: 'name',             label: 'Name' },
  { value: 'collector_number', label: 'Collector #' },
  { value: 'rarity',           label: 'Rarity' },
  { value: 'cmc',              label: 'Mana Cost' },
  { value: 'condition',        label: 'Condition' },
  { value: 'quantity',         label: 'Quantity' },
  { value: 'added_at',         label: 'Date Added' },
  { value: 'price',            label: 'Price' },
];

const RARITY_COLORS: Record<string, string> = {
  common:   'text-slate-400',
  uncommon: 'text-secondary',
  rare:     'text-yellow-400',
  mythic:   'text-tertiary-light',
  special:  'text-primary-light',
  bonus:    'text-pink-400',
};


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <CollectionDetail id={id} />
    </AppShell>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function CollectionDetail({ id }: { id: string }) {
  const [filters, setFilters] = useState<PanelFilters>(EMPTY_PANEL);
  const [colorFilter, setColorFilter] = useState<ColorFilterState>(EMPTY_COLOR_FILTER);
  const [submitted, setSubmitted] = useState<ListCollectionCardsParams>({ sort_by: 'name', sort_order: 'asc', page: 1, page_size: 20 });
  const [showShare, setShowShare] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  const { data: collection } = useQuery({
    queryKey: queryKeys.collection(id),
    queryFn: () => collectionsApi.getById(id),
  });

  const { data: cards, isLoading, isError } = useQuery({
    queryKey: queryKeys.collectionItems(id, submitted as Record<string, unknown>),
    queryFn: () => collectionsApi.listCards(id, submitted),
  });

  function handleSearch(page = 1) {
    const params: ListCollectionCardsParams = {
      ...(filters.q                && { q:                filters.q }),
      ...(filters.set_code         && { set_code:         filters.set_code }),
      ...(filters.collector_number && { collector_number: filters.collector_number }),
      ...(filters.rarity           && { rarity:           filters.rarity }),
      ...(filters.card_type        && { card_type:        filters.card_type }),
      ...(filters.mana_cost        && { mana_cost:        filters.mana_cost, mana_cost_op: filters.mana_cost_op }),
      ...(filters.power            && { power:            filters.power, power_op: filters.power_op }),
      ...(filters.toughness        && { toughness:        filters.toughness, toughness_op: filters.toughness_op }),
      ...(colorFilter.colors.length > 0 && {
        colors: colorFilter.colors,
        color_match: colorFilter.mode as NonNullable<ListCollectionCardsParams['color_match']>,
      }),
      sort_by:    filters.sort_by as NonNullable<ListCollectionCardsParams['sort_by']>,
      sort_order: filters.sort_order,
      page,
      page_size: 20,
    };
    setSubmitted(params);
  }

  function handleReset() {
    setFilters(EMPTY_PANEL);
    setColorFilter(EMPTY_COLOR_FILTER);
    setSubmitted({ sort_by: 'name', sort_order: 'asc', page: 1, page_size: 20 });
  }

  function toggleColor(code: string) {
    setColorFilter(f => ({
      ...f,
      colors: f.colors.includes(code) ? f.colors.filter(c => c !== code) : [...f.colors, code],
    }));
  }

  const extraFilterCount =
    [filters.card_type, filters.rarity, filters.mana_cost, filters.power, filters.toughness]
      .filter(Boolean).length + (colorFilter.colors.length > 0 ? 1 : 0);

  const totalPages = cards ? Math.ceil(cards.meta.total / 20) : 0;
  const currentPage = submitted.page ?? 1;

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-cv-neutral">
        <Link href="/collections" className="transition-colors hover:text-white">Collections</Link>
        <span>/</span>
        <span className="font-medium text-white">{collection?.name ?? '…'}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <IconFolder className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-2xl font-bold text-white">{collection?.name ?? '…'}</h1>
            {collection?.description && (
              <p className="text-sm text-cv-neutral">{collection.description}</p>
            )}
          </div>
          {collection && (
            <div className="mt-1 flex flex-col gap-0.5 text-xs font-semibold text-cv-neutral sm:flex-row sm:items-center sm:gap-3">
              {/* Line 1: cards · value */}
              <div className="flex items-center gap-3">
                <span>{collection.total_cards} cards</span>
                <span>·</span>
                <span>€{collection.total_value_eur.toFixed(2)}</span>
              </div>
              <span className="hidden sm:inline">·</span>
              {/* Line 2: visibility · owner */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  {collection.visibility === 'public'
                    ? <><IconGlobe className="h-3 w-3" /> Public</>
                    : <><IconLock className="h-3 w-3" /> Private</>
                  }
                </span>
                {collection.owner?.email && (
                  <>
                    <span>·</span>
                    <span className="font-normal">{collection.owner.email}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {collection && (
          <div className="flex shrink-0 items-center gap-2">
            {collection.ownership === 'owned' ? (
              <>
                <button
                  onClick={() => setShowShare(true)}
                  disabled={collection.visibility === 'private'}
                  title={collection.visibility === 'private' ? 'Make the collection public first to share it' : 'Share collection'}
                  className="flex items-center gap-1.5 rounded-lg border border-cv-border px-2.5 py-1.5 text-sm text-cv-neutral transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                >
                  <IconLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  title="Delete collection"
                  className="flex items-center gap-1.5 rounded-lg border border-red-900/50 px-2.5 py-1.5 text-sm text-red-400 transition hover:bg-red-950/40 sm:px-3"
                >
                  <IconTrash className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLeave(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-950/40"
              >
                <IconLogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Leave</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter panel */}
      <CardFilterPanel
        filters={filters}
        colorFilter={colorFilter}
        extraFilterCount={extraFilterCount}
        onChange={(key, value) => setFilters(f => ({ ...f, [key]: value }))}
        onColorToggle={toggleColor}
        onColorMode={mode => setColorFilter(f => ({ ...f, mode }))}
        onSearch={handleSearch}
        onReset={handleReset}
        sortOptions={SORT_FIELDS}
        showRarity
        showNumericOps
        showColors
      />

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin text-primary" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load cards.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <p className="text-sm text-cv-neutral">
            {cards?.meta.total ?? 0} card{cards?.meta.total !== 1 ? 's' : ''}
          </p>

          {!cards?.items.length ? (
            <div className="py-16 text-center">
              <IconFolder className="mx-auto mb-3 h-10 w-10 text-cv-border" />
              <p className="text-sm font-medium text-white">No cards found</p>
              <p className="mt-1 text-xs text-cv-neutral">Try adjusting your filters or add cards to this collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cards.items.map(card => (
                <CardTile
                  key={card.id}
                  card={card}
                  collectionId={id}
                  canEdit={collection?.ownership === 'owned'}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination current={currentPage} total={totalPages} onChange={handleSearch} />
          )}

          {collection?.ownership === 'owned' && (
            <SharedMembersPanel collectionId={id} />
          )}
        </>
      )}

      {showShare && collection && (
        <ShareLinkModal collectionId={id} onClose={() => setShowShare(false)} />
      )}

      {showDelete && collection && (
        <ConfirmDeleteModal
          collectionId={id}
          collectionName={collection.name}
          onClose={() => setShowDelete(false)}
        />
      )}

      {showLeave && collection && (
        <ConfirmLeaveModal
          collectionId={id}
          collectionName={collection.name}
          onClose={() => setShowLeave(false)}
        />
      )}
    </div>
  );
}

// ─── Card tile ────────────────────────────────────────────────────────────────

function CardTile({
  card,
  collectionId,
  canEdit,
}: {
  card: CollectionCard;
  collectionId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['collection', collectionId, 'items'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.collection(collectionId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.collections });
  }

  const { mutate: updateCard, isPending: isUpdating } = useMutation({
    mutationFn: (body: UpdateCollectionCardBody) =>
      collectionsApi.updateCard(collectionId, card.id, body),
    onSuccess: invalidate,
  });

  const { mutate: removeCard, isPending: isRemoving } = useMutation({
    mutationFn: () => collectionsApi.removeCard(collectionId, card.id),
    onSuccess: invalidate,
  });

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-cv-border bg-cv-surface transition hover:border-primary/40 hover:bg-cv-overlay">
      {/* Image */}
      <button
        onClick={() => router.push(`/cards/${card.card_id}`)}
        className="px-1 pt-1"
        tabIndex={-1}
      >
        {card.image_uri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image_uri}
            alt={card.card_name}
            className="w-full rounded-[5%] transition group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-cv-deep text-xs text-cv-neutral">
            No image
          </div>
        )}
      </button>

      <div className="flex flex-col gap-1.5 p-3 pt-2">
        {/* Set · #collector · rarity · foil */}
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-[11px] uppercase tracking-wide text-cv-neutral">
            {card.set_code} · #{card.collector_number.padStart(4, '0')}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <p className={['text-[11px] capitalize font-medium', RARITY_COLORS[card.rarity] ?? 'text-cv-neutral'].join(' ')}>
              {card.rarity}
            </p>
            {card.foil && <span className="text-[10px] text-secondary">✦</span>}
          </div>
        </div>

        {canEdit ? (
          <div className="flex items-center gap-1.5">
            {/* Condition — shortLabel in select, full label in options */}
            <select
              value={card.condition}
              onChange={e => updateCard({ condition: e.target.value })}
              disabled={isUpdating}
              title={CONDITIONS[card.condition as keyof typeof CONDITIONS]?.label}
              className="min-w-0 flex-1 rounded border border-cv-border bg-cv-surface py-0.5 pl-1 pr-0.5 text-[10px] text-white focus:border-primary/60 focus:outline-none disabled:opacity-60"
            >
              {CONDITION_LIST.map(c => (
                <option key={c} value={c}>{CONDITIONS[c].shortLabel}</option>
              ))}
            </select>

            {/* Quantity stepper */}
            <div className="flex shrink-0 items-center overflow-hidden rounded border border-cv-border">
              <button
                onClick={() => updateCard({ quantity: Math.max(1, card.quantity - 1) })}
                disabled={isUpdating || card.quantity <= 1}
                className="flex h-5 w-5 items-center justify-center border-r border-cv-border text-cv-neutral transition hover:bg-cv-overlay hover:text-white disabled:opacity-30"
              >
                <span className="text-sm leading-none">−</span>
              </button>
              <span className="min-w-[1.5rem] px-0.5 text-center text-[11px] font-medium text-white">
                {card.quantity}
              </span>
              <button
                onClick={() => updateCard({ quantity: card.quantity + 1 })}
                disabled={isUpdating}
                className="flex h-5 w-5 items-center justify-center border-l border-cv-border text-cv-neutral transition hover:bg-cv-overlay hover:text-white disabled:opacity-30"
              >
                <span className="text-sm leading-none">+</span>
              </button>
            </div>

            <span className="h-4 w-px shrink-0 bg-cv-border" />

            {/* Delete */}
            <button
              onClick={() => removeCard()}
              disabled={isRemoving}
              title="Remove from collection"
              className="shrink-0 rounded p-0.5 text-red-500 transition hover:bg-red-950/30 disabled:opacity-50"
            >
              {isRemoving
                ? <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                : <IconTrash className="h-3.5 w-3.5" />
              }
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] text-cv-neutral">
              {CONDITIONS[card.condition as keyof typeof CONDITIONS]?.label ?? card.condition}
            </span>
            <span className="text-[11px] font-medium text-white">×{card.quantity}</span>
          </div>
        )}

        {/* Price */}
        {card.price_eur != null && (
          <p className="text-[11px] font-medium text-white">
            €{parseFloat(card.price_eur).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Share link modal ─────────────────────────────────────────────────────────

function ShareLinkModal({ collectionId, onClose }: { collectionId: string; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => collectionsApi.generateShareLink(collectionId),
    onSuccess: (data) => setToken(data.token),
  });

  const shareUrl = token ? `${window.location.origin}/accept-invite/${token}` : null;

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  const inputCls =
    'block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2 text-sm text-cv-neutral focus:outline-none';

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
          <h2 className="text-base font-semibold text-white">Share collection</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {!token ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-cv-neutral">
              Generate an invite link that others can use to add this collection to their account.
            </p>
            <p className="text-xs text-cv-neutral opacity-70">
              Generating a link will replace any previously created one.
            </p>
            <button
              onClick={() => generate()}
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {isPending ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconLink className="h-4 w-4" />}
              Get share link
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input readOnly value={shareUrl ?? ''} className={inputCls} />
              <button
                onClick={copyLink}
                title="Copy link"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cv-border px-3 py-2 text-sm text-cv-neutral transition hover:border-primary/40 hover:text-primary"
              >
                {copied ? <IconCheck className="h-4 w-4 text-secondary" /> : <IconClipboard className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => { setToken(null); generate(); }}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-cv-neutral transition hover:text-white disabled:opacity-50"
            >
              <IconArrowPath className="h-3.5 w-3.5" />
              Regenerate link (invalidates current)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared members panel ─────────────────────────────────────────────────────

function SharedMembersPanel({ collectionId }: { collectionId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.collectionShares(collectionId),
    queryFn: () => collectionsApi.listSharedUsers(collectionId),
  });

  const { mutate: revoke, isPending: isRevoking } = useMutation({
    mutationFn: (userId: string) => collectionsApi.revokeUserAccess(collectionId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collectionShares(collectionId) }),
  });

  const [revokingId, setRevokingId] = useState<string | null>(null);

  if (isLoading) return null;
  if (!data?.users.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-cv-border bg-cv-raised p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-cv-neutral">
        Shared with ({data.users.length})
      </h3>
      <ul className="flex flex-col gap-2">
        {data.users.map((user: SharedUser) => (
          <li key={user.user_id} className="flex items-center justify-between gap-3">
            <span className="truncate text-sm text-white">{user.email}</span>
            <button
              onClick={() => { setRevokingId(user.user_id); revoke(user.user_id); }}
              disabled={isRevoking && revokingId === user.user_id}
              title="Revoke access"
              className="shrink-0 rounded p-1 text-cv-neutral transition hover:bg-cv-overlay hover:text-red-400 disabled:opacity-50"
            >
              {isRevoking && revokingId === user.user_id
                ? <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                : <IconTrash className="h-3.5 w-3.5" />
              }
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  collectionId,
  collectionName,
  onClose,
}: {
  collectionId: string;
  collectionName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: deleteCollection, isPending } = useMutation({
    mutationFn: () => collectionsApi.delete(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
      router.replace('/collections');
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={!isPending ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-2 text-base font-semibold text-white">Delete collection</h2>
        <p className="mb-5 text-sm text-cv-neutral">
          Are you sure you want to delete &ldquo;{collectionName}&rdquo;? This will permanently remove the collection and all its cards.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => deleteCollection()}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
            Delete
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

// ─── Confirm leave modal ──────────────────────────────────────────────────────

function ConfirmLeaveModal({
  collectionId,
  collectionName,
  onClose,
}: {
  collectionId: string;
  collectionName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: leave, isPending } = useMutation({
    mutationFn: () => collectionsApi.leaveCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
      router.replace('/collections');
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={!isPending ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-2 text-base font-semibold text-white">Leave collection</h2>
        <p className="mb-5 text-sm text-cv-neutral">
          Are you sure you want to leave &ldquo;{collectionName}&rdquo;? You will lose access to it.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => leave()}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
            Leave
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

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ current, total, onChange }: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = buildPageList(current, total);
  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <PageBtn disabled={current <= 1} onClick={() => onChange(current - 1)} aria-label="Previous">
        <IconChevronLeft className="h-4 w-4" />
      </PageBtn>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`el-${i}`} className="px-1 text-sm text-cv-neutral">…</span>
        ) : (
          <PageBtn key={p} active={p === current} onClick={() => onChange(p as number)}>{p}</PageBtn>
        )
      )}
      <PageBtn disabled={current >= total} onClick={() => onChange(current + 1)} aria-label="Next">
        <IconChevronRight className="h-4 w-4" />
      </PageBtn>
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active, 'aria-label': ariaLabel }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:opacity-30',
        active ? 'bg-primary text-white' : 'border border-cv-border text-cv-neutral hover:border-white/20 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}
