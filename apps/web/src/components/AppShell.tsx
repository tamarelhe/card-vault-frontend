'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  IconFolder, IconHome, IconLogOut,
  IconSearch, IconSpinner, IconStar, IconUser,
} from '@/components/icons';
import logoSrc from '../../assets/images/logo.png';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: IconHome },
  { href: '/search', label: 'Search', Icon: IconSearch },
  { href: '/collections', label: 'Collections', Icon: IconFolder },
  { href: '/watchlist', label: 'Wishlist', Icon: IconStar },
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
      <div className="flex h-screen items-center justify-center bg-cv-deep">
        <IconSpinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-cv-deep">

      {/* ── Sidebar — desktop only ── */}
      <aside className="hidden md:flex w-52 flex-shrink-0 flex-col border-r border-cv-border bg-cv-deep">
        <div className="flex items-center justify-center px-4 pb-3 pt-6">
          <Image src={logoSrc} alt="CardVault" className="w-28 h-auto" />
        </div>

        <nav className="flex flex-col gap-0.5 p-2 pt-4">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-cv-neutral hover:bg-cv-raised hover:text-white',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="border-t border-cv-border p-3">
          <p className="mb-1.5 truncate px-2 text-[11px] text-cv-neutral">{userEmail}</p>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-cv-neutral transition-colors hover:bg-cv-raised hover:text-white"
          >
            <IconLogOut className="h-4 w-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Top bar — mobile only ── */}
        <header className="flex md:hidden h-14 flex-shrink-0 items-center justify-between border-b border-cv-border bg-cv-base px-4">
          <Image src={logoSrc} alt="CardVault" className="h-9 w-auto" />
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className={[
                    'rounded-lg p-2 transition-colors',
                    isActive ? 'text-primary' : 'text-cv-neutral hover:text-white',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
