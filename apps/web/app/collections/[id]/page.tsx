'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import { CONDITIONS } from '@cardvault/core';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import { IconFolder, IconSpinner } from '@/components/icons';

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <CollectionDetail id={id} />
    </AppShell>
  );
}

function CollectionDetail({ id }: { id: string }) {
  const { data: collection, isLoading: loadingCol } = useQuery({
    queryKey: queryKeys.collection(id),
    queryFn: () => collectionsApi.getById(id),
  });

  const { data: cards, isLoading: loadingCards } = useQuery({
    queryKey: queryKeys.collectionItems(id),
    queryFn: () => collectionsApi.listCards(id, { page: 1, page_size: 50, sort_by: 'name', sort_order: 'asc' }),
    enabled: !!collection,
  });

  const isLoading = loadingCol || loadingCards;

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-cv-neutral">
        <Link href="/collections" className="transition-colors hover:text-white">
          Collections
        </Link>
        <span>/</span>
        <span className="font-medium text-white">{collection?.name ?? '…'}</span>
      </div>

      <div className="mb-6 flex items-start gap-3">
        <IconFolder className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary" />
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">{collection?.name ?? '…'}</h1>
          {collection?.description && (
            <p className="mt-1 text-sm text-cv-neutral">{collection.description}</p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-cv-neutral">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      )}

      {!isLoading && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-cv-neutral">
              {cards?.meta.total ?? 0} card{cards?.meta.total !== 1 ? 's' : ''}
            </p>
          </div>

          {!cards?.items.length ? (
            <div className="py-16 text-center">
              <p className="text-sm text-cv-neutral">This collection has no cards yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-cv-border bg-cv-raised">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cv-border bg-cv-surface text-left text-xs font-medium uppercase tracking-wide text-cv-neutral">
                    <th className="px-4 py-3">Card</th>
                    <th className="px-4 py-3">Set</th>
                    <th className="px-4 py-3">Condition</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">EUR</th>
                    <th className="px-4 py-3 text-right">USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cv-border">
                  {cards.items.map((card) => (
                    <tr key={card.id} className="transition-colors hover:bg-cv-overlay">
                      <td className="px-4 py-3">
                        <Link
                          href={`/cards/${card.card_id}`}
                          className="font-medium text-white transition-colors hover:text-primary-light"
                        >
                          {card.card_name}
                          {card.foil && (
                            <span className="ml-1.5 rounded bg-tertiary/20 px-1.5 py-0.5 text-[10px] font-medium text-tertiary-light">
                              Foil
                            </span>
                          )}
                        </Link>
                        <p className="text-xs text-cv-neutral">{card.type_line}</p>
                      </td>
                      <td className="px-4 py-3 text-cv-neutral">
                        <span className="font-mono text-xs uppercase">{card.set_code}</span>
                        <span className="ml-1 text-cv-border">#{card.collector_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded border border-cv-border bg-cv-surface px-2 py-0.5 text-xs font-medium text-white">
                          {CONDITIONS[card.condition]?.shortLabel ?? card.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-white">
                        {card.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-cv-neutral">
                        {card.price_eur ? `€${parseFloat(card.price_eur).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-cv-neutral">
                        {card.price_usd ? `$${parseFloat(card.price_usd).toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
