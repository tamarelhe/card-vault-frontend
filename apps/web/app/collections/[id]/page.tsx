'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import type { ListCollectionCardsParams } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import {
  IconChevronLeft, IconChevronRight, IconFolder,
  IconSearch, IconSpinner,
} from '@/components/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_FIELDS = [
  { value: 'name',             label: 'Name' },
  { value: 'collector_number', label: 'Collector #' },
  { value: 'rarity',           label: 'Rarity' },
  { value: 'condition',        label: 'Condition' },
  { value: 'quantity',         label: 'Quantity' },
  { value: 'added_at',         label: 'Date Added' },
  { value: 'price',            label: 'Price' },
] as const;

const RARITY_COLORS: Record<string, string> = {
  common:   'text-slate-400',
  uncommon: 'text-secondary',
  rare:     'text-yellow-400',
  mythic:   'text-tertiary-light',
  special:  'text-primary-light',
  bonus:    'text-pink-400',
};

const CONDITION_SHORT: Record<string, string> = {
  mint:               'M',
  near_mint:          'NM',
  lightly_played:     'LP',
  moderately_played:  'MP',
  heavily_played:     'HP',
  damaged:            'D',
};

const EMPTY_FILTERS: ListCollectionCardsParams = {
  q: '', set_code: '', sort_by: 'name', sort_order: 'asc', page: 1, page_size: 20,
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
  const router = useRouter();
  const [filters, setFilters] = useState<ListCollectionCardsParams>(EMPTY_FILTERS);
  const [submitted, setSubmitted] = useState<ListCollectionCardsParams>(EMPTY_FILTERS);

  const { data: collection } = useQuery({
    queryKey: queryKeys.collection(id),
    queryFn: () => collectionsApi.getById(id),
  });

  const { data: cards, isLoading, isError } = useQuery({
    queryKey: queryKeys.collectionItems(id, submitted as Record<string, unknown>),
    queryFn: () => collectionsApi.listCards(id, submitted),
  });

  function set<K extends keyof ListCollectionCardsParams>(key: K, value: ListCollectionCardsParams[K]) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  function handleSearch(page = 1) {
    setSubmitted({ ...filters, page });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setSubmitted(EMPTY_FILTERS);
  }

  const totalPages = cards ? Math.ceil(cards.meta.total / (submitted.page_size ?? 20)) : 0;
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
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">{collection?.name ?? '…'}</h1>
          {collection?.description && (
            <p className="mt-1 text-sm text-cv-neutral">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-cv-border bg-cv-raised p-3">
        {/* Card name */}
        <div className="flex min-w-44 flex-1 flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">Card name</label>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cv-neutral" />
            <input
              type="text"
              placeholder="Search…"
              value={filters.q ?? ''}
              onChange={e => set('q', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={inputCls + ' pl-8'}
            />
          </div>
        </div>

        {/* Set code */}
        <div className="flex w-28 flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">Set</label>
          <input
            type="text"
            placeholder="All sets"
            value={filters.set_code ?? ''}
            onChange={e => set('set_code', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className={inputCls}
          />
        </div>

        {/* Sort by */}
        <div className="flex w-36 flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">Sort by</label>
          <select
            value={filters.sort_by}
            onChange={e => set('sort_by', e.target.value as ListCollectionCardsParams['sort_by'])}
            className={selectCls}
          >
            {SORT_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {/* Sort order */}
        <div className="flex w-28 flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">Order</label>
          <select
            value={filters.sort_order}
            onChange={e => set('sort_order', e.target.value as 'asc' | 'desc')}
            className={selectCls}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-1.5">
          <button
            onClick={handleReset}
            className="rounded-lg border border-cv-border px-3 py-[3px] text-xs font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
          >
            Clear
          </button>
          <button
            onClick={() => handleSearch()}
            className="rounded-lg border border-transparent bg-primary px-4 py-[3px] text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin text-primary" />
          Loading…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load cards.
        </div>
      )}

      {/* Results */}
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
                <button
                  key={card.id}
                  onClick={() => router.push(`/cards/${card.card_id}`)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-cv-border bg-cv-surface text-left transition hover:border-primary/40 hover:bg-cv-overlay"
                >
                  {/* Image */}
                  <div className="px-1 pt-1">
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
                  </div>

                  {/* Info */}
                  <div className="mt-auto flex flex-col gap-1 p-3 pt-2">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm font-semibold text-white">{card.card_name}</p>
                      {card.foil && <span className="shrink-0 text-[10px] text-secondary">✦</span>}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-[11px] uppercase tracking-wide text-cv-neutral">
                        {card.set_code} · #{card.collector_number.padStart(4, '0')}
                      </p>
                      <p className={['shrink-0 text-[11px] capitalize font-medium', RARITY_COLORS[card.rarity] ?? 'text-cv-neutral'].join(' ')}>
                        {card.rarity}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-cv-neutral">
                        {CONDITION_SHORT[card.condition] ?? card.condition}
                      </span>
                      <span className="text-[11px] font-medium text-white">×{card.quantity}</span>
                    </div>

                    {(card.price_eur != null) && (
                      <p className="text-[11px] font-medium text-white">
                        €{parseFloat(card.price_eur).toFixed(2)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination current={currentPage} total={totalPages} onChange={handleSearch} />
          )}
        </>
      )}
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

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-cv-border bg-cv-surface px-2.5 py-[3px] text-sm text-white placeholder:text-cv-neutral focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30';

const selectCls =
  'w-full rounded-lg border border-cv-border bg-cv-surface px-2.5 py-[3px] text-sm text-white focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30';
