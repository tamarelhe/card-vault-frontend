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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s an overview of your collection.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Collections"
          value={isLoading ? null : (data?.meta.total ?? 0)}
          href="/collections"
        />
        <StatCard label="Total cards" value={null} placeholder />
        <StatCard label="Collection value" value={null} placeholder />
      </div>

      {/* Recent collections */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">My Collections</h2>
          <Link
            href="/collections"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
            <IconSpinner className="h-4 w-4 animate-spin" />
            Loading collections…
          </div>
        )}

        {!isLoading && (!data?.items.length) && (
          <div className="py-10 text-center">
            <IconFolder className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No collections yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Create your first collection to start tracking cards.
            </p>
            <Link
              href="/collections"
              className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create collection
            </Link>
          </div>
        )}

        {!isLoading && !!data?.items.length && (
          <ul className="divide-y divide-gray-100">
            {data.items.map((col) => (
              <li key={col.id}>
                <Link
                  href={`/collections/${col.id}`}
                  className="flex items-center gap-3 py-3 text-sm hover:text-blue-600"
                >
                  <IconFolder className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span className="flex-1 font-medium text-slate-800">{col.name}</span>
                  {col.description && (
                    <span className="truncate text-slate-400 max-w-[180px]">{col.description}</span>
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
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      {value === null ? (
        <p className="mt-2 text-2xl font-bold text-slate-300">
          {placeholder ? '—' : <IconSpinner className="h-5 w-5 animate-spin text-slate-300" />}
        </p>
      ) : (
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
