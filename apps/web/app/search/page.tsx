'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import type { CardSearchParams } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { cardsApi } from '@/lib/api-instance';
import { IconChevronDown, IconSearch, IconSpinner } from '@/components/icons';

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

const EMPTY: CardSearchParams = {
  q: '', set_code: '', collector_number: '',
  card_type: '', rarity: '',
  mana_cost: '', mana_cost_op: 'eq',
  power: '', power_op: 'eq',
  toughness: '', toughness_op: 'eq',
  sort_by: 'name', sort_order: 'asc',
  page: 1, page_size: 20,
};

export default function SearchPage() {
  return (
    <AppShell>
      <SearchContent />
    </AppShell>
  );
}

function SearchContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<CardSearchParams>(EMPTY);
  const [submitted, setSubmitted] = useState<CardSearchParams | null>(null);
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.cards(submitted ?? {}),
    queryFn: () => cardsApi.search(submitted!),
    enabled: submitted !== null,
  });

  function set<K extends keyof CardSearchParams>(key: K, value: CardSearchParams[K]) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  function handleSearch(page = 1) {
    setSubmitted({ ...filters, page });
  }

  function handleReset() {
    setFilters(EMPTY);
    setSubmitted(null);
  }

  const totalPages = data ? Math.ceil(data.meta.total / (submitted?.page_size ?? 20)) : 0;
  const currentPage = submitted?.page ?? 1;

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-slate-900">Search Cards</h1>

      {/* Filter panel */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Basic filters — always visible */}
        <div className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-48">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Name or oracle text…"
              value={filters.q}
              onChange={e => set('q', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <input
            type="text"
            placeholder="Set code (e.g. ltr)"
            value={filters.set_code}
            onChange={e => set('set_code', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Collector #"
            value={filters.collector_number}
            onChange={e => set('collector_number', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => setExpanded(x => !x)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Filters
            <IconChevronDown className={['h-4 w-4 transition-transform', expanded ? 'rotate-180' : ''].join(' ')} />
          </button>
          <button
            onClick={() => handleSearch()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
          {submitted && (
            <button onClick={handleReset} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Reset
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {expanded && (
          <div className="border-t border-slate-200 p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Card type</label>
                <input
                  type="text"
                  placeholder="e.g. Creature"
                  value={filters.card_type}
                  onChange={e => set('card_type', e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Rarity</label>
                <select
                  value={filters.rarity}
                  onChange={e => set('rarity', e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {RARITIES.map(r => (
                    <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              <NumericFilter label="CMC" value={filters.mana_cost ?? ''} op={filters.mana_cost_op ?? 'eq'}
                onValue={v => set('mana_cost', v)} onOp={v => set('mana_cost_op', v as CardSearchParams['mana_cost_op'])} />
              <NumericFilter label="Power" value={filters.power ?? ''} op={filters.power_op ?? 'eq'}
                onValue={v => set('power', v)} onOp={v => set('power_op', v as CardSearchParams['power_op'])} />
              <NumericFilter label="Toughness" value={filters.toughness ?? ''} op={filters.toughness_op ?? 'eq'}
                onValue={v => set('toughness', v)} onOp={v => set('toughness_op', v as CardSearchParams['toughness_op'])} />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Sort by</label>
                <select
                  value={filters.sort_by}
                  onChange={e => set('sort_by', e.target.value as CardSearchParams['sort_by'])}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SORT_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Order</label>
                <select
                  value={filters.sort_order}
                  onChange={e => set('sort_order', e.target.value as 'asc' | 'desc')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-slate-400">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Searching…
        </div>
      )}

      {isError && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700 ring-1 ring-red-200">
          Failed to load results.
        </div>
      )}

      {data && (
        <>
          <p className="text-sm text-slate-500">
            {data.meta.total} result{data.meta.total !== 1 ? 's' : ''}
          </p>

          {data.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No cards found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.items.map(card => (
                <button
                  key={card.id}
                  onClick={() => router.push(`/cards/${card.id}`)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md text-left"
                >
                  <div className="aspect-[2/3] w-full overflow-hidden bg-slate-100">
                    {card.image_uri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.image_uri} alt={card.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 p-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{card.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{card.set_code} · #{card.collector_number}</p>
                    <p className="mt-1 text-xs capitalize text-slate-400">{card.rarity}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => handleSearch(currentPage - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => handleSearch(currentPage + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="flex gap-1">
        <select
          value={op}
          onChange={e => onOp(e.target.value)}
          className="w-14 rounded-lg border border-slate-300 px-1 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="number"
          placeholder="0"
          value={value}
          onChange={e => onValue(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
