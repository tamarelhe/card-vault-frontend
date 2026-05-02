'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IconFolder, IconHome, IconLogOut, IconSearch, IconSpinner, IconStar, IconUser } from '@/components/icons';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: IconHome },
  { href: '/search', label: 'Search', Icon: IconSearch },
  { href: '/collections', label: 'Collections', Icon: IconFolder },
  { href: '/watchlist', label: 'Watchlist', Icon: IconStar },
  { href: '/profile', label: 'Profile', Icon: IconUser },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, userEmail, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <IconSpinner className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-shrink-0 flex-col bg-slate-900">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <span className="text-xl font-bold text-white tracking-tight">CardVault</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 p-4">
          <div className="mb-2 truncate px-1 text-xs text-slate-400">{userEmail}</div>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <IconLogOut className="h-5 w-5 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
