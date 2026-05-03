'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import type { CardSearchParams } from '@cardvault/api';
import { formatPrice } from '@cardvault/core';
import { AppShell } from '@/components/AppShell';
import { cardsApi } from '@/lib/api-instance';
import { IconChevronLeft, IconChevronRight, IconSpinner } from '@/components/icons';
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
];

const RARITY_COLORS: Record<string, string> = {
  common:   'text-slate-400',
  uncommon: 'text-secondary',
  rare:     'text-yellow-400',
  mythic:   'text-tertiary-light',
  special:  'text-primary-light',
  bonus:    'text-pink-400',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense>
        <SearchContent />
      </Suspense>
    </AppShell>
  );
}

// ─── URL ↔ state helpers ──────────────────────────────────────────────────────

function paramsToPanel(p: URLSearchParams): PanelFilters {
  return {
    q:             p.get('q') ?? '',
    set_code:      p.get('set_code') ?? '',
    collector_number: p.get('collector_number') ?? '',
    card_type:     p.get('card_type') ?? '',
    rarity:        p.get('rarity') ?? '',
    mana_cost:     p.get('mana_cost') ?? '',
    mana_cost_op:  (p.get('mana_cost_op') ?? 'eq') as PanelFilters['mana_cost_op'],
    power:         p.get('power') ?? '',
    power_op:      (p.get('power_op') ?? 'eq') as PanelFilters['power_op'],
    toughness:     p.get('toughness') ?? '',
    toughness_op:  (p.get('toughness_op') ?? 'eq') as PanelFilters['toughness_op'],
    sort_by:       p.get('sort_by') ?? 'name',
    sort_order:    (p.get('sort_order') ?? 'asc') as 'asc' | 'desc',
  };
}

function buildCardSearchParams(
  panel: PanelFilters,
  colorFilter: ColorFilterState,
  page: number,
): CardSearchParams {
  return {
    ...panel,
    sort_by: panel.sort_by as CardSearchParams['sort_by'],
    page,
    page_size: 20,
    ...(colorFilter.colors.length > 0 && {
      colors: colorFilter.colors,
      color_match: colorFilter.mode as NonNullable<CardSearchParams['color_match']>,
    }),
  };
}

function filtersToUrl(params: CardSearchParams): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === null) continue;
    if (Array.isArray(v)) v.forEach(item => p.append(k, String(item)));
    else p.set(k, String(v));
  }
  return `/search?${p.toString()}`;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<PanelFilters>(() =>
    searchParams.size > 0 ? paramsToPanel(new URLSearchParams(searchParams.toString())) : EMPTY_PANEL
  );
  const [submitted, setSubmitted] = useState<CardSearchParams | null>(() =>
    searchParams.size > 0
      ? buildCardSearchParams(
          paramsToPanel(new URLSearchParams(searchParams.toString())),
          {
            colors: searchParams.getAll('colors'),
            mode: searchParams.get('color_match') ?? 'including',
          },
          parseInt(searchParams.get('page') ?? '1', 10),
        )
      : null
  );
  const [colorFilter, setColorFilter] = useState<ColorFilterState>(() => ({
    colors: searchParams.getAll('colors'),
    mode: searchParams.get('color_match') ?? 'including',
  }));

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.cards(submitted ?? {}),
    queryFn: () => cardsApi.search(submitted!),
    enabled: submitted !== null,
  });

  useEffect(() => {
    if (!data) return;
    const saved = sessionStorage.getItem('search-scroll');
    if (!saved) return;
    requestAnimationFrame(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = parseInt(saved, 10);
      sessionStorage.removeItem('search-scroll');
    });
  }, [data]);

  function handleSearch(page = 1) {
    const params = buildCardSearchParams(filters, colorFilter, page);
    setSubmitted(params);
    router.replace(filtersToUrl(params), { scroll: false });
  }

  function handleReset() {
    setFilters(EMPTY_PANEL);
    setSubmitted(null);
    setColorFilter(EMPTY_COLOR_FILTER);
    router.replace('/search', { scroll: false });
  }

  function toggleColor(code: string) {
    setColorFilter(f => ({
      ...f,
      colors: f.colors.includes(code) ? f.colors.filter(c => c !== code) : [...f.colors, code],
    }));
  }

  const extraFilterCount =
    [filters.card_type, filters.rarity, filters.mana_cost, filters.power, filters.toughness]
      .filter(Boolean).length +
    (colorFilter.colors.length > 0 ? 1 : 0);

  const totalPages = data ? Math.ceil(data.meta.total / 20) : 0;
  const currentPage = submitted?.page ?? 1;

  return (
    <div className="flex flex-col gap-5 p-6">
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
        <div className="flex items-center gap-2 py-16 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Searching…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load results.
        </div>
      )}

      {data && (
        <>
          <p className="text-sm text-cv-neutral">
            {data.meta.total} result{data.meta.total !== 1 ? 's' : ''}
          </p>

          {data.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-cv-neutral">No cards found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.items.map(card => (
                <button
                  key={card.id}
                  onClick={() => {
                    const main = document.querySelector('main');
                    if (main) sessionStorage.setItem('search-scroll', String(main.scrollTop));
                    router.push(`/cards/${card.id}`);
                  }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-cv-border bg-cv-surface text-left transition hover:border-primary/40 hover:bg-cv-overlay"
                >
                  <div className="px-1 pt-1">
                    {card.image_uri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.image_uri}
                        alt={card.name}
                        className="w-full rounded-[5%] transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-cv-deep text-xs text-cv-neutral">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="mt-auto flex flex-col gap-1 p-3 pt-2">
                    <p className="truncate text-sm font-semibold text-white">{card.name}</p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-[11px] uppercase tracking-wide text-cv-neutral">
                        {card.set_code} · #{card.collector_number.padStart(4, '0')}
                      </p>
                      <p className={['shrink-0 text-[11px] capitalize font-medium', RARITY_COLORS[card.rarity] ?? 'text-cv-neutral'].join(' ')}>
                        {card.rarity}
                      </p>
                    </div>
                    {(card.prices?.eur != null || card.prices?.eur_foil != null) && (
                      <div className="flex items-center gap-2 pt-0.5">
                        {card.prices.eur != null && (
                          <span className="text-[11px] font-medium text-white">
                            {formatPrice(card.prices.eur, 'EUR')}
                          </span>
                        )}
                        {card.prices.eur_foil != null && (
                          <span className="text-[11px] text-secondary">
                            {formatPrice(card.prices.eur_foil, 'EUR')} ✦
                          </span>
                        )}
                      </div>
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
