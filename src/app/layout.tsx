'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/src/lib/utils';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
