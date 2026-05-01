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
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Profile</h1>

      <div className="max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <IconUser className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{userEmail}</p>
            <p className="text-xs text-slate-400">CardVault member</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => void logout()}
            className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
