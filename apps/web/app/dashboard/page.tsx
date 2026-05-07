'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import type { TopMoverItem, TopMoversParams } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { cardsApi } from '@/lib/api-instance';
import { IconSpinner, IconX } from '@/components/icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS: { label: string; value: TopMoversParams['period'] }[] = [
  { label: '24h',  value: '1d'  },
  { label: '7d',   value: '7d'  },
  { label: '30d',  value: '30d' },
  { label: '90d',  value: '90d' },
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

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function DashboardContent() {
  const [period, setPeriod] = useState<TopMoversParams['period']>('7d');
  const [preview, setPreview] = useState<TopMoverItem | null>(null);

  const dropsParams = { period, currency: 'eur' as const, direction: 'down' as const, limit: 20, mode: 'wishlists' as const };
  const gainersParams = { period, currency: 'eur' as const, direction: 'up' as const, limit: 20, mode: 'collections' as const };

  const { data: drops, isLoading: dropsLoading } = useQuery({
    queryKey: queryKeys.topMovers(dropsParams),
    queryFn: () => cardsApi.getTopMovers(dropsParams),
  });

  const { data: gainers, isLoading: gainersLoading } = useQuery({
    queryKey: queryKeys.topMovers(gainersParams),
    queryFn: () => cardsApi.getTopMovers(gainersParams),
  });


  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* ── Market movers ── */}
      <section className="mb-8">
        {/* Header + period selector */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-white">Market Movers</h2>
          <div className="flex rounded-lg border border-cv-border bg-cv-surface p-0.5">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={[
                  'rounded px-3 py-1 text-xs font-medium transition-colors',
                  period === value ? 'bg-primary text-white' : 'text-cv-neutral hover:text-white',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Two panels */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MoversPanel
            title="Wishlist drops"
            direction="down"
            movers={drops?.movers}
            isLoading={dropsLoading}
            onPreview={setPreview}
          />
          <MoversPanel
            title="Collection gainers"
            direction="up"
            movers={gainers?.movers}
            isLoading={gainersLoading}
            onPreview={setPreview}
          />
        </div>
      </section>

      

      {/* Card image preview popup */}
      {preview && <CardPreviewModal item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ─── Movers panel ─────────────────────────────────────────────────────────────

function MoversPanel({
  title,
  direction,
  movers,
  isLoading,
  onPreview,
}: {
  title: string;
  direction: 'up' | 'down';
  movers: TopMoverItem[] | undefined;
  isLoading: boolean;
  onPreview: (item: TopMoverItem) => void;
}) {
  const accent = direction === 'up' ? 'text-secondary' : 'text-red-400';
  const indicator = direction === 'up' ? '▲' : '▼';

  return (
    <div className="rounded-2xl border border-cv-border bg-cv-raised">
      {/* Panel header */}
      <div className="flex items-center gap-2 border-b border-cv-border px-5 py-3.5">
        <span className={['text-xs font-bold', accent].join(' ')}>{indicator}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !movers?.length && (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-white">No data</p>
          <p className="mt-1 text-xs text-cv-neutral">
            {direction === 'down'
              ? 'No wishlist cards with price drops in this period.'
              : 'No collection cards with price gains in this period.'}
          </p>
        </div>
      )}

      {!isLoading && !!movers?.length && (
        <ul className="divide-y divide-cv-border/60">
          {movers.map((item, idx) => (
            <MoverRow
              key={item.card_id}
              item={item}
              rank={idx + 1}
              direction={direction}
              onPreview={() => onPreview(item)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Mover row ────────────────────────────────────────────────────────────────

function MoverRow({
  item,
  rank,
  direction,
  onPreview,
}: {
  item: TopMoverItem;
  rank: number;
  direction: 'up' | 'down';
  onPreview: () => void;
}) {
  const deltaPct = parseFloat(item.delta_pct);
  const priceNow = parseFloat(item.price_now);
  const isUp = direction === 'up';

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-cv-overlay">
      {/* Rank */}
      <span className="w-5 shrink-0 text-right text-[11px] text-cv-border">{rank}</span>

      {/* Thumbnail — click for preview */}
      <button
        onClick={onPreview}
        title="Preview card"
        className="shrink-0 overflow-hidden rounded transition hover:opacity-80"
      >
        {item.image_uri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_uri}
            alt={item.name}
            className="h-14 w-10 rounded object-cover"
          />
        ) : (
          <div className="flex h-14 w-10 items-center justify-center rounded bg-cv-deep text-[8px] text-cv-neutral">—</div>
        )}
      </button>

      {/* Card info */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/cards/${item.card_id}`}
          className="block truncate text-sm font-medium text-white hover:text-primary-light"
        >
          {item.name}
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] text-cv-neutral">
          <span className="uppercase">{item.set_code}</span>
          <span>·</span>
          <span className={['capitalize font-medium', RARITY_COLORS[item.rarity] ?? 'text-cv-neutral'].join(' ')}>
            {item.rarity}
          </span>
        </div>
        {/* Context badges */}
        {!isUp && !!item.wishlists?.length && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.wishlists.map(wl => (
              <Link
                key={wl.id}
                href={`/watchlist/${wl.id}`}
                onClick={e => e.stopPropagation()}
                className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary-light hover:bg-primary/20"
              >
                {wl.name}
              </Link>
            ))}
          </div>
        )}
        {isUp && !!item.collections?.length && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.collections.map(col => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                onClick={e => e.stopPropagation()}
                className="rounded bg-secondary/10 px-1.5 py-0.5 text-[10px] text-secondary hover:bg-secondary/20"
              >
                {col.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Price + delta */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-white">
          €{isNaN(priceNow) ? '—' : priceNow.toFixed(2)}
        </p>
        <p className={['text-[11px] font-medium', isUp ? 'text-secondary' : 'text-red-400'].join(' ')}>
          {isUp ? '+' : '−'}{Math.abs(deltaPct).toFixed(1)}%
        </p>
      </div>
    </li>
  );
}

// ─── Card preview modal ───────────────────────────────────────────────────────

function CardPreviewModal({ item, onClose }: { item: TopMoverItem; onClose: () => void }) {
  const deltaPct = parseFloat(item.delta_pct);
  const priceNow = parseFloat(item.price_now);
  const priceThen = parseFloat(item.price_then);
  const isUp = item.direction === 'up';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex w-full items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{item.name}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cv-neutral transition-colors hover:bg-cv-overlay hover:text-white"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Card image */}
        {item.image_uri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_uri}
            alt={item.name}
            className="w-56 rounded-xl shadow-lg"
          />
        ) : (
          <div className="flex h-72 w-52 items-center justify-center rounded-xl bg-cv-deep text-sm text-cv-neutral">
            No image
          </div>
        )}

        {/* Meta */}
        <div className="w-full space-y-2 text-sm">
          <div className="flex justify-between text-cv-neutral">
            <span>Set</span>
            <span className="font-medium text-white uppercase">{item.set_code} — {item.set_name}</span>
          </div>
          <div className="flex justify-between text-cv-neutral">
            <span>Rarity</span>
            <span className={['font-medium capitalize', RARITY_COLORS[item.rarity] ?? 'text-white'].join(' ')}>
              {item.rarity}
            </span>
          </div>
          <div className="flex justify-between border-t border-cv-border pt-2 text-cv-neutral">
            <span>Price now</span>
            <span className="font-semibold text-white">€{isNaN(priceNow) ? '—' : priceNow.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-cv-neutral">
            <span>Price before</span>
            <span className="font-medium text-white">€{isNaN(priceThen) ? '—' : priceThen.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-cv-neutral">
            <span>Change</span>
            <span className={['font-semibold', isUp ? 'text-secondary' : 'text-red-400'].join(' ')}>
              {isUp ? '+' : '−'}{Math.abs(deltaPct).toFixed(2)}%
              {' '}(€{isNaN(parseFloat(item.delta_abs)) ? '—' : Math.abs(parseFloat(item.delta_abs)).toFixed(2)})
            </span>
          </div>
        </div>

        <Link
          href={`/cards/${item.card_id}`}
          className="w-full rounded-lg border border-cv-border py-2 text-center text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
        >
          View card details
        </Link>
      </div>
    </div>
  );
}

