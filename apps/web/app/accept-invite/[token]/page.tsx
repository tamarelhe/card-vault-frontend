'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, ApiError, NotFoundError } from '@cardvault/api';
import { useAuth } from '@/context/AuthContext';
import { collectionsApi } from '@/lib/api-instance';
import { IconFolder, IconGlobe, IconSpinner } from '@/components/icons';

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <AcceptInviteContent token={token} />;
}

function AcceptInviteContent({ token }: { token: string }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?next=/accept-invite/${token}`);
    }
  }, [isAuthenticated, authLoading, router, token]);

  const { data: collection, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.sharePreview(token),
    queryFn: () => collectionsApi.getSharePreview(token),
    enabled: isAuthenticated,
    retry: false,
  });

  const { mutate: accept, isPending } = useMutation({
    mutationFn: () => collectionsApi.acceptShareInvite(token),
    onSuccess: (accepted) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
      router.replace(`/collections/${accepted.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 422) {
        setAcceptError("You cannot accept your own collection invite.");
      } else if (err instanceof NotFoundError) {
        setAcceptError("This invite link is invalid or has expired.");
      } else {
        setAcceptError("Something went wrong. Please try again.");
      }
    },
  });

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cv-deep">
        <IconSpinner className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const notFound = isError && (error instanceof NotFoundError || (error instanceof ApiError && error.status === 404));

  return (
    <div className="flex min-h-screen items-center justify-center bg-cv-deep px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-sm text-cv-neutral">You&apos;ve been invited to join a collection</p>
        </div>

        <div className="rounded-2xl border border-cv-border bg-cv-raised p-6 shadow-2xl">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <IconSpinner className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-cv-neutral">Loading invite…</p>
            </div>
          )}

          {notFound && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400 w-full text-center">
                This invite link is invalid or has expired.
              </div>
              <button
                onClick={() => router.replace('/collections')}
                className="text-sm text-cv-neutral hover:text-white transition-colors"
              >
                Go to my collections
              </button>
            </div>
          )}

          {!isLoading && !notFound && collection && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <IconFolder className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{collection.name}</p>
                  {collection.description && (
                    <p className="mt-0.5 text-xs text-cv-neutral line-clamp-2">{collection.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-cv-neutral">
                    <span>{collection.total_cards} cards</span>
                    <span>·</span>
                    <span>€{collection.total_value_eur.toFixed(2)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <IconGlobe className="h-3 w-3" /> Public
                    </span>
                  </div>
                </div>
              </div>

              {acceptError && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                  {acceptError}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => accept()}
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  {isPending && <IconSpinner className="h-4 w-4 animate-spin" />}
                  Add to my collections
                </button>
                <button
                  onClick={() => router.replace('/collections')}
                  className="w-full rounded-lg border border-cv-border px-4 py-2 text-sm font-medium text-cv-neutral transition-colors hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
