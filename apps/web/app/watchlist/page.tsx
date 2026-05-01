'use client';

import { AppShell } from '@/components/AppShell';
import { IconStar } from '@/components/icons';

export default function WatchlistPage() {
  return (
    <AppShell>
      <div className="flex-1 p-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Watchlist</h1>
        <p className="mb-8 text-sm text-slate-500">Track cards and get price alerts.</p>
        <div className="py-20 text-center">
          <IconStar className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">Watchlist coming soon</p>
          <p className="mt-1 text-xs text-slate-400">
            You&apos;ll be able to track cards and set price targets here.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
