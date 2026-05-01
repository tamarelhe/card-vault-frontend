import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CardVault',
  description: 'Manage your trading card collection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
