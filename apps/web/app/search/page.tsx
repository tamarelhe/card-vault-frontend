'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import type { CardSearchParams } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { cardsApi } from '@/lib/api-instance';
import {
  IconChevronDown, IconChevronLeft, IconChevronRight,
  IconFilter, IconSearch, IconSpinner,
} from '@/components/icons';

// ─── Constants ───────────────────────────────────────────────────────────────

const RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus'];

const SORT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'collector_number', label: 'Collector #' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'cmc', label: 'Mana Cost' },
];

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
];

const MTG_TYPES = [
  // Card types
  'Artifact', 'Battle', 'Conspiracy', 'Creature', 'Dungeon', 'Emblem',
  'Enchantment', 'Instant', 'Land', 'Phenomenon', 'Plane', 'Planeswalker',
  'Scheme', 'Sorcery', 'Tribal', 'Vanguard',
  // Supertypes
  'Basic', 'Legendary', 'Snow', 'World', 'Ongoing',
  // Creature subtypes
  'Angel', 'Archer', 'Artificer', 'Assassin', 'Bear', 'Beast', 'Bird',
  'Cleric', 'Construct', 'Demon', 'Devil', 'Dragon', 'Drake', 'Druid',
  'Dwarf', 'Elf', 'Faerie', 'Fungus', 'Giant', 'Gnome', 'Goblin', 'Golem',
  'Horror', 'Human', 'Hydra', 'Illusion', 'Insect', 'Knight', 'Merfolk',
  'Monk', 'Nightmare', 'Ninja', 'Noble', 'Ogre', 'Orc', 'Phoenix',
  'Pirate', 'Plant', 'Rogue', 'Salamander', 'Samurai', 'Scout', 'Shaman',
  'Skeleton', 'Sliver', 'Soldier', 'Sphinx', 'Spirit', 'Treefolk',
  'Unicorn', 'Vampire', 'Vedalken', 'Warrior', 'Witch', 'Wizard', 'Wolf',
  'Wurm', 'Zombie',
  // Land subtypes
  'Cave', 'Desert', 'Forest', 'Gate', 'Island', 'Mountain', 'Plains', 'Swamp',
  // Artifact subtypes
  'Clue', 'Equipment', 'Food', 'Gold', 'Treasure', 'Vehicle',
  // Enchantment subtypes
  'Aura', 'Background', 'Curse', 'Role', 'Rune', 'Saga', 'Shard', 'Shrine',
  // Spell subtypes
  'Adventure', 'Lesson', 'Trap',
];

const MTG_COLORS = [
  { code: 'W', label: 'White' },
  { code: 'U', label: 'Blue' },
  { code: 'B', label: 'Black' },
  { code: 'R', label: 'Red' },
  { code: 'G', label: 'Green' },
  { code: 'C', label: 'Colorless' },
];

const COLOR_MODES = [
  { value: 'including', label: 'Including these' },
  { value: 'exact', label: 'Exact these' },
  { value: 'atmost', label: 'At most these' },
  { value: 'commander', label: 'Commander Colors' },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-secondary',
  rare: 'text-yellow-400',
  mythic: 'text-tertiary-light',
  special: 'text-primary-light',
  bonus: 'text-pink-400',
};

