'use client';

import { use, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { queryKeys } from '@cardvault/api';
import { formatPrice } from '@cardvault/core';
import { AppShell } from '@/components/AppShell';
import { cardsApi, collectionsApi } from '@/lib/api-instance';
import { IconFolder, IconPlus, IconSpinner, IconX } from '@/components/icons';

// ─── Mana symbol helpers ──────────────────────────────────────────────────────

function symbolUrl(code: string) {
  return `https://svgs.scryfall.io/card-symbols/${code.replace('/', '').toUpperCase()}.svg`;
}

function ManaSymbol({ code }: { code: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={symbolUrl(code)} alt={`{${code}}`} className="inline-block h-4 w-4 align-middle" />
  );
}

function parseSymbols(text: string): React.ReactNode[] {
  return text.split(/(\{[^}]+\})/).map((part, i) => {
    const match = part.match(/^\{([^}]+)\}$/);
    return match ? <ManaSymbol key={i} code={match[1]!} /> : part;
  });
}

// ─── Price chart ─────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';
type Currency = 'eur' | 'usd';

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

function opacityColors(n: number, r: number, g: number, b: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const alpha = 0.15 + (i / Math.max(n - 1, 1)) * 0.85;
    return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}


function PriceChart({ id }: { id: string }) {
  const [period, setPeriod] = useState<Period>('30d');
  const [currency, setCurrency] = useState<Currency>('eur');
  const [foil, setFoil] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.priceHistory(id),
    queryFn: () => cardsApi.priceHistory(id),
  });

  const { data: variations } = useQuery({
    queryKey: queryKeys.priceVariations(id, currency),
    queryFn: () => cardsApi.priceVariations(id, currency),
    retry: false,
  });

  const data = useMemo(() => {
    if (!history) return [];
    const cutoff = Date.now() - PERIOD_DAYS[period] * 86_400_000;
    return (history.history ?? [])
      .filter(e => e.currency === currency && new Date(e.fetched_at).getTime() >= cutoff)
      .reverse()
      .map(e => {
        const raw = foil ? e.price_foil : e.price;
        const value = raw != null ? parseFloat(raw) : null;
        return { label: fmtDate(e.fetched_at), value: value != null && !isNaN(value) ? value : null };
      })
      .filter(e => e.value != null);
  }, [history, period, currency, foil]);

  const colors = useMemo(() => {
    const [r, g, b] = foil ? [16, 185, 129] : [255, 255, 255];
    return opacityColors(data.length, r, g, b);
  }, [data.length, foil]);

  const sym = currency === 'eur' ? '€' : '$';

  // Prefer pre-computed variation from API; fall back to computing from history data
  const apiVariation = variations?.variations.find(v => v.period === period);
  const apiPct = apiVariation ? parseFloat((foil ? apiVariation.delta_foil_pct : apiVariation.delta_pct) ?? '') : NaN;

  const historyDelta = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[0]?.value as number | undefined;
    const last = data[data.length - 1]?.value as number | undefined;
    if (first == null || last == null) return null;
    if (first === 0) return null;
    return ((last - first) / first) * 100;
  }, [data]);

  const pctValue = !isNaN(apiPct) ? apiPct : historyDelta;
  const deltaPct = pctValue != null ? `${pctValue >= 0 ? '+' : ''}${pctValue.toFixed(2)}%` : null;

  const direction = pctValue == null ? 'stable'
    : pctValue > 0.5 ? 'up'
    : pctValue < -0.5 ? 'down'
    : 'stable';
  const deltaColor = direction === 'down' ? 'text-secondary' : direction === 'up' ? 'text-red-400' : 'text-cv-neutral';

  return (
    <div className="rounded-xl border border-cv-border bg-cv-raised p-4">
      {/* Header: title + badge on left, toggles on right */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-cv-neutral">
            Price history
          </h2>
          {deltaPct && (
            <span className={`text-xs font-semibold ${deltaColor}`}>{deltaPct}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ToggleGroup
            options={['7d', '30d', '90d'] as Period[]}
            value={period}
            onChange={setPeriod}
            format={v => v}
          />
          <ToggleGroup
            options={['eur', 'usd'] as Currency[]}
            value={currency}
            onChange={setCurrency}
            format={v => v.toUpperCase()}
          />
          <ToggleGroup
            options={[false, true]}
            value={foil}
            onChange={setFoil}
            format={v => (v ? 'Foil' : 'Regular')}
          />
        </div>
      </div>

      <div className="mb-4 border-t border-cv-border/50" />

      {isLoading ? (
        <div className="flex h-36 items-center justify-center">
          <IconSpinner className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A3D" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#7A7580' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#7A7580' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${sym}${(v as number).toFixed(2)}`}
              width={46}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={(v) => [
                <span key="v" style={{ color: foil ? '#10B981' : '#ffffff' }}>
                  {typeof v === 'number' ? `${sym}${v.toFixed(2)}` : String(v)}
                </span>,
              ]}
              labelFormatter={label => String(label)}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #2A2A3D',
                background: '#1A1A28',
                color: '#e2e8f0',
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i] ?? colors[0] ?? '#8B5CF6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-36 items-center justify-center text-xs text-cv-neutral">
          No price data available
        </div>
      )}
    </div>
  );
}

// ─── Add to collection modal ──────────────────────────────────────────────────

const CONDITIONS = [
  { value: 'mint', label: 'Mint' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'lightly_played', label: 'Lightly Played' },
  { value: 'moderately_played', label: 'Moderately Played' },
  { value: 'heavily_played', label: 'Heavily Played' },
  { value: 'damaged', label: 'Damaged' },
] as const;

function AddToCollectionModal({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [collectionId, setCollectionId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [foil, setFoil] = useState(false);
  const [condition, setCondition] = useState<string>('near_mint');
  const [added, setAdded] = useState(false);

  const { data: collections } = useQuery({
    queryKey: queryKeys.collections,
    queryFn: () => collectionsApi.list({ page: 1, page_size: 100 }),
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => collectionsApi.addCard(collectionId, {
      card_id: cardId,
      quantity,
      foil,
      condition,
      language: 'en',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collection(collectionId) });
      setAdded(true);
      setTimeout(() => { setAdded(false); onClose(); }, 1500);
    },
  });

  const inputCls =
    'block w-full rounded-lg border border-cv-border bg-cv-surface px-3 py-2 text-sm text-white focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50';

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
          <h2 className="text-base font-semibold text-white">Add to collection</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Row 1: Collection + Quantity */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                Collection
              </label>
              <select value={collectionId} onChange={e => setCollectionId(e.target.value)} className={inputCls}>
                <option value="">Select a collection…</option>
                {collections?.items.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            <div className="shrink-0">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                Qty
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-cv-border bg-cv-surface text-sm">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2.5 py-2 text-cv-neutral hover:text-white">−</button>
                <span className="min-w-6 text-center font-medium text-white">{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => q + 1)} className="px-2.5 py-2 text-cv-neutral hover:text-white">+</button>
              </div>
            </div>
          </div>

          {/* Row 2: Condition + Printing */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                Condition
              </label>
              <select value={condition} onChange={e => setCondition(e.target.value)} className={inputCls}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="shrink-0">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cv-neutral">
                Printing
              </label>
              <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
                {[{ v: false, l: 'Regular' }, { v: true, l: 'Foil' }].map(({ v, l }) => (
                  <button
                    key={l} type="button" onClick={() => setFoil(v)}
                    className={['rounded px-3 py-1.5 text-xs font-medium transition-colors', foil === v ? 'bg-primary text-white' : 'text-cv-neutral hover:text-white'].join(' ')}
                  >{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => mutateAsync()}
              disabled={!collectionId || isPending}
              className={[
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60',
                added ? 'bg-secondary text-white' : 'bg-primary text-white hover:bg-primary-dark',
              ].join(' ')}
            >
              {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
              {added ? 'Added!' : 'Add'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-cv-border px-4 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleGroup<T extends string | boolean>({
  options, value, onChange, format,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  format: (v: T) => string;
}) {
  return (
    <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
      {options.map(opt => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          className={[
            'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
            value === opt ? 'bg-primary text-white' : 'text-cv-neutral hover:text-white',
          ].join(' ')}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

const RARITY_COLOR: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-secondary',
  rare: 'text-yellow-400',
  mythic: 'text-tertiary-light',
  special: 'text-primary-light',
  bonus: 'text-pink-400',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <CardDetail id={id} />
    </AppShell>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function CardDetail({ id }: { id: string }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: card, isLoading, isError } = useQuery({
    queryKey: queryKeys.card(id),
    queryFn: () => cardsApi.getById(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-cv-neutral">
        <IconSpinner className="h-5 w-5 animate-spin text-primary" />
        Loading…
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Card not found.
        </div>
      </div>
    );
  }

  const image = card.image_uri ?? card.card_faces?.[0]?.image_uri;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">

      {/* ── 3-column layout ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_420px_1fr]">

        {/* Col 1 — Image */}
        <div className="flex-shrink-0">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={card.name}
              className="w-full rounded-[5%] shadow-2xl ring-1 ring-white/5 lg:w-72"
            />
          ) : (
            <div className="flex h-96 w-72 items-center justify-center rounded-2xl border border-cv-border bg-cv-raised text-sm text-cv-neutral">
              No image
            </div>
          )}
        </div>

        {/* Col 2 — Info */}
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold leading-tight text-white">{card.name}</h1>           
          </div>

          {/* Unified info block */}
          <div className="rounded-xl border border-cv-border bg-cv-raised px-4 py-3 text-sm">
            {/* Mana cost */}
            {card.mana_cost && (
              <div className="flex items-center gap-0.5">
                {parseSymbols(card.mana_cost)}
              </div>
            )}

            {/* Type · rarity */}
            {(card.type_line || card.rarity) && (
              <div className={['flex items-baseline justify-between gap-2', card.mana_cost ? 'mt-1.5 border-t border-cv-border/50 pt-1.5' : ''].join(' ')}>
                {card.type_line && (
                  <span className="text-cv-neutral">{card.type_line}</span>
                )}
                <span className={['shrink-0 capitalize font-medium', RARITY_COLOR[card.rarity] ?? 'text-cv-neutral'].join(' ')}>
                  {card.rarity}
                </span>
              </div>
            )}

            {/* Oracle text */}
            {card.oracle_text && (
              <div className="mt-2 border-t border-cv-border/50 pt-2 leading-relaxed text-slate-300">
                {card.oracle_text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{parseSymbols(line)}</p>
                ))}
              </div>
            )}

            {/* Set name · set code · coll# */}
            <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-cv-border/50 pt-2">
              <span className="font-medium text-white">{card.set_name}</span>
              <span className="shrink-0 text-cv-neutral">
                {card.set_code.toUpperCase()} · #{card.collector_number.padStart(4, '0')}
              </span>
            </div>

            {/* Artist */}
            {card.artist && (
              <p className="mt-2 border-t border-cv-border/50 pt-2 text-[11px] text-cv-neutral">
                Illustrated by {card.artist}
              </p>
            )}
          </div>

          {/* Collections */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-cv-neutral">
                In collections
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-cv-border px-2.5 py-1 text-xs font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
              >
                <IconPlus className="h-3 w-3" />
                Add to my collections
              </button>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-cv-border bg-cv-raised px-4 py-8 text-center">
              <IconFolder className="h-8 w-8 text-cv-border" />
              <p className="text-xs text-cv-neutral">No collections yet</p>
            </div>
          </div>

          {showAddModal && (
            <AddToCollectionModal cardId={id} onClose={() => setShowAddModal(false)} />
          )}
        </div>

        {/* Col 3 — Prices + Chart */}
        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-1">
          {/* Prices */}
          {(card.prices?.eur != null || card.prices?.eur_foil != null) && (
            <div className="flex items-center gap-6 px-1">
              {card.prices.eur != null && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-cv-neutral">Non-foil</span>
                  <span className="text-xl font-semibold text-white">
                    {formatPrice(card.prices.eur, 'EUR')}
                  </span>
                </div>
              )}
              {card.prices.eur_foil != null && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-cv-neutral">Foil</span>
                  <span className="text-xl font-semibold text-secondary">
                    {formatPrice(card.prices.eur_foil, 'EUR')}
                  </span>
                </div>
              )}
            </div>
          )}

          <PriceChart id={id} />
        </div>
      </div>
    </div>
  );
}

