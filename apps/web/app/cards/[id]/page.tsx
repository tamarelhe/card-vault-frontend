'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { queryKeys } from '@cardvault/api';
import { AppShell } from '@/components/AppShell';
import { cardsApi } from '@/lib/api-instance';
import { IconSpinner } from '@/components/icons';

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <CardDetail id={id} />
    </AppShell>
  );
}

function CardDetail({ id }: { id: string }) {
  const { data: card, isLoading, isError } = useQuery({
    queryKey: queryKeys.card(id),
    queryFn: () => cardsApi.getById(id),
  });

  const { data: variations } = useQuery({
    queryKey: queryKeys.priceVariations(id, 'eur'),
    queryFn: () => cardsApi.priceVariations(id, 'eur'),
    enabled: !!card,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-slate-400">
        <IconSpinner className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="p-8">
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700 ring-1 ring-red-200">
          Card not found.
        </div>
      </div>
    );
  }

  const chartData = (variations?.variations ?? [])
    .filter(v => v.price_now !== null || v.price_then !== null)
    .map(v => ({
      period: v.period,
      now: v.price_now ? parseFloat(v.price_now) : null,
      then: v.price_then ? parseFloat(v.price_then) : null,
      direction: v.direction,
      delta_pct: v.delta_pct,
    }));

  const image = card.image_uri ?? card.card_faces?.[0]?.image_uri;

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex gap-8">
        {/* Card image */}
        <div className="flex-shrink-0">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={card.name}
              className="w-72 rounded-2xl shadow-xl ring-1 ring-black/5"
            />
          ) : (
            <div className="flex h-96 w-72 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400 ring-1 ring-slate-200">
              No image
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{card.name}</h1>
            {card.type_line && (
              <p className="mt-1 text-base text-slate-500">{card.type_line}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{card.set_code.toUpperCase()}</Badge>
            <Badge>#{card.collector_number}</Badge>
            <Badge className="capitalize">{card.rarity}</Badge>
            {card.mana_cost && <Badge>{card.mana_cost}</Badge>}
            {card.cmc != null && <Badge>CMC {card.cmc}</Badge>}
          </div>

          {card.oracle_text && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line ring-1 ring-slate-200">
              {card.oracle_text}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {card.artist && <InfoRow label="Artist" value={card.artist} />}
            {card.power && card.toughness && (
              <InfoRow label="P/T" value={`${card.power} / ${card.toughness}`} />
            )}
            {card.colors.length > 0 && (
              <InfoRow label="Colors" value={card.colors.join(', ')} />
            )}
            {card.set_name && <InfoRow label="Set" value={card.set_name} />}
            {card.layout !== 'normal' && <InfoRow label="Layout" value={card.layout} />}
          </div>

          {/* Faces */}
          {card.card_faces && card.card_faces.length > 0 && (
            <div className="flex gap-4">
              {card.card_faces.map((face, i) => (
                <div key={i} className="flex-1 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 text-sm">
                  <p className="font-semibold text-slate-900">{face.name}</p>
                  {face.type_line && <p className="text-xs text-slate-500">{face.type_line}</p>}
                  {face.oracle_text && <p className="mt-1 text-slate-700 whitespace-pre-line">{face.oracle_text}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Price variation (EUR)</h2>
          <p className="mb-6 text-xs text-slate-400">
            Price at start of period vs now — {variations?.computed_at ? new Date(variations.computed_at).toLocaleDateString() : ''}
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} width={48} />
              <Tooltip
                formatter={(value) => typeof value === 'number' ? `€${value.toFixed(2)}` : value}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="then" name="then" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="now" name="now" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.direction === 'up' ? '#22c55e' : entry.direction === 'down' ? '#ef4444' : '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Delta table */}
          <div className="mt-4 flex flex-wrap gap-3">
            {chartData.map(v => (
              <div key={v.period} className="flex flex-col items-center rounded-lg bg-slate-50 px-4 py-2 ring-1 ring-slate-200">
                <span className="text-xs text-slate-400">{v.period}</span>
                <span className={[
                  'text-sm font-semibold',
                  v.direction === 'up' ? 'text-green-600' : v.direction === 'down' ? 'text-red-500' : 'text-slate-500',
                ].join(' ')}>
                  {v.delta_pct ? `${v.delta_pct}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 ${className}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
