'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { wishlistsApi } from '@/lib/api-instance';
import { IconSpinner, IconStar } from '@/components/icons';
import type { MagicTugaPrice } from '@cardvault/core';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MagicTugaStockPage() {
  return (
    <AppShell>
      <MagicTugaStock />
    </AppShell>
  );
}

function MagicTugaStock() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.magicTugaStock,
    queryFn: () => wishlistsApi.getMagicTugaStock(),
  });

  const grouped = groupByCard(Array.isArray(data?.items) ? data!.items : []);

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-cv-neutral">
        <Link href="/watchlist" className="transition-colors hover:text-white">Wishlists</Link>
        <span>/</span>
        <span className="font-medium text-white">MagicTuga Stock</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-white">MagicTuga Stock</h2>
          <p className="mt-1 text-sm text-cv-neutral">
            In-stock listings for your wishlist cards at MagicTuga.
          </p>
          {data && (
            <p className="mt-0.5 text-xs text-cv-neutral">
              {data.last_synced_at
                ? <>Last synced: {fmtDate(data.last_synced_at)}</>
                : 'Never synced'}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin text-primary" />
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm text-red-400">
          Failed to load MagicTuga stock.
        </div>
      )}

      {!isLoading && !isError && grouped.length === 0 && (
        <div className="py-16 text-center">
          <IconStar className="mx-auto mb-3 h-10 w-10 text-cv-border" />
          <p className="text-sm font-medium text-white">No stock found</p>
          <p className="mt-1 text-xs text-cv-neutral">
            None of your wishlist cards are currently in stock at MagicTuga.
          </p>
        </div>
      )}

      {!isLoading && !isError && grouped.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-cv-border bg-cv-raised overflow-hidden">
          {grouped.map((group, gi) => (
            <div key={group.card_name}>
              {/* Card name header */}
              <div className={[
                'flex items-center gap-2 px-4 py-2 bg-cv-surface',
                gi > 0 ? 'border-t border-cv-border' : '',
              ].join(' ')}>
                <span className="text-sm font-semibold text-white">{group.card_name}</span>
                <span className="text-[11px] text-cv-neutral">
                  {group.rows.length} listing{group.rows.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Variant rows */}
              {group.rows.map((row, ri) => (
                <StockRow key={row.id} row={row} last={ri === group.rows.length - 1} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StockRow({ row, last }: { row: MagicTugaPrice; last: boolean }) {
  const priceRange = row.min_price === row.max_price
    ? `€${row.min_price.toFixed(2)}`
    : `€${row.min_price.toFixed(2)} – €${row.max_price.toFixed(2)}`;

  return (
    <div className={[
      'flex items-center gap-3 px-4 py-2 text-sm',
      !last ? 'border-b border-cv-border/50' : '',
    ].join(' ')}>
      {/* Condition + language + foil */}
      <span className="w-24 shrink-0 text-[12px] text-white">{row.condition_name}</span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-cv-neutral">{row.language_name}</span>
      {row.foil && (
        <span className="shrink-0 text-[10px] font-medium text-primary-light">✦ Foil</span>
      )}

      {/* Price */}
      <span className="shrink-0 text-[12px] font-medium text-white">{priceRange}</span>

      {/* Quantity */}
      <span className="w-8 shrink-0 text-right text-[12px] text-cv-neutral">
        ×{row.total_quantity}
      </span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface CardGroup {
  card_name: string;
  rows: MagicTugaPrice[];
}

function groupByCard(items: MagicTugaPrice[]): CardGroup[] {
  const map = new Map<string, MagicTugaPrice[]>();
  for (const item of items) {
    const existing = map.get(item.card_name);
    if (existing) {
      existing.push(item);
    } else {
      map.set(item.card_name, [item]);
    }
  }
  return Array.from(map.entries())
    .map(([card_name, rows]) => ({ card_name, rows }))
    .sort((a, b) => a.card_name.localeCompare(b.card_name));
}
