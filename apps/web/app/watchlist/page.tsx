'use client';

import { AppShell } from '@/components/AppShell';
import { IconStar } from '@/components/icons';

export default function WatchlistPage() {
  return (
    <AppShell>
      <div className="flex-1 p-8">
        <h1 className="mb-1 font-serif text-2xl font-bold text-white">Wishlist</h1>
        <p className="mb-8 text-sm text-cv-neutral">Track cards and get price alerts.</p>
        <div className="py-20 text-center">
          <IconStar className="mx-auto mb-3 h-12 w-12 text-cv-border" />
          <p className="text-sm font-medium text-white">Wishlist coming soon</p>
          <p className="mt-1 text-xs text-cv-neutral">
            You&apos;ll be able to track cards and set price targets here.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
