'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { queryKeys } from '@cardvault/api';
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
    return match ? <ManaSymbol key={i} code={match[1]} /> : part;
  });
}

function OracleText({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-cv-border bg-cv-raised px-4 py-3 text-sm leading-relaxed text-slate-300">
      {text.split('\n').map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {parseSymbols(line)}
        </p>
      ))}
    </div>
  );
}

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

  const { data: variations } = useQuery({
    queryKey: queryKeys.priceVariations(id, 'eur'),
    queryFn: () => cardsApi.priceVariations(id, 'eur'),
    enabled: !!card,
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
    <div className="flex flex-col gap-8 p-6 lg:p-8">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex w-fit items-center gap-1.5 rounded-lg border border-cv-border px-3 py-1.5 text-sm text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
      >
        <IconChevronLeft className="h-4 w-4" />
        Back
      </button>

      {/* ── 3-column layout ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_300px]">

        {/* Col 1 — Image */}
        <div className="flex-shrink-0">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={card.name}
              className="w-full rounded-[5%] shadow-2xl ring-1 ring-white/5 lg:w-80"
            />
          ) : (
            <div className="flex h-96 w-80 items-center justify-center rounded-2xl border border-cv-border bg-cv-raised text-sm text-cv-neutral">
              No image
            </div>
          )}
        </div>

        {/* Col 2 — Info */}
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white">{card.name}</h1>
            {card.type_line && (
              <p className="mt-1 text-base text-cv-neutral">{card.type_line}</p>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{card.set_code.toUpperCase()}</Badge>
            <Badge>#{card.collector_number}</Badge>
            <Badge className="capitalize">{card.rarity}</Badge>
            {card.mana_cost && (
              <span className="flex items-center gap-0.5 rounded-md border border-cv-border bg-cv-surface px-2 py-1">
                {parseSymbols(card.mana_cost)}
              </span>
            )}
            {card.cmc != null && <Badge>CMC {card.cmc}</Badge>}
          </div>

          {/* Oracle text */}
          {card.oracle_text && <OracleText text={card.oracle_text} />}

          {/* Stats grid */}
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

          {/* Card faces */}
          {card.card_faces && card.card_faces.length > 0 && (
            <div className="flex gap-4">
              {card.card_faces.map((face, i) => (
                <div key={i} className="flex-1 rounded-xl border border-cv-border bg-cv-raised px-4 py-3 text-sm">
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
        </div>

        {/* Col 3 — Collections */}
        <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cv-neutral">
            In collections
          </h2>
          <div className="flex flex-col gap-2">
            {/* Placeholder — will be populated once backend supports it */}
            <div className="flex flex-col items-center gap-2 rounded-xl border border-cv-border bg-cv-raised px-4 py-8 text-center">
              <IconFolder className="h-8 w-8 text-cv-border" />
              <p className="text-xs text-cv-neutral">No collections yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-cv-border bg-cv-raised p-6">
          <h2 className="mb-1 text-base font-semibold text-white">Price variation (EUR)</h2>
          <p className="mb-6 text-xs text-cv-neutral">
            Price at start of period vs now —{' '}
            {variations?.computed_at ? new Date(variations.computed_at).toLocaleDateString() : ''}
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A3D" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#7A7580' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#7A7580' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} width={48} />
              <Tooltip
                formatter={(value) => typeof value === 'number' ? `€${value.toFixed(2)}` : value}
                contentStyle={{ borderRadius: 8, border: '1px solid #2A2A3D', background: '#1A1A28', color: '#e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="then" name="then" fill="#252535" radius={[4, 4, 0, 0]} />
              <Bar dataKey="now" name="now" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.direction === 'up' ? '#10B981' : entry.direction === 'down' ? '#ef4444' : '#7A7580'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-wrap gap-3">
            {chartData.map(v => (
              <div key={v.period} className="flex flex-col items-center rounded-lg border border-cv-border bg-cv-surface px-4 py-2">
                <span className="text-xs text-cv-neutral">{v.period}</span>
                <span className={[
                  'text-sm font-semibold',
                  v.direction === 'up' ? 'text-secondary' : v.direction === 'down' ? 'text-red-400' : 'text-cv-neutral',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-md border border-cv-border bg-cv-surface px-2.5 py-1 text-xs font-medium text-slate-300 ${className}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-cv-neutral">{label}:</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}
