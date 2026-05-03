'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import type { ListCollectionCardsParams } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import { IconChevronLeft, IconChevronRight, IconFolder, IconSpinner } from '@/components/icons';
import {
  CardFilterPanel,
  EMPTY_PANEL,
  type PanelFilters,
} from '@/components/CardFilterPanel';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_FIELDS = [
  { value: 'name',             label: 'Name' },
  { value: 'collector_number', label: 'Collector #' },
  { value: 'rarity',           label: 'Rarity' },
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

const CONDITION_SHORT: Record<string, string> = {
  mint:               'M',
  near_mint:          'NM',
  lightly_played:     'LP',
  moderately_played:  'MP',
  heavily_played:     'HP',
  damaged:            'D',
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
  const [filters, setFilters] = useState<PanelFilters>(EMPTY_PANEL);
  const [submitted, setSubmitted] = useState<ListCollectionCardsParams>({ sort_by: 'name', sort_order: 'asc', page: 1, page_size: 20 });

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
      ...(filters.q              && { q:                filters.q }),
      ...(filters.set_code       && { set_code:         filters.set_code }),
      ...(filters.collector_number && { collector_number: filters.collector_number }),
      ...(filters.card_type      && { card_type:        filters.card_type }),
      ...(filters.mana_cost      && { mana_cost:        filters.mana_cost }),
      ...(filters.power          && { power:            filters.power }),
      ...(filters.toughness      && { toughness:        filters.toughness }),
      sort_by:    filters.sort_by as NonNullable<ListCollectionCardsParams['sort_by']>,
      sort_order: filters.sort_order,
      page,
      page_size: 20,
    };
    setSubmitted(params);
  }

  function handleReset() {
    setFilters(EMPTY_PANEL);
    setSubmitted({ sort_by: 'name', sort_order: 'asc', page: 1, page_size: 20 });
  }

  const extraFilterCount =
    [filters.card_type, filters.mana_cost, filters.power, filters.toughness]
      .filter(Boolean).length;

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
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">{collection?.name ?? '…'}</h1>
          {collection?.description && (
            <p className="mt-1 text-sm text-cv-neutral">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <CardFilterPanel
        filters={filters}
        extraFilterCount={extraFilterCount}
        onChange={(key, value) => setFilters(f => ({ ...f, [key]: value }))}
        onSearch={handleSearch}
        onReset={handleReset}
        sortOptions={SORT_FIELDS}
        showRarity={false}
        showNumericOps={false}
        showColors={false}
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
                <button
                  key={card.id}
                  onClick={() => router.push(`/cards/${card.card_id}`)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-cv-border bg-cv-surface text-left transition hover:border-primary/40 hover:bg-cv-overlay"
                >
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
                    {card.price_eur != null && (
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
