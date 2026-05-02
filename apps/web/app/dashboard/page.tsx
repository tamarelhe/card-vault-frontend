'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@cardvault/api';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { collectionsApi } from '@/lib/api-instance';
import { IconFolder, IconSpinner } from '@/components/icons';

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { userEmail } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.collections,
    queryFn: () => collectionsApi.list({ page: 1, page_size: 5 }),
  });

  const firstName = userEmail?.split('@')[0] ?? 'there';

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-white">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-cv-neutral">
          Here&apos;s an overview of your collection.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Collections"
          value={isLoading ? null : (data?.meta.total ?? 0)}
          href="/collections"
        />
        <StatCard label="Total cards" value={null} placeholder />
        <StatCard label="Collection value" value={null} placeholder />
      </div>

      <div className="rounded-2xl border border-cv-border bg-cv-raised p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">My Collections</h2>
          <Link
            href="/collections"
            className="text-sm font-medium text-primary hover:text-primary-light"
          >
            View all
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-cv-neutral">
            <IconSpinner className="h-4 w-4 animate-spin" />
            Loading collections…
          </div>
        )}

        {!isLoading && (!data?.items.length) && (
          <div className="py-10 text-center">
            <IconFolder className="mx-auto mb-3 h-10 w-10 text-cv-border" />
            <p className="text-sm font-medium text-white">No collections yet</p>
            <p className="mt-1 text-xs text-cv-neutral">
              Create your first collection to start tracking cards.
            </p>
            <Link
              href="/collections"
              className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Create collection
            </Link>
          </div>
        )}

        {!isLoading && !!data?.items.length && (
          <ul className="divide-y divide-cv-border">
            {data.items.map((col) => (
              <li key={col.id}>
                <Link
                  href={`/collections/${col.id}`}
                  className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-primary"
                >
                  <IconFolder className="h-4 w-4 flex-shrink-0 text-cv-neutral" />
                  <span className="flex-1 font-medium text-white">{col.name}</span>
                  {col.description && (
                    <span className="max-w-[180px] truncate text-cv-neutral">{col.description}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  placeholder,
}: {
  label: string;
  value: number | string | null;
  href?: string;
  placeholder?: boolean;
}) {
  const content = (
    <div className="rounded-2xl border border-cv-border bg-cv-raised p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-cv-neutral">{label}</p>
      {value === null ? (
        <p className="mt-2 text-2xl font-bold text-cv-border">
          {placeholder ? '—' : <IconSpinner className="h-5 w-5 animate-spin text-cv-neutral" />}
        </p>
      ) : (
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
