'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { cardsApi } from '@/lib/api-instance';
import { IconSpinner } from '@/components/icons';

export default function CardDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <CardDetail id={params.id} />
    </AppShell>
  );
}

function CardDetail({ id }: { id: string }) {
  const { data: card, isLoading, isError } = useQuery({
    queryKey: queryKeys.card(id),
    queryFn: () => cardsApi.getById(id),
  });

  return (
    <div className="flex-1 p-8">
      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-sm text-slate-400">
          <IconSpinner className="h-5 w-5 animate-spin" />
          Loading card…
        </div>
      )}

      {isError && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700 ring-1 ring-red-200">
          Card not found.
        </div>
      )}

      {card && (
        <div className="flex gap-8">
          {card.image_uri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.image_uri}
              alt={card.name}
              className="h-auto w-64 flex-shrink-0 rounded-xl shadow-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{card.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{card.type_line}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="rounded bg-gray-100 px-2 py-1 font-mono uppercase">{card.set_code}</span>
              <span className="text-slate-500">#{card.collector_number}</span>
              <span className="capitalize text-slate-500">{card.rarity}</span>
            </div>
            {card.oracle_text && (
              <p className="mt-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {card.oracle_text}
              </p>
            )}
            {card.mana_cost && (
              <p className="mt-3 text-sm text-slate-500">
                Mana cost: <span className="font-mono">{card.mana_cost}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