const EMPTY: CardSearchParams = {
  q: '', set_code: '', collector_number: '',
  card_type: '', rarity: '',
  mana_cost: '', mana_cost_op: 'eq',
  power: '', power_op: 'eq',
  toughness: '', toughness_op: 'eq',
  sort_by: 'name', sort_order: 'asc',
  page: 1, page_size: 20,
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

function paramsToFilters(p: URLSearchParams): CardSearchParams {
  const colors = p.getAll('colors');
  return {
    q: p.get('q') ?? '',
    set_code: p.get('set_code') ?? '',
    collector_number: p.get('collector_number') ?? '',
    card_type: p.get('card_type') ?? '',
    rarity: p.get('rarity') ?? '',
    mana_cost: p.get('mana_cost') ?? '',
    mana_cost_op: (p.get('mana_cost_op') ?? 'eq') as NonNullable<CardSearchParams['mana_cost_op']>,
    power: p.get('power') ?? '',
    power_op: (p.get('power_op') ?? 'eq') as NonNullable<CardSearchParams['power_op']>,
    toughness: p.get('toughness') ?? '',
    toughness_op: (p.get('toughness_op') ?? 'eq') as NonNullable<CardSearchParams['toughness_op']>,
    sort_by: (p.get('sort_by') ?? 'name') as NonNullable<CardSearchParams['sort_by']>,
    sort_order: (p.get('sort_order') ?? 'asc') as 'asc' | 'desc',
    page: parseInt(p.get('page') ?? '1', 10),
    page_size: parseInt(p.get('page_size') ?? '20', 10),
    ...(colors.length > 0 && {
      colors,
      color_match: (p.get('color_match') ?? 'exact') as NonNullable<CardSearchParams['color_match']>,
    }),
  };
}

function filtersToUrl(params: CardSearchParams): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === null) continue;
    if (Array.isArray(v)) {
      v.forEach(item => p.append(k, String(item)));
    } else {
      p.set(k, String(v));
    }
  }
  return `/search?${p.toString()}`;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<CardSearchParams>(() =>
    searchParams.size > 0 ? paramsToFilters(new URLSearchParams(searchParams.toString())) : EMPTY
  );
  const [submitted, setSubmitted] = useState<CardSearchParams | null>(() =>
    searchParams.size > 0 ? paramsToFilters(new URLSearchParams(searchParams.toString())) : null
  );
  const [expanded, setExpanded] = useState(false);
  const [colorFilter, setColorFilter] = useState(() => ({
    colors: searchParams.getAll('colors'),
    mode: searchParams.get('color_match') ?? 'including',
  }));

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.cards(submitted ?? {}),
    queryFn: () => cardsApi.search(submitted!),
    enabled: submitted !== null,
  });

  function set<K extends keyof CardSearchParams>(key: K, value: CardSearchParams[K]) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  function handleSearch(page = 1) {
    const params: CardSearchParams = {
      ...filters,
      page,
      ...(colorFilter.colors.length > 0 && {
        colors: colorFilter.colors,
        color_match: colorFilter.mode as NonNullable<CardSearchParams['color_match']>,
      }),
    };
    setSubmitted(params);
    router.replace(filtersToUrl(params), { scroll: false });
  }

  function handleReset() {
    setFilters(EMPTY);
    setSubmitted(null);
    setColorFilter({ colors: [], mode: 'including' });
    router.replace('/search', { scroll: false });
  }

  function toggleColor(code: string) {
    setColorFilter(f => ({
      ...f,
      colors: f.colors.includes(code)
        ? f.colors.filter(c => c !== code)
        : [...f.colors, code],
    }));
  }

  const hasExtraFilters =
    !!(filters.card_type || filters.rarity || filters.mana_cost ||
      filters.power || filters.toughness || colorFilter.colors.length > 0);

  const totalPages = data ? Math.ceil(data.meta.total / (submitted?.page_size ?? 20)) : 0;
  const currentPage = submitted?.page ?? 1;

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Filter panel */}
      <div className="rounded-xl border border-cv-border bg-cv-raised">

        {/* ── Row 1: base filters (always visible) ── */}
        <div className="flex flex-wrap items-end gap-3 p-3">

          {/* Card Name */}
          <FilterField label="Card Name / Text" className="min-w-44 flex-1">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cv-neutral" />
              <input
                type="text"
                placeholder="e.g. Black Lotus"
                value={filters.q}
                onChange={e => set('q', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className={inputCls + ' pl-8'}
              />
            </div>
          </FilterField>

          {/* Set Code */}
          <FilterField label="Set Code" className="w-28">
            <input
              type="text"
              placeholder="All Sets"
              value={filters.set_code}
              onChange={e => set('set_code', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={inputCls}
            />
          </FilterField>

          {/* Collector # */}
          <FilterField label="Coll #" className="w-24">
            <input
              type="text"
              placeholder="001"
              value={filters.collector_number}
              onChange={e => set('collector_number', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={inputCls}
            />
          </FilterField>

          {/* Action buttons */}
          <div className="flex items-end gap-1.5">
            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(x => !x)}
              className={[
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                expanded || hasExtraFilters
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-cv-border text-cv-neutral hover:border-white/20 hover:text-white',
              ].join(' ')}
            >
              <IconFilter className="h-3.5 w-3.5" />
              {hasExtraFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                  {[filters.card_type, filters.rarity, filters.mana_cost, filters.power, filters.toughness].filter(Boolean).length + (colorFilter.colors.length > 0 ? 1 : 0)}
                </span>
              )}
              <IconChevronDown
                className={['h-3.5 w-3.5 transition-transform', expanded ? 'rotate-180' : ''].join(' ')}
              />
            </button>

            <button
              onClick={handleReset}
              className="rounded-lg border border-cv-border px-3 py-1.5 text-xs font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
            >
              Clear all
            </button>

            <button
              onClick={() => handleSearch()}
              className="rounded-lg border border-transparent bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Apply
            </button>
          </div>
        </div>

        {/* ── Row 2: extra filters (collapsible) ── */}
        {expanded && (
          <div className="flex flex-wrap items-end gap-3 border-t border-cv-border px-3 pb-3 pt-2.5">

            {/* Type — autocomplete */}
            <FilterField label="Type" className="w-44">
              <TypeCombobox
                value={filters.card_type ?? ''}
                onChange={v => set('card_type', v)}
              />
            </FilterField>

            {/* Rarity */}
            <FilterField label="Rarity" className="w-32">
              <select
                value={filters.rarity}
                onChange={e => set('rarity', e.target.value)}
                className={selectCls}
              >
                <option value="">Any</option>
                {RARITIES.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </FilterField>

            {/* CMC */}
            <NumericFilter
              label="CMC"
              value={filters.mana_cost ?? ''}
              op={filters.mana_cost_op ?? 'eq'}
              onValue={v => set('mana_cost', v)}
              onOp={v => set('mana_cost_op', v as CardSearchParams['mana_cost_op'])}
            />

            {/* Power */}
            <NumericFilter
              label="Power"
              value={filters.power ?? ''}
              op={filters.power_op ?? 'eq'}
              onValue={v => set('power', v)}
              onOp={v => set('power_op', v as CardSearchParams['power_op'])}
            />

            {/* Toughness */}
            <NumericFilter
              label="Toughness"
              value={filters.toughness ?? ''}
              op={filters.toughness_op ?? 'eq'}
              onValue={v => set('toughness', v)}
              onOp={v => set('toughness_op', v as CardSearchParams['toughness_op'])}
            />

            {/* Sort by */}
            <FilterField label="Sort by" className="w-36">
              <select
                value={filters.sort_by}
                onChange={e => set('sort_by', e.target.value as CardSearchParams['sort_by'])}
                className={selectCls}
              >
                {SORT_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </FilterField>

            {/* Order */}
            <FilterField label="Order" className="w-28">
              <select
                value={filters.sort_order}
                onChange={e => set('sort_order', e.target.value as 'asc' | 'desc')}
                className={selectCls}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </FilterField>

            {/* Colors */}
            <ColorFilter
              selected={colorFilter.colors}
              mode={colorFilter.mode}
              onToggle={toggleColor}
              onMode={mode => setColorFilter(f => ({ ...f, mode }))}
            />
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Searching…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load results.
        </div>
      )}

      {/* Results */}
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
                  onClick={() => router.push(`/cards/${card.id}`)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-cv-border bg-cv-surface text-left transition hover:border-primary/40 hover:bg-cv-overlay"
                >
                  <div className="px-1 pt-1">
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl">
                      {card.image_uri ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.image_uri}
                          alt={card.name}
                          className="h-full w-full object-contain rounded-[5%] transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-cv-neutral">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 pt-2">
                    <p className="truncate text-sm font-semibold text-white">{card.name}</p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-[11px] uppercase tracking-wide text-cv-neutral">
                        {card.set_code} · #{card.collector_number}
                      </p>
                      <p className={['shrink-0 text-[11px] capitalize font-medium', RARITY_COLORS[card.rarity] ?? 'text-cv-neutral'].join(' ')}>
                        {card.rarity}
                      </p>
                    </div>
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

// ─── TypeCombobox ─────────────────────────────────────────────────────────────

function TypeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = value.trim().length === 0
    ? []
    : MTG_TYPES.filter(t => t.toLowerCase().startsWith(value.toLowerCase())).slice(0, 8);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="Any Type"
        value={value}
        autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => value.trim() && setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter') setOpen(false);
        }}
        className={inputCls}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-cv-border bg-cv-overlay shadow-xl">
          {suggestions.map(type => (
            <li key={type}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); onChange(type); setOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-sm text-white hover:bg-primary/20 hover:text-primary-light"
              >
                {type}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── ColorFilter ──────────────────────────────────────────────────────────────

function ColorFilter({
  selected, mode, onToggle, onMode,
}: {
  selected: string[];
  mode: string;
  onToggle: (code: string) => void;
  onMode: (mode: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">Colors</label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {MTG_COLORS.map(({ code, label }) => {
            const active = selected.includes(code);
            return (
              <button
                key={code}
                type="button"
                title={label}
                onClick={() => onToggle(code)}
                className={[
                  'h-7 w-7 overflow-hidden rounded-full transition-all duration-150',
                  active
                    ? 'opacity-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.35)]'
                    : 'opacity-25 hover:opacity-55',
                ].join(' ')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://svgs.scryfall.io/card-symbols/${code}.svg`}
                  alt={label}
                  className="h-full w-full"
                />
              </button>
            );
          })}
        </div>
        <select
          value={mode}
          onChange={e => onMode(e.target.value)}
          className={selectCls + ' w-40'}
        >
          {COLOR_MODES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── FilterField ──────────────────────────────────────────────────────────────

function FilterField({
  label, children, className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">{label}</label>
      {children}
    </div>
  );
}

// ─── NumericFilter ────────────────────────────────────────────────────────────
// Uses explicit pixel widths (no flex-1) so the number input is never clipped.

function NumericFilter({
  label, value, op, onValue, onOp,
}: {
  label: string;
  value: string;
  op: string;
  onValue: (v: string) => void;
  onOp: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wide text-cv-neutral">{label}</label>
      <div className="flex">
        {/* Operator — joined left border */}
        <select
          value={op}
          onChange={e => onOp(e.target.value)}
          className="w-12 flex-shrink-0 rounded-l-lg rounded-r-none border border-cv-border bg-cv-surface px-1 py-[3px] text-xs text-white focus:z-10 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* Value — joined right border, explicit width */}
        <input
          type="number"
          placeholder="0"
          value={value}
          onChange={e => onValue(e.target.value)}
          className="w-16 rounded-l-none rounded-r-lg border border-l-0 border-cv-border bg-cv-surface px-2 py-[3px] text-xs text-white placeholder:text-cv-neutral focus:z-10 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
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
          <PageBtn key={p} active={p === current} onClick={() => onChange(p as number)}>
            {p}
          </PageBtn>
        )
      )}

      <PageBtn disabled={current >= total} onClick={() => onChange(current + 1)} aria-label="Next">
        <IconChevronRight className="h-4 w-4" />
      </PageBtn>
    </div>
  );
}

function PageBtn({
  children, onClick, disabled, active, 'aria-label': ariaLabel,
}: {
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
        active
          ? 'bg-primary text-white'
          : 'border border-cv-border text-cv-neutral hover:border-white/20 hover:text-white',
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
