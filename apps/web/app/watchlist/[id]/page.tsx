'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { wishlistsApi, cardsApi } from '@/lib/api-instance';
import {
  IconCheck, IconChevronLeft, IconChevronRight, IconGlobe, IconLock,
  IconPlus, IconSpinner, IconStar, IconTrash, IconX,
} from '@/components/icons';
import { CONDITIONS, CONDITION_LIST } from '@cardvault/core';
import type { Card, CollectionPresence, WishlistItem } from '@cardvault/core';

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  common:   'text-slate-400',
  uncommon: 'text-secondary',
  rare:     'text-yellow-400',
  mythic:   'text-tertiary-light',
  special:  'text-primary-light',
  bonus:    'text-pink-400',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WishlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <WishlistDetail id={id} />
    </AppShell>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function WishlistDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: wishlist } = useQuery({
    queryKey: queryKeys.wishlist(id),
    queryFn: () => wishlistsApi.getById(id),
  });

  const { data: items, isLoading, isError } = useQuery({
    queryKey: queryKeys.wishlistItems(id, { page }),
    queryFn: () => wishlistsApi.listItems(id, { page, page_size: 20 }),
  });

  const { mutate: deleteWishlist, isPending: isDeleting } = useMutation({
    mutationFn: () => wishlistsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlists });
      queryClient.invalidateQueries({ queryKey: queryKeys.topMoversBase });
      router.replace('/watchlist');
    },
  });

  function invalidateItems() {
    queryClient.invalidateQueries({ queryKey: queryKeys.wishlistItems(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.wishlist(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.wishlists });
    queryClient.invalidateQueries({ queryKey: queryKeys.topMoversBase });
  }

  const totalPages = items ? Math.ceil(items.meta.total / 20) : 0;

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-cv-neutral">
        <Link href="/watchlist" className="transition-colors hover:text-white">Wishlists</Link>
        <span>/</span>
        <span className="font-medium text-white">{wishlist?.name ?? '…'}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <IconStar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-2xl font-bold text-white">{wishlist?.name ?? '…'}</h1>
            {wishlist?.description && (
              <p className="text-sm text-cv-neutral">{wishlist.description}</p>
            )}
          </div>
          {wishlist && (
            <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-cv-neutral">
              <span>{wishlist.total_items} item{wishlist.total_items !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {wishlist.visibility === 'public'
                  ? <><IconGlobe className="h-3 w-3" /> Public</>
                  : <><IconLock className="h-3 w-3" /> Private</>
                }
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {wishlist && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-dark sm:px-3"
            >
              <IconPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add card</span>
            </button>
            <button
              onClick={() => setShowDelete(true)}
              title="Delete wishlist"
              className="flex items-center gap-1.5 rounded-lg border border-red-900/50 px-2.5 py-1.5 text-sm text-red-400 transition hover:bg-red-950/40 sm:px-3"
            >
              <IconTrash className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin text-primary" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load items.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {!items?.items.length ? (
            <div className="py-16 text-center">
              <IconStar className="mx-auto mb-3 h-10 w-10 text-cv-border" />
              <p className="text-sm font-medium text-white">No cards yet</p>
              <p className="mt-1 text-xs text-cv-neutral">Click &ldquo;Add card&rdquo; to start building your wishlist.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.items.map(item => (
                <WishlistItemRow
                  key={item.id}
                  item={item}
                  wishlistId={id}
                  onMutate={invalidateItems}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination current={page} total={totalPages} onChange={setPage} />
          )}
        </>
      )}

      {showAddCard && (
        <AddCardModal
          wishlistId={id}
          onClose={() => setShowAddCard(false)}
          onAdd={invalidateItems}
        />
      )}

      {showDelete && wishlist && (
        <ConfirmDeleteModal
          name={wishlist.name}
          isPending={isDeleting}
          onConfirm={() => deleteWishlist()}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

// ─── Wishlist item row ────────────────────────────────────────────────────────

function WishlistItemRow({
  item,
  wishlistId,
  onMutate,
}: {
  item: WishlistItem;
  wishlistId: string;
  onMutate: () => void;
}) {
  const router = useRouter();

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (body: { quantity?: number; condition?: string | null; foil?: boolean | null }) =>
      wishlistsApi.updateItem(wishlistId, item.id, body),
    onSuccess: onMutate,
  });

  const { mutate: remove, isPending: isRemoving } = useMutation({
    mutationFn: () => wishlistsApi.removeItem(wishlistId, item.id),
    onSuccess: onMutate,
  });

  const owned = item.collection_presence.length > 0;

  return (
    <div className={[
      'flex items-center gap-3 rounded-xl border bg-cv-surface px-3 py-3 transition',
      owned ? 'border-secondary/30' : 'border-cv-border hover:border-primary/30 hover:bg-cv-overlay',
    ].join(' ')}>
      {/* Thumbnail */}
      <button
        onClick={() => router.push(`/cards/${item.card_id}`)}
        className="shrink-0"
        tabIndex={-1}
      >
        {item.image_uri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_uri}
            alt={item.card_name}
            className="h-14 w-10 rounded-[5%] object-cover"
          />
        ) : (
          <div className="flex h-14 w-10 items-center justify-center rounded-lg bg-cv-deep text-[9px] text-cv-neutral">
            —
          </div>
        )}
      </button>

      {/* Card info */}
      <div className="min-w-0 flex-1">
        <button
          onClick={() => router.push(`/cards/${item.card_id}`)}
          className="block truncate text-left text-sm font-medium text-white hover:text-primary-light"
        >
          {item.card_name}
        </button>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-cv-neutral">
          <span className="uppercase">{item.set_code}</span>
          <span>·</span>
          <span>#{item.collector_number.padStart(3, '0')}</span>
          <span>·</span>
          <span className={['capitalize font-medium', RARITY_COLORS[item.rarity] ?? 'text-cv-neutral'].join(' ')}>
            {item.rarity}
          </span>
          {item.price_eur && (
            <>
              <span>·</span>
              <span className="text-white">€{parseFloat(item.price_eur).toFixed(2)}</span>
            </>
          )}
        </div>

        {/* Collection presence */}
        {owned && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.collection_presence.map((p: CollectionPresence) => (
              <Link
                key={p.collection_id}
                href={`/collections/${p.collection_id}`}
                className="flex items-center gap-1 rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] text-secondary hover:bg-secondary/20"
              >
                <IconCheck className="h-2.5 w-2.5" />
                {p.collection_name}
                {p.quantity_owned > 1 && <span className="ml-0.5 opacity-70">×{p.quantity_owned}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Condition */}
        <select
          value={item.condition ?? ''}
          onChange={e => update({ condition: e.target.value || null })}
          disabled={isUpdating}
          title="Preferred condition"
          className="min-w-0 rounded border border-cv-border bg-cv-surface py-0.5 pl-1 pr-0.5 text-[10px] text-white focus:border-primary/60 focus:outline-none disabled:opacity-60"
        >
          <option value="">Any</option>
          {CONDITION_LIST.map(c => (
            <option key={c} value={c}>{CONDITIONS[c].shortLabel}</option>
          ))}
        </select>

        {/* Foil toggle */}
        <button
          onClick={() => update({ foil: item.foil ? null : true })}
          disabled={isUpdating}
          title={item.foil ? 'Foil preferred' : 'Any finish'}
          className={[
            'rounded border px-1.5 py-0.5 text-[10px] font-medium transition',
            item.foil
              ? 'border-primary/50 bg-primary/10 text-primary-light'
              : 'border-cv-border text-cv-neutral hover:border-white/20 hover:text-white',
          ].join(' ')}
        >
          ✦
        </button>

        {/* Quantity stepper */}
        <div className="flex items-center overflow-hidden rounded border border-cv-border">
          <button
            onClick={() => update({ quantity: Math.max(1, item.quantity - 1) })}
            disabled={isUpdating || item.quantity <= 1}
            className="flex h-5 w-5 items-center justify-center border-r border-cv-border text-cv-neutral transition hover:bg-cv-overlay hover:text-white disabled:opacity-30"
          >
            <span className="text-sm leading-none">−</span>
          </button>
          <span className="min-w-[1.5rem] px-0.5 text-center text-[11px] font-medium text-white">
            {item.quantity}
          </span>
          <button
            onClick={() => update({ quantity: item.quantity + 1 })}
            disabled={isUpdating}
            className="flex h-5 w-5 items-center justify-center border-l border-cv-border text-cv-neutral transition hover:bg-cv-overlay hover:text-white disabled:opacity-30"
          >
            <span className="text-sm leading-none">+</span>
          </button>
        </div>

        {/* Remove */}
        <button
          onClick={() => remove()}
          disabled={isRemoving}
          title="Remove from wishlist"
          className="shrink-0 rounded p-0.5 text-red-500 transition hover:bg-red-950/30 disabled:opacity-50"
        >
          {isRemoving
            ? <IconSpinner className="h-3.5 w-3.5 animate-spin" />
            : <IconTrash className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </div>
  );
}

// ─── Add card modal ───────────────────────────────────────────────────────────

type AddStep = 'search' | 'configure';

function AddCardModal({
  wishlistId,
  onClose,
  onAdd,
}: {
  wishlistId: string;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [step, setStep] = useState<AddStep>('search');
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<string>('');
  const [foil, setFoil] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: searchResults, isFetching } = useQuery({
    queryKey: queryKeys.cards({ q: submitted, page: 1, page_size: 12 }),
    queryFn: () => cardsApi.search({ q: submitted, page: 1, page_size: 12 }),
    enabled: submitted.length >= 2,
  });

  const { mutate: addItem, isPending: isAdding } = useMutation({
    mutationFn: () =>
      wishlistsApi.addItem(wishlistId, {
        card_id: selectedCard!.id,
        quantity,
        condition: condition || null,
        foil: foil,
      }),
    onSuccess: () => {
      onAdd();
      onClose();
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to add card.'),
  });

  function selectCard(card: Card) {
    setSelectedCard(card);
    setQuantity(1);
    setCondition('');
    setFoil(null);
    setErrorMsg('');
    setStep('configure');
  }

  const inputCls =
    'block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2 text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-2xl border border-cv-border bg-cv-raised shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cv-border px-6 py-4">
          {step === 'configure' && (
            <button
              onClick={() => setStep('search')}
              className="mr-3 rounded-lg p-1 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
          )}
          <h2 className="flex-1 text-base font-semibold text-white">
            {step === 'search' ? 'Add card to wishlist' : 'Configure card'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* ── Search step ── */}
        {step === 'search' && (
          <div className="flex flex-col gap-4 p-6">
            <form
              onSubmit={e => { e.preventDefault(); setSubmitted(q.trim()); }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search cards…"
                className={inputCls + ' flex-1'}
              />
              <button
                type="submit"
                disabled={q.trim().length < 2}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
              >
                Search
              </button>
            </form>

            {isFetching && (
              <div className="flex items-center justify-center py-8 text-sm text-cv-neutral">
                <IconSpinner className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {!isFetching && submitted && !searchResults?.items.length && (
              <p className="py-6 text-center text-sm text-cv-neutral">No cards found.</p>
            )}

            {!isFetching && (searchResults?.items.length ?? 0) > 0 && (
              <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto">
                {searchResults!.items.map(card => (
                  <button
                    key={card.id}
                    onClick={() => selectCard(card)}
                    className="group flex flex-col gap-1 rounded-lg border border-cv-border bg-cv-surface p-1.5 text-left transition hover:border-primary/40 hover:bg-cv-overlay"
                  >
                    {card.image_uri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.image_uri}
                        alt={card.name}
                        className="w-full rounded-[5%]"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center rounded bg-cv-deep text-[9px] text-cv-neutral">
                        No image
                      </div>
                    )}
                    <p className="truncate text-[11px] font-medium text-white group-hover:text-primary-light">
                      {card.name}
                    </p>
                    <p className="truncate text-[10px] uppercase text-cv-neutral">
                      {card.set_code}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Configure step ── */}
        {step === 'configure' && selectedCard && (
          <div className="flex flex-col gap-5 p-6">
            {/* Card preview */}
            <div className="flex items-center gap-4">
              {selectedCard.image_uri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedCard.image_uri}
                  alt={selectedCard.name}
                  className="h-20 w-14 rounded-[5%] object-cover"
                />
              ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded-lg bg-cv-deep text-xs text-cv-neutral">—</div>
              )}
              <div>
                <p className="font-medium text-white">{selectedCard.name}</p>
                <p className="mt-0.5 text-xs uppercase text-cv-neutral">
                  {selectedCard.set_name} · #{selectedCard.collector_number}
                </p>
                <p className={['mt-0.5 text-xs capitalize font-medium', RARITY_COLORS[selectedCard.rarity] ?? 'text-cv-neutral'].join(' ')}>
                  {selectedCard.rarity}
                </p>
              </div>
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                  Quantity
                </label>
                <div className="flex items-center overflow-hidden rounded-lg border border-cv-border">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center border-r border-cv-border text-cv-neutral transition hover:bg-cv-overlay hover:text-white disabled:opacity-30"
                  >
                    <span className="text-lg leading-none">−</span>
                  </button>
                  <span className="flex-1 text-center text-sm font-medium text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="flex h-9 w-9 items-center justify-center border-l border-cv-border text-cv-neutral transition hover:bg-cv-overlay hover:text-white"
                  >
                    <span className="text-lg leading-none">+</span>
                  </button>
                </div>
              </div>

              {/* Foil */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                  Finish
                </label>
                <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
                  {([
                    { label: 'Any', value: null },
                    { label: '✦ Foil', value: true },
                  ] as { label: string; value: boolean | null }[]).map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setFoil(opt.value)}
                      className={[
                        'flex flex-1 items-center justify-center rounded px-2 py-1.5 text-xs font-medium transition-colors',
                        foil === opt.value ? 'bg-primary text-white' : 'text-cv-neutral hover:text-white',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                Preferred condition
              </label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2 text-sm text-white focus:border-primary/60 focus:outline-none"
              >
                <option value="">Any condition</option>
                {CONDITION_LIST.map(c => (
                  <option key={c} value={c}>{CONDITIONS[c].label}</option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => addItem()}
                disabled={isAdding}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {isAdding && <IconSpinner className="h-4 w-4 animate-spin" />}
                Add to wishlist
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
      </div>
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  name, isPending, onConfirm, onClose,
}: {
  name: string;
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
        <h2 className="mb-2 text-base font-semibold text-white">Delete wishlist</h2>
        <p className="mb-5 text-sm text-cv-neutral">
          Are you sure you want to delete &ldquo;{name}&rdquo;? All items will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
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
