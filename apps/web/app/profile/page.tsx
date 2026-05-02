'use client';

import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { IconUser } from '@/components/icons';

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}

function ProfileContent() {
  const { userEmail, logout } = useAuth();

  return (
    <div className="flex-1 p-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-white">Profile</h1>

      <div className="max-w-md rounded-2xl border border-cv-border bg-cv-raised p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
            <IconUser className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{userEmail}</p>
            <p className="text-xs text-cv-neutral">CardVault member</p>
          </div>
        </div>

        <div className="border-t border-cv-border pt-4">
          <button
            onClick={() => void logout()}
            className="w-full rounded-lg border border-red-900/60 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-950/40 focus:outline-none"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
