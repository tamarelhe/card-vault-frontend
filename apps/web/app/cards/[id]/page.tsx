'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { queryKeys } from '@cardvault/api';
import { formatPrice } from '@cardvault/core';
import type { Card } from '@cardvault/core';
import { AppShell } from '@/components/AppShell';
import { cardsApi } from '@/lib/api-instance';
import { IconChevronLeft, IconFolder, IconSpinner } from '@/components/icons';

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

// ─── Price chart (mock data) ──────────────────────────────────────────────────

type Period = '1d' | '7d' | '30d' | '90d';
type Currency = 'eur' | 'usd';

const PERIOD_POINTS: Record<Period, string[]> = {
  '1d':  ['6h', '4h', '2h', '1h', 'Now'],
  '7d':  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
  '30d': ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Now'],
  '90d': ['M−3', 'M−2', 'M−1', 'Now'],
};

function mockSeries(base: number, labels: string[]) {
  return labels.map((label, i) => {
    const t = i / Math.max(labels.length - 1, 1);
    const wave = Math.sin(i * 1.8) * 0.06;
    const trend = (t - 0.5) * 0.2;
    return { label, value: Math.max(0.01, base * (1 + trend + wave)) };
  });
}

function PriceChart({ card }: { card: Card }) {
  const [period, setPeriod] = useState<Period>('30d');
  const [currency, setCurrency] = useState<Currency>('eur');
  const [foil, setFoil] = useState(false);

  const basePrice =
    currency === 'eur'
      ? (foil ? card.prices?.eur_foil : card.prices?.eur) ?? 0
      : (foil ? card.prices?.usd_foil : card.prices?.usd) ?? 0;

  const data = mockSeries(basePrice, PERIOD_POINTS[period]);
  const sym = currency === 'eur' ? '€' : '$';

  return (
    <div className="rounded-xl border border-cv-border bg-cv-raised p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-cv-neutral">
        Price history
      </h2>

      {/* Selectors */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <ToggleGroup
          options={['1d', '7d', '30d', '90d'] as Period[]}
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

      {basePrice > 0 ? (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} barCategoryGap="25%">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.25} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A3D" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#7A7580' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#7A7580' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${sym}${(v as number).toFixed(2)}`}
              width={46}
            />
            <Tooltip
              formatter={(v) =>
                typeof v === 'number' ? `${sym}${v.toFixed(2)}` : v
              }
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #2A2A3D',
                background: '#1A1A28',
                color: '#e2e8f0',
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
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
  const router = useRouter();

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

          {/* Card faces */}
          {card.card_faces && card.card_faces.length > 0 && (
            <div className="flex flex-col gap-2">
              {card.card_faces.map((face, i) => (
                <div key={i} className="rounded-xl border border-cv-border bg-cv-raised px-4 py-3 text-sm">
                  <p className="font-semibold text-white">{face.name}</p>
                  {face.type_line && <p className="text-xs text-cv-neutral">{face.type_line}</p>}
                  {face.oracle_text && (
                    <div className="mt-1 text-slate-300">
                      {face.oracle_text.split('\n').map((line, j) => (
                        <p key={j} className={j > 0 ? 'mt-1' : ''}>{parseSymbols(line)}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Collections */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-cv-neutral">
              In collections
            </h2>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-cv-border bg-cv-raised px-4 py-8 text-center">
              <IconFolder className="h-8 w-8 text-cv-border" />
              <p className="text-xs text-cv-neutral">No collections yet</p>
            </div>
          </div>
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
                  <span className="text-xl font-semibold text-primary-light">
                    {formatPrice(card.prices.eur_foil, 'EUR')}
                  </span>
                </div>
              )}
            </div>
          )}

          <PriceChart card={card} />
        </div>
      </div>
    </div>
  );
}

